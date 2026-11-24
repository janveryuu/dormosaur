/**
 * lib/notification-service.ts
 * Decoupled Push Notification Service.
 * Decouples notification dispatch logic from Web Push delivery details.
 */

import 'server-only'
import webpush from 'web-push'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getUserPushSubscriptions, deletePushSubscriptionByEndpoint } from '@/lib/db'
import { validExpoPushToken, validPushEndpoint } from '@/lib/push-validation'

// Configure VAPID details if set in environment
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@dormosaur.app'

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
  } catch {
    console.warn('[Web Push]', { category: 'vapid_configuration_invalid' })
  }
}

export type ClassReminderPayload = {
  userId: string
  title: string
  body: string
  tag?: string
  url?: string
  data?: Record<string, unknown>
}

/**
 * Decoupled Notification Dispatcher:
 * Sends class reminders to all active device subscriptions for a given user.
 */
export async function sendClassReminder(payload: ClassReminderPayload, client?: SupabaseClient): Promise<{
  successCount: number
  failureCount: number
}> {
  const { userId, title, body, tag = 'dormosaur-alarm', url = '/', data = {} } = payload
  const expoChannel = url === '/deadlines' ? 'deadlines' : url === '/pro' ? 'pro' : 'classes'

  let successCount = 0
  let failureCount = 0

  try {
    const supabase = client || await createClient()
    const subscriptions = await getUserPushSubscriptions(supabase, userId)

    if (subscriptions.length === 0) {
      return { successCount: 0, failureCount: 0 }
    }

    const pushPayload = JSON.stringify({
      title,
      body,
      tag,
      icon: '/android-chrome-192x192.png',
      badge: '/apple-icon.png',
      data: { ...data, url },
    })

    const sendPromises = subscriptions.map(async (sub) => {
      if (validExpoPushToken(sub.endpoint)) {
        // The native app schedules class alarms locally; only deadline-style reminders go over Expo push.
        if (url === '/schedule') return
        const result = await sendExpoPush(sub.endpoint, { title, body, channelId: expoChannel, data: { ...data, url } })
        if (result === 'sent') successCount++
        else {
          failureCount++
          if (result === 'gone') await deletePushSubscriptionByEndpoint(supabase, userId, sub.endpoint).catch(() => {})
        }
        return
      }
      if (!validPushEndpoint(sub.endpoint)) { failureCount++; return }
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      }

      try {
        await webpush.sendNotification(pushSub, pushPayload, { timeout: 8000, TTL: 300 })
        successCount++
      } catch (err: unknown) {
        failureCount++
        const statusCode = (err as { statusCode?: number }).statusCode
        // If 404 or 410, subscription is expired or unsubscribed — clean up from database
        if (statusCode === 404 || statusCode === 410) {
          await deletePushSubscriptionByEndpoint(supabase, userId, sub.endpoint).catch(() => {})
        } else {
          console.warn('[Web Push]', { category: 'delivery_failed', status: statusCode ?? null })
        }
      }
    })

    await Promise.all(sendPromises)
  } catch {
    failureCount++
    console.warn('[Web Push]', { category: 'subscription_unavailable' })
  }

  return { successCount, failureCount }
}

/** Sends one notification through the Expo push service. */
async function sendExpoPush(token: string, message: { title: string; body: string; channelId: string; data: Record<string, unknown> }): Promise<'sent' | 'gone' | 'failed'> {
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ to: token, sound: 'default', ...message }),
      signal: AbortSignal.timeout(8000),
    })
    const json = await res.json().catch(() => ({})) as { data?: { status?: string; details?: { error?: string } } }
    if (json.data?.status === 'ok') return 'sent'
    if (json.data?.details?.error === 'DeviceNotRegistered') return 'gone'
    console.warn('[Expo Push]', { category: 'delivery_failed', status: res.status })
    return 'failed'
  } catch {
    console.warn('[Expo Push]', { category: 'delivery_unavailable' })
    return 'failed'
  }
}
