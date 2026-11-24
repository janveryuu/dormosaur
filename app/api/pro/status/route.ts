import { NextResponse } from 'next/server'
import { apiError, requireAuthenticated } from '@/lib/api-security'
import { PLANS, TRIAL_DAYS, getProStatus, referenceCode } from '@/lib/pro'

export const runtime = 'nodejs'

/** The student's Pro status, free usage left, plans and personal payment reference. */
export async function GET() {
  try {
    const { user } = await requireAuthenticated('pro-status', 60)
    const status = await getProStatus(user.id)
    return NextResponse.json({ success: true, ...status, referenceCode: referenceCode(user.id), plans: PLANS, trialDays: TRIAL_DAYS }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return apiError(error, 'We could not check your Pro status.')
  }
}
