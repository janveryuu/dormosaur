import { NextRequest, NextResponse } from 'next/server'
import { upsertPushSubscription } from '@/lib/db'
import { apiError, readJson, requireAuthenticated } from '@/lib/api-security'
import { validatePushSubscription } from '@/lib/push-validation'

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticated('push-subscribe', 5)
    const sub = validatePushSubscription(await readJson(req, 8192))

    await upsertPushSubscription(supabase, user.id, {
      endpoint: sub.endpoint,
      keys: sub.keys,
      deviceLabel: sub.deviceLabel,
    })

    return NextResponse.json({ success: true, message: 'Push subscription stored successfully.' })
  } catch (err: unknown) {
    return apiError(err, 'We could not save this notification device. Please try again.')
  }
}
