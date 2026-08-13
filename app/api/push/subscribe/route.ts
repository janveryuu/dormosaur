import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'
import { upsertPushSubscription, deletePushSubscriptionByEndpoint, updateSubscriptionLastSeen } from '@/lib/db'

// Configure VAPID details
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@dormosaur.app'

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
  } catch (e) {
    console.warn('VAPID init notice:', e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await req.json()
    const { endpoint, keys, deviceLabel } = payload || {}

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json({ error: 'Invalid push subscription payload' }, { status: 400 })
    }

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
      icon: '/icon-192.png',
      badge: '/badge-96.png',
      data: { url: '/dashboard' },
    })

    try {
      await webpush.sendNotification({ endpoint, keys }, testPushPayload)
      await updateSubscriptionLastSeen(supabase, endpoint)
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
      console.warn('Instant test push notice:', pushErr)
    }

    return NextResponse.json({
      success: true,
      deviceLabel: record?.device_label || deviceLabel || 'Web Browser',
      subscriptionId: record?.id || endpoint,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { endpoint } = await req.json().catch(() => ({}))
    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 })
    }

    await deletePushSubscriptionByEndpoint(supabase, user.id, endpoint)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
