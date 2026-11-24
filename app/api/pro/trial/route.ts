import { NextResponse } from 'next/server'
import { InputError, apiError, requireAuthenticated } from '@/lib/api-security'
import { PLANS, TRIAL_DAYS, getProStatus, referenceCode, startTrial } from '@/lib/pro'

export const runtime = 'nodejs'

/** Starts the one-per-account 7-day free trial. Requires a confirmed email address. */
export async function POST() {
  try {
    const { user } = await requireAuthenticated('pro-trial', 5)
    const confirmed = Boolean(user.email_confirmed_at || (user as { confirmed_at?: string | null }).confirmed_at)
    if (user.email && !confirmed) {
      throw new InputError('Please confirm your email address before starting your free trial.', 403)
    }
    await startTrial(user.id)
    const status = await getProStatus(user.id)
    return NextResponse.json({ success: true, ...status, referenceCode: referenceCode(user.id), plans: PLANS, trialDays: TRIAL_DAYS }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return apiError(error, 'We could not start your trial. Please try again.')
  }
}
