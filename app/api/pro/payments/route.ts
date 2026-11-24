import { NextResponse } from 'next/server'
import { apiError, InputError, readJson, requireAuthenticated } from '@/lib/api-security'
import { getSupabaseAdminClient } from '@/lib/admin-db'
import { PLANS, TRIAL_DAYS, WALLETS, getProStatus, isPlan, isWallet, referenceCode } from '@/lib/pro'
import { sendPaymentAlert } from '@/lib/pro-email'

export const runtime = 'nodejs'

const MAX_RECEIPT = 900 * 1024

/**
 * Student submits proof of a QR payment. The receipt goes to the private
 * `receipts` bucket; Pro is granted only after an admin approves it.
 */
export async function POST(req: Request) {
  try {
    const { user } = await requireAuthenticated('pro-payment', 6)
    const body = await readJson(req, 1400 * 1024)
    const { plan, wallet } = body
    if (!isPlan(plan)) throw new InputError('Please choose a plan.')
    if (!isWallet(wallet)) throw new InputError('Please choose the wallet you paid with.')
    const transactionRef = typeof body.transactionRef === 'string' ? body.transactionRef.replace(/\s+/g, '').toUpperCase() : ''
    if (!/^[A-Z0-9-]{6,40}$/.test(transactionRef)) throw new InputError('Enter the reference number shown on your receipt (letters and numbers only).')
    const key = typeof body.idempotencyKey === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(body.idempotencyKey) ? body.idempotencyKey : ''
    if (!key) throw new InputError('Please try submitting again.')

    const admin = getSupabaseAdminClient()
    const ok = async () => NextResponse.json({ success: true, ...(await getProStatus(user.id)), referenceCode: referenceCode(user.id), plans: PLANS, trialDays: TRIAL_DAYS }, { headers: { 'Cache-Control': 'no-store' } })

    // Same submission retried after a dropped connection: return the original instead of a duplicate.
    const { data: existing } = await admin.from('pro_payments').select('id').eq('user_id', user.id).eq('idempotency_key', key).maybeSingle()
    if (existing) return ok()

    const match = typeof body.receipt === 'string' ? /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(body.receipt) : null
    if (!match) throw new InputError('Please attach a screenshot of your receipt.')
    const bytes = Buffer.from(match[1], 'base64')
    if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) throw new InputError('That file is not a valid image.')
    if (bytes.length > MAX_RECEIPT) throw new InputError('That screenshot is too large. Please try another one.', 413)

    const id = crypto.randomUUID()
    const path = `${user.id}/${id}.jpg`
    const { error: upErr } = await admin.storage.from('receipts').upload(path, bytes, { contentType: 'image/jpeg', upsert: false })
    if (upErr) throw new Error('receipt_upload_failed')

    const { error } = await admin.from('pro_payments').insert({
      id, user_id: user.id, plan, amount_php: PLANS[plan].amount, wallet, reference_code: referenceCode(user.id),
      transaction_ref: transactionRef, receipt_path: path, idempotency_key: key,
    })
    if (error) {
      await admin.storage.from('receipts').remove([path]).catch(() => {})
      if (error.code === '23505') {
        throw new InputError(error.message.includes('one_pending')
          ? 'You already have a payment under review. We’ll let you know soon.'
          : 'This receipt’s reference number was already submitted.', 409)
      }
      throw new Error('payment_insert_failed')
    }

    await sendPaymentAlert({
      paymentId: id, email: user.email ?? '', plan: PLANS[plan].name, amount: PLANS[plan].amount,
      wallet: WALLETS[wallet], transactionRef, referenceCode: referenceCode(user.id),
    }).catch(() => {})
    return ok()
  } catch (error) {
    return apiError(error, 'We could not submit your payment. Please try again.')
  }
}
