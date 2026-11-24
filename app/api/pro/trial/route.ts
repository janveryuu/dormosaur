import { NextResponse } from 'next/server'
import { apiError, requireAuthenticated } from '@/lib/api-security'
import { PLANS, TRIAL_DAYS, getProStatus, referenceCode, startTrial } from '@/lib/pro'

export const runtime = 'nodejs'

/** Starts the one-per-account 7-day free trial. */
export async function POST() {
  try {
    const { user } = await requireAuthenticated('pro-trial', 5)
    await startTrial(user.id)
    const status = await getProStatus(user.id)
    return NextResponse.json({ success: true, ...status, referenceCode: referenceCode(user.id), plans: PLANS, trialDays: TRIAL_DAYS }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return apiError(error, 'We could not start your trial. Please try again.')
  }
}
