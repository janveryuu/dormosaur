import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPushSubscriptions } from '@/lib/db'

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const devices = await getUserPushSubscriptions(supabase, user.id)

    return NextResponse.json({
      success: true,
      devices: devices.map((d) => ({
        id: d.id,
        deviceLabel: d.device_label || 'Web Browser',
        lastSeenAt: d.last_seen_at || d.created_at || new Date().toISOString(),
        endpoint: d.endpoint,
      })),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
