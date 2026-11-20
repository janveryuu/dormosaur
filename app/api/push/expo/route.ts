import { NextResponse } from 'next/server'
import { upsertPushSubscription } from '@/lib/db'
import { apiError, InputError, readJson, requireAuthenticated } from '@/lib/api-security'
import { EXPO_KEY_PLACEHOLDER, validExpoPushToken } from '@/lib/push-validation'

/**
 * Registers a native Dormosaur app device (Expo push token).
 * Stored in push_subscriptions with the token as `endpoint` so the existing cron,
 * device list and cleanup paths keep working; key columns hold a placeholder.
 */
export async function POST(req: Request) {
  try {
    const { supabase, user } = await requireAuthenticated('push-subscribe', 5)
    const body = await readJson(req, 4096)
    if (!validExpoPushToken(body.token)) throw new InputError('This device token is invalid.')
    const deviceLabel = typeof body.deviceLabel === 'string' ? body.deviceLabel.trim().slice(0, 100) || 'Android' : 'Android'
    await upsertPushSubscription(supabase, user.id, {
      endpoint: body.token,
      keys: { p256dh: EXPO_KEY_PLACEHOLDER, auth: EXPO_KEY_PLACEHOLDER },
      deviceLabel: `Dormosaur app · ${deviceLabel}`,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error, 'We could not register this device.')
  }
}
