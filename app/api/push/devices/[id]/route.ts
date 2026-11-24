import { NextRequest, NextResponse } from 'next/server'
import { deletePushSubscriptionById } from '@/lib/db'
import { apiError, isStrictUuid, requireAuthenticated } from '@/lib/api-security'

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await requireAuthenticated('push-devices', 30)
    const { id } = await context.params

    if (!isStrictUuid(id)) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 })
    }

    await deletePushSubscriptionById(supabase, user.id, id)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return apiError(err, 'We could not remove this notification device. Please try again.')
  }
}
