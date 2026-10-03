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
import { validPushEndpoint } from '@/lib/push-validation'

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
  const { userId, title, body, tag = 'dormosaur-alarm', url = '/dashboard', data = {} } = payload

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
