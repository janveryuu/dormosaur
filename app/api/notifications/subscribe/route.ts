import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { upsertPushSubscription } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sub = await req.json()
    if (!sub || !sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
      return NextResponse.json({ error: 'Invalid push subscription payload' }, { status: 400 })
    }

    await upsertPushSubscription(supabase, user.id, {
      endpoint: sub.endpoint,
      keys: sub.keys,
      deviceLabel: sub.deviceLabel,
    })

    return NextResponse.json({ success: true, message: 'Push subscription stored successfully.' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
