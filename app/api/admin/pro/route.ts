import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { apiError, InputError, readJson } from '@/lib/api-security'
import { grantPlan, isPlan, revokePro } from '@/lib/pro'

export const runtime = 'nodejs'

function failure(error: unknown) {
  if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
    return NextResponse.json({ error: 'Administrator access is required.' }, { status: 403 })
  }
  return apiError(error, 'Pro could not be updated. Please try again.')
}

/** Manually give a plan to a student (gifts, fixes) or end their Pro now (refunds). */
export async function POST(req: Request) {
  try {
    const adminUser = await requireAdminSession()
    const body = await readJson(req, 2048)
    const userId = typeof body.userId === 'string' && /^[0-9a-f-]{36}$/i.test(body.userId) ? body.userId : ''
    if (!userId) throw new InputError('Unknown student.')
    if (body.action === 'grant') {
      if (!isPlan(body.plan)) throw new InputError('Choose a plan.')
      await grantPlan(userId, body.plan, { source: 'manual', by: adminUser.id })
    } else if (body.action === 'revoke') {
      await revokePro(userId)
    } else throw new InputError('Choose grant or revoke.')
    return NextResponse.json({ success: true })
  } catch (error) { return failure(error) }
}
