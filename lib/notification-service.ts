/**
 * lib/notification-service.ts
 * Decoupled Push Notification Service.
 * Decouples notification dispatch logic from Web Push delivery details.
 */

import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'
import { getUserPushSubscriptions, deletePushSubscription } from '@/lib/db'

// Configure VAPID details if set in environment
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@dormosaur.app'

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
  } catch (e) {
    console.warn('VAPID initialization notice:', e)
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
export async function sendClassReminder(payload: ClassReminderPayload): Promise<{
  successCount: number
  failureCount: number
}> {
  const { userId, title, body, tag = 'dormosaur-alarm', url = '/dashboard', data = {} } = payload

  let successCount = 0
  let failureCount = 0

  try {
    const supabase = await createClient()
    const subscriptions = await getUserPushSubscriptions(supabase, userId)

    if (subscriptions.length === 0) {
      return { successCount: 0, failureCount: 0 }
    }

    const pushPayload = JSON.stringify({
      title,
      body,
      tag,
      icon: '/icon-192.png',
      badge: '/badge-96.png',
      data: { ...data, url },
    })

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      }

      try {
        await webpush.sendNotification(pushSub, pushPayload)
        successCount++
      } catch (err: unknown) {
        failureCount++
        const statusCode = (err as { statusCode?: number }).statusCode
        // If 404 or 410, subscription is expired or unsubscribed — clean up from database
        if (statusCode === 404 || statusCode === 410) {
          console.warn(`Cleaning up expired push subscription endpoint: ${sub.endpoint.slice(0, 30)}...`)
          await deletePushSubscription(supabase, sub.endpoint).catch(() => {})
        } else {
          console.warn('Web push send error:', err)
        }
      }
    })

    await Promise.all(sendPromises)
  } catch (err) {
    console.warn('sendClassReminder notice:', err)
  }

  return { successCount, failureCount }
}
