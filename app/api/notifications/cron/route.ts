import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendClassReminder } from '@/lib/notification-service'
import { getUserProfile, getClasses, getAlarms, getDeadlines } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    // 0. Verify Vercel Cron Secret authorization if configured
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const authHeader = req.headers.get('authorization')
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized cron request.' }, { status: 401 })
      }
    }

    const supabase = await createClient()

    // 1. Get current logged in user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: true, message: 'Cron check complete, no active session.' })
    }

    // 2. Fetch user's profile, classes, alarms, and deadlines
    const [profile, classesList, alarmsList, deadlinesList] = await Promise.all([
      getUserProfile(supabase, user.id),
      getClasses(supabase, user.id),
      getAlarms(supabase, user.id),
      getDeadlines(supabase, user.id),
    ])

    const userTimezone = profile?.timezone || 'Asia/Manila'
    const activeAlarms = alarmsList.filter((a) => a.enabled)
    const pendingDeadlines = deadlinesList.filter((d) => !d.completed)

    let notificationsDispatched = 0
    const now = new Date()

    // ─── 3. Process Class Alarms ─────────────────────────────────────────────
    if (activeAlarms.length > 0) {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        weekday: 'short',
      })

      const parts = formatter.formatToParts(now)
      const hourStr = parts.find((p) => p.type === 'hour')?.value || '00'
      const minStr = parts.find((p) => p.type === 'minute')?.value || '00'
      const nowMinutes = parseInt(hourStr, 10) * 60 + parseInt(minStr, 10)

      for (const alarm of activeAlarms) {
        const [aHour, aMin] = alarm.time.split(':').map(Number)
        const alarmStartMinutes = aHour * 60 + aMin
        const triggerMinutes = alarmStartMinutes - alarm.lead

        if (Math.abs(nowMinutes - triggerMinutes) <= 5) {
          const cls = classesList.find((c) => c.id === alarm.classId)
          const roomName = cls?.room || 'Dorm'
          const instructor = cls?.instructor ? ` • ${cls.instructor}` : ''
          const bodyText = `${alarm.subject} in ${alarm.lead}m — ${roomName}${instructor}`

          const res = await sendClassReminder({
            userId: user.id,
            title: `🔔 ${alarm.subject} Class Nudge`,
            body: bodyText,
            tag: `alarm-${alarm.id}-${Date.now()}`,
            url: '/dashboard',
          })

          if (res.successCount > 0) {
            notificationsDispatched++
          }
        }
      }
    }

    // ─── 4. Process Upcoming Deadlines (1 Day, 1 Hour, 3 Mins) ────────────────
    for (const deadline of pendingDeadlines) {
      const dueDate = new Date(deadline.dueDate)
      const diffMs = dueDate.getTime() - now.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))

      let title = ''
      let body = ''
      let milestoneTag = ''

      if (diffMinutes >= 1430 && diffMinutes <= 1450) {
        title = `⏰ 1 Day Left: ${deadline.title}`
        body = `Due tomorrow • Make sure your project is ready for submission!`
        milestoneTag = '1day'
      } else if (diffMinutes >= 55 && diffMinutes <= 65) {
        title = `🚨 1 Hour Left: ${deadline.title}`
        body = `Due in 60 minutes! Final stretch — finish and submit now.`
        milestoneTag = '1hour'
      } else if (diffMinutes >= 1 && diffMinutes <= 5) {
        title = `🔥 URGENT — 3 Mins Left: ${deadline.title}`
        body = `Due in 3 minutes! Submit your assignment right now!`
        milestoneTag = '3mins'
      }

      if (milestoneTag) {
        const res = await sendClassReminder({
          userId: user.id,
          title,
          body,
          tag: `deadline-${deadline.id}-${milestoneTag}-${Date.now()}`,
          url: '/schedule',
        })

        if (res.successCount > 0) {
          notificationsDispatched++
        }
      }
    }

    // ─── 5. Process Meal Gap Nudges ──────────────────────────────────────────
    const currentHour = now.getHours()
    // Meal gap check around 11:30 AM or 5:30 PM
    if ((currentHour === 11 || currentHour === 17) && classesList.length >= 2) {
      const res = await sendClassReminder({
        userId: user.id,
        title: '🍳 Meal Gap Ahead!',
        body: 'You have a break coming up between classes. Check out quick dorm recipes in the Kitchen!',
        tag: `meal-gap-${Date.now()}`,
        url: '/kitchen',
      })
      if (res.successCount > 0) {
        notificationsDispatched++
      }
    }

    return NextResponse.json({
      success: true,
      timezone: userTimezone,
      notificationsDispatched,
      activeAlarmsCount: activeAlarms.length,
      pendingDeadlinesCount: pendingDeadlines.length,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
