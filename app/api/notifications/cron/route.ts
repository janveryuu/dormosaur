import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { getSupabaseAdminClient } from '@/lib/admin-db'
import { sendClassReminder } from '@/lib/notification-service'
import { getClasses, getAlarms, getDeadlines } from '@/lib/db'
import { dueReminders } from '@/lib/reminder-events'
import { clockAt, validTimeZone } from '@/lib/copilot/time'
import { validExpoPushToken } from '@/lib/push-validation'

export const runtime = 'nodejs'
export const maxDuration = 120
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'Scheduled reminders are not configured.' }, { status: 503 })
  const actual = Buffer.from(req.headers.get('authorization') || '')
  const expected = Buffer.from(`Bearer ${secret}`)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return NextResponse.json({ error: 'Unauthorized cron request.' }, { status: 401 })
  try {
    const supabase = getSupabaseAdminClient()
    // Fail closed before any send until the separately reviewed ledger is ready.
    const { error: ledgerError } = await supabase.from('notification_deliveries').select('event_key').limit(1)
    if (ledgerError) return NextResponse.json({ error: 'Scheduled reminders need delivery tracking configuration.' }, { status: 503 })
    const eligible = new Set<string>()
    const webPushUsers = new Set<string>()
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.from('push_subscriptions').select('user_id,endpoint').order('id').range(offset, offset + 999)
      if (error) throw new Error('subscription_read_failed')
      for (const row of data || []) {
        eligible.add(row.user_id)
        if (!row.endpoint || !validExpoPushToken(row.endpoint)) webPushUsers.add(row.user_id)
      }
      if (!data || data.length < 1000) break
    }
    const now = new Date()
    let usersProcessed = 0, notificationsDispatched = 0, failures = 0
    const userIds = [...eligible]
    for (let offset = 0; offset < userIds.length; offset += 100) {
      const { data: profiles, error } = await supabase.from('profiles').select('id,timezone').in('id', userIds.slice(offset, offset + 100))
      if (error) throw new Error('profile_read_failed')
      const profileList = profiles || []
      for (let idx = 0; idx < profileList.length; idx += 8) {
        const chunk = profileList.slice(idx, idx + 8)
        await Promise.all(chunk.map(async (profile) => {
          try {
            const timezone = validTimeZone(profile.timezone) || 'Asia/Manila'
            const { data: authData, error: authError } = await supabase.auth.admin.getUserById(profile.id)
            if (authError || !authData.user) throw new Error('preferences_read_failed')
            const preferences = authData.user.user_metadata || {}
            const minutes = clockAt(now, timezone).minutes
            if (preferences.quiet_hours === true && (minutes >= 23 * 60 || minutes < 7 * 60)) { usersProcessed++; return }
            const [classes, alarms, deadlines] = await Promise.all([getClasses(supabase, profile.id), getAlarms(supabase, profile.id), getDeadlines(supabase, profile.id, timezone)])
            for (const event of dueReminders(profile.id, classes, alarms, deadlines, now, timezone)) {
              if (event.url === '/schedule' && (!webPushUsers.has(profile.id) || preferences.class_alerts === false)) continue
              if (event.url === '/deadlines' && preferences.deadline_alerts === false) continue
              const { error: claimError } = await supabase.from('notification_deliveries').insert({ event_key: event.key, user_id: profile.id })
              if (claimError?.code === '23505') continue
              if (claimError) { failures++; continue } // Never send without a durable claim.
              const result = await sendClassReminder({ userId: profile.id, title: event.title, body: event.body, tag: event.key, url: event.url }, supabase)
              const { error: updateError } = await supabase.from('notification_deliveries').update({
                status: result.successCount ? 'sent' : 'failed', completed_at: new Date().toISOString(), success_count: result.successCount, failure_count: result.failureCount,
              }).eq('event_key', event.key).eq('user_id', profile.id)
              if (updateError || result.failureCount) failures++
              if (result.successCount) notificationsDispatched++
            }
            usersProcessed++
          } catch { failures++; console.warn('[Reminder Cron]', { category: 'user_processing_failed' }) }
        }))
      }
    }
    // Pro ending soon: one nudge per period. Isolated so it can never block class reminders.
    try {
      const soonFrom = new Date(now.getTime() + 24 * 3600_000).toISOString(), soonTo = new Date(now.getTime() + 72 * 3600_000).toISOString()
      const { data: ending } = await supabase.from('pro_entitlements').select('id,user_id,plan,ends_at')
        .is('revoked_at', null).gte('ends_at', soonFrom).lt('ends_at', soonTo).limit(1000)
      for (const row of ending ?? []) {
        // Skip if another period continues after this one (stacked purchase or lifetime).
        const { count } = await supabase.from('pro_entitlements').select('id', { count: 'exact', head: true })
          .eq('user_id', row.user_id).is('revoked_at', null).or(`ends_at.is.null,ends_at.gt.${row.ends_at}`)
        if (count) continue
        const key = `pro-ending:${row.id}`
        const { error: claimError } = await supabase.from('notification_deliveries').insert({ event_key: key, user_id: row.user_id })
        if (claimError) continue
        const trial = row.plan === 'trial'
        const result = await sendClassReminder({
          userId: row.user_id, tag: key, url: '/pro',
          title: trial ? 'Your Pro trial ends soon 🦕' : 'Your Pro plan ends soon',
          body: trial ? '2 days left of unlimited scans and Copilot. Keep Pro from ₱29.' : 'Renew now to keep unlimited scans, Copilot and meal plans.',
        }, supabase)
        await supabase.from('notification_deliveries').update({
          status: result.successCount ? 'sent' : 'failed', completed_at: new Date().toISOString(), success_count: result.successCount, failure_count: result.failureCount,
        }).eq('event_key', key).eq('user_id', row.user_id)
        if (result.successCount) notificationsDispatched++
      }
    } catch { console.warn('[Reminder Cron]', { category: 'pro_expiry_failed' }) }
    return NextResponse.json({ success: failures === 0, usersProcessed, notificationsDispatched, failures }, { status: failures ? 503 : 200 })
  } catch { console.warn('[Reminder Cron]', { category: 'cron_failed' }); return NextResponse.json({ error: 'Scheduled reminders could not complete. Please retry shortly.' }, { status: 503 }) }
}
