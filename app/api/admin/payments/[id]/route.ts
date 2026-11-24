import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { apiError, boundedText, InputError, readJson } from '@/lib/api-security'
import { reviewPayment } from '@/lib/pro-admin'

export const runtime = 'nodejs'

function failure(error: unknown) {
  if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
    return NextResponse.json({ error: 'Administrator access is required.' }, { status: 403 })
  }
  return apiError(error, 'That payment could not be updated. Please try again.')
}

/** Approve or reject a pending Pro payment. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await requireAdminSession()
    const { id } = await params
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new InputError('Unknown payment.')
    const body = await readJson(req, 4096)
    const action = body.action
    if (action !== 'approve' && action !== 'reject') throw new InputError('Choose approve or reject.')
    const reason = action === 'reject' ? boundedText(body.reason, 200, 'reason', true) : undefined
    const { changed } = await reviewPayment(id, action, adminUser.id, reason)
    if (!changed) throw new InputError('This payment was already reviewed.', 409)
    return NextResponse.json({ success: true })
  } catch (error) { return failure(error) }
}
