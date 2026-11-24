import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { getSupabaseAdminClient } from '@/lib/admin-db'
import { logActivity } from '@/lib/activity-logger'
import { apiError, InputError, isStrictUuid, readJson } from '@/lib/api-security'

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdminApi(req)
    const { id } = await context.params
    if (!isStrictUuid(id)) {
      throw new InputError('Invalid student account ID.', 400)
    }
    if (id === adminUser.id) {
      throw new InputError('You cannot suspend your own administrator account.', 400)
    }
    const body = await readJson(req, 1024)
    if (typeof body.suspend !== 'boolean') {
      throw new InputError('Specify whether to suspend or reinstate this account.', 400)
    }

    const admin = getSupabaseAdminClient()
    const { data, error } = await admin.auth.admin.updateUserById(id, {
      ban_duration: body.suspend ? '876000h' : 'none',
    })
    if (error) {
      console.warn('[Admin Suspend]', { category: 'auth_ban_update_failed' })
      throw new Error('suspend_failed')
    }

    await logActivity({
      eventType: body.suspend ? 'user_suspended' : 'user_reinstated',
      description: `Administrator ${body.suspend ? 'suspended' : 'reinstated'} student account.`,
      relatedUserId: id,
      performedBy: adminUser.id,
      metadata: { suspend: body.suspend },
    })

    return NextResponse.json({
      success: true,
      suspended: body.suspend,
      bannedUntil: (data?.user as { banned_until?: string | null } | undefined)?.banned_until ?? null,
    })
  } catch (error) {
    return apiError(error, 'Could not update student account status. Please try again.')
  }
}
