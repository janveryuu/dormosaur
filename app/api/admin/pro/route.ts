import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { logActivity } from '@/lib/activity-logger'
import { apiError, InputError, isStrictUuid, readJson } from '@/lib/api-security'
import { grantPlan, isPlan, revokePro } from '@/lib/pro'

export const runtime = 'nodejs'

/** Manually give a plan to a student (gifts, fixes) or end their Pro now (refunds). */
export async function POST(req: Request) {
  try {
    const adminUser = await requireAdminApi(req)
    const body = await readJson(req, 2048)
    const userId = isStrictUuid(body.userId) ? body.userId.trim() : ''
    if (!userId) throw new InputError('Unknown student.')
    if (body.action === 'grant') {
      if (!isPlan(body.plan)) throw new InputError('Choose a plan.')
      await grantPlan(userId, body.plan, { source: 'manual', by: adminUser.id })
      await logActivity({
        eventType: 'pro_granted',
        description: `Granted manual Pro (${body.plan}) to student account.`,
        relatedUserId: userId,
        performedBy: adminUser.id,
        metadata: { plan: body.plan },
      })
    } else if (body.action === 'revoke') {
      await revokePro(userId)
      await logActivity({
        eventType: 'pro_revoked',
        description: 'Revoked active Pro access for student account.',
        relatedUserId: userId,
        performedBy: adminUser.id,
      })
    } else throw new InputError('Choose grant or revoke.')
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error, 'Pro could not be updated. Please try again.')
  }
}
