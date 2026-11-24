import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-auth'
import { logActivity } from '@/lib/activity-logger'
import { apiError, boundedText, InputError, isStrictUuid, readJson } from '@/lib/api-security'
import { reviewPayment } from '@/lib/pro-admin'

export const runtime = 'nodejs'

/** Approve or reject a pending Pro payment. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await requireAdminApi(req)
    const { id } = await params
    if (!isStrictUuid(id)) throw new InputError('Unknown payment.')
    const body = await readJson(req, 4096)
    const action = body.action
    if (action !== 'approve' && action !== 'reject') throw new InputError('Choose approve or reject.')
    const reason = action === 'reject' ? boundedText(body.reason, 200, 'reason', true) : undefined
    const { changed } = await reviewPayment(id, action, adminUser.id, reason)
    if (!changed) throw new InputError('This payment was already reviewed.', 409)
    await logActivity({
      eventType: action === 'approve' ? 'payment_approved' : 'payment_rejected',
      description: action === 'approve' ? `Approved Pro payment ${id}.` : `Rejected Pro payment ${id}.`,
      performedBy: adminUser.id,
      metadata: { paymentId: id, ...(reason ? { reason } : {}) },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error, 'That payment could not be updated. Please try again.')
  }
}
