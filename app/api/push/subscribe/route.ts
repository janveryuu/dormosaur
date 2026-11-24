import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { upsertPushSubscription, deletePushSubscriptionByEndpoint, updateSubscriptionLastSeen } from '@/lib/db'
import { apiError, InputError, readJson, requireAuthenticated } from '@/lib/api-security'
import { validatePushSubscription, validExpoPushToken, validPushEndpoint } from '@/lib/push-validation'

export const runtime = 'nodejs'

// Configure VAPID details
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

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticated('push-subscribe', 5)
    const { endpoint, keys, deviceLabel } = validatePushSubscription(await readJson(req, 8192))

    // 1. Upsert subscription row in database
    const record = await upsertPushSubscription(supabase, user.id, {
      endpoint,
      keys,
      deviceLabel: deviceLabel || 'Web Browser',
    })

    // 2. Immediately send instant test push to THIS specific subscription
    const testPushPayload = JSON.stringify({
      title: 'Dormosaur',
      body: "You're all set — notifications are on for this device.",
      tag: 'test-push-confirmation',
      icon: '/android-chrome-192x192.png',
      badge: '/apple-icon.png',
      data: { url: '/' },
    })

    try {
      await webpush.sendNotification({ endpoint, keys }, testPushPayload, { timeout: 8000, TTL: 60 })
      await updateSubscriptionLastSeen(supabase, endpoint, user.id)
    } catch (pushErr: unknown) {
      const statusCode = (pushErr as { statusCode?: number }).statusCode
      // If 404/410, endpoint is invalid or revoked — delete row and report failure
      if (statusCode === 404 || statusCode === 410) {
        await deletePushSubscriptionByEndpoint(supabase, user.id, endpoint)
        return NextResponse.json(
          { error: "Couldn't confirm that device — try enabling again." },
          { status: 400 }
        )
      }
      console.warn('[Web Push]', { category: 'confirmation_failed', status: statusCode ?? null })
    }

    return NextResponse.json({
      success: true,
      deviceLabel: record?.device_label || deviceLabel || 'Web Browser',
      subscriptionId: record?.id || endpoint,
    })
  } catch (err: unknown) {
    return apiError(err, 'We could not enable notifications on this device. Please try again.')
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticated('push-remove', 10)
    const { endpoint } = await readJson(req, 4096)
    if (!validPushEndpoint(endpoint) && !validExpoPushToken(endpoint)) {
      throw new InputError('Please choose a valid notification device.')
    }

    await deletePushSubscriptionByEndpoint(supabase, user.id, endpoint)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return apiError(err, 'We could not remove this notification device. Please try again.')
  }
}
