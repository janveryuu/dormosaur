import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deletePushSubscriptionById } from '@/lib/db'
import { apiError } from '@/lib/api-security'

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!id || id.length > 100) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 })
    }

    await deletePushSubscriptionById(supabase, user.id, id)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return apiError(err, 'We could not remove this notification device. Please try again.')
  }
}
