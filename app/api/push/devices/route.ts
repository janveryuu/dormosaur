import { NextResponse } from 'next/server'
import { getUserPushSubscriptions } from '@/lib/db'
import { apiError, requireAuthenticated } from '@/lib/api-security'

export async function GET() {
  try {
    const { supabase, user } = await requireAuthenticated('push-devices', 30)

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
    return apiError(err, 'We could not load your notification devices. Please try again.')
  }
}
