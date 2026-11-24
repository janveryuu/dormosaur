import 'server-only'
import { createHash } from 'node:crypto'
import { InputError } from '@/lib/api-security'
import { getSupabaseAdminClient } from '@/lib/admin-db'

/**
 * Dormosaur Pro: plans, entitlements and free-tier limits.
 * Payments are manual (QR + receipt + admin approval); this module is the single
 * source of truth for "is this student Pro?" and for the server-side usage caps.
 */

export type PaidPlan = 'monthly' | 'semester' | 'lifetime'
export type Wallet = 'gcash' | 'maya' | 'maribank' | 'gotyme'
export type ProFeature = 'schedule_scan' | 'syllabus_scan' | 'copilot'

const DAY = 86_400_000
export const TRIAL_DAYS = 7

export const PLANS: Record<PaidPlan, { name: string; amount: number; days: number | null }> = {
  monthly: { name: 'Monthly', amount: 29, days: 30 },
  semester: { name: 'Semester', amount: 99, days: 183 },
  lifetime: { name: 'Lifetime', amount: 249, days: null },
}
export const WALLETS: Record<Wallet, string> = { gcash: 'GCash', maya: 'Maya', maribank: 'MariBank', gotyme: 'GoTyme' }

/** Free limits. "all" = once per account, "day" = per Philippine calendar day. */
export const FREE_LIMITS: Record<ProFeature, { limit: number; per: 'all' | 'day' }> = {
  schedule_scan: { limit: 1, per: 'all' },
  syllabus_scan: { limit: 1, per: 'all' },
  copilot: { limit: 5, per: 'day' },
}
/** Fair-use ceiling for Pro Copilot so one account cannot drain the AI budget. */
const PRO_COPILOT_DAILY = 100

export const isPlan = (v: unknown): v is PaidPlan => typeof v === 'string' && v in PLANS
export const isWallet = (v: unknown): v is Wallet => typeof v === 'string' && v in WALLETS

const manilaDay = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(d)
const periodOf = (feature: ProFeature) => (FREE_LIMITS[feature].per === 'day' ? manilaDay() : 'all')

type Entitlement = { plan: string; source: string; starts_at: string; ends_at: string | null; revoked_at: string | null }

export type ProStatus = {
  isPro: boolean
  plan: string | null
  source: string | null
  endsAt: string | null
  lifetime: boolean
  trialAvailable: boolean
  usage: Record<ProFeature, { used: number; limit: number; per: 'all' | 'day' }>
  pendingPayment: { id: string; plan: PaidPlan; amount: number; wallet: Wallet; createdAt: string } | null
  lastRejection: { reason: string; at: string } | null
}

function active(rows: Entitlement[], now = Date.now()) {
  return rows.filter(r => !r.revoked_at && Date.parse(r.starts_at) <= now && (r.ends_at === null || Date.parse(r.ends_at) > now))
}
/** Live now or queued to start later (a plan bought during another plan starts when it ends). */
function remaining(rows: Entitlement[], now = Date.now()) {
  return rows.filter(r => !r.revoked_at && (r.ends_at === null || Date.parse(r.ends_at) > now))
}

export async function getEntitlements(userId: string) {
  const { data, error } = await getSupabaseAdminClient().from('pro_entitlements')
    .select('plan,source,starts_at,ends_at,revoked_at').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw new Error('entitlements_unavailable')
  return (data ?? []) as Entitlement[]
}

/** True when the student has any active, unrevoked Pro period right now. */
export async function isPro(userId: string) {
  return active(await getEntitlements(userId)).length > 0
}

export async function getProStatus(userId: string): Promise<ProStatus> {
  const admin = getSupabaseAdminClient()
  const [rows, usageRes, paymentsRes] = await Promise.all([
    getEntitlements(userId),
    admin.from('pro_usage').select('feature,period,count').eq('user_id', userId),
    admin.from('pro_payments').select('id,plan,amount_php,wallet,status,reject_reason,created_at,reviewed_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
  ])
  if (usageRes.error || paymentsRes.error) throw new Error('status_unavailable')
  const now = Date.now()
  const live = active(rows, now)
  const lifetime = live.some(r => r.ends_at === null)
  // The latest end across current and queued periods (stacked purchases extend each other).
  const endsAt = lifetime || !live.length ? null : remaining(rows, now).reduce<string | null>((m, r) => (r.ends_at && (!m || r.ends_at > m) ? r.ends_at : m), null)
  const current = live.sort((a, b) => (b.ends_at ?? '9999') .localeCompare(a.ends_at ?? '9999'))[0]
  const usage = Object.fromEntries((Object.keys(FREE_LIMITS) as ProFeature[]).map(f => {
    const row = (usageRes.data ?? []).find(u => u.feature === f && u.period === periodOf(f))
    return [f, { used: row?.count ?? 0, limit: FREE_LIMITS[f].limit, per: FREE_LIMITS[f].per }]
  })) as ProStatus['usage']
  const payments = paymentsRes.data ?? []
  const pending = payments.find(p => p.status === 'pending')
  const latest = payments[0]
  return {
    isPro: live.length > 0,
    plan: current?.plan ?? null,
    source: current?.source ?? null,
    endsAt,
    lifetime,
    trialAvailable: !rows.some(r => r.source === 'trial'),
    usage,
    pendingPayment: pending ? { id: pending.id, plan: pending.plan, amount: pending.amount_php, wallet: pending.wallet, createdAt: pending.created_at } : null,
    lastRejection: latest?.status === 'rejected' ? { reason: latest.reject_reason || 'Payment could not be verified.', at: latest.reviewed_at || latest.created_at } : null,
  }
}

export class ProLimitError extends InputError {
  feature: ProFeature
  constructor(feature: ProFeature, message: string) {
    super(message, 402)
    this.feature = feature
  }
}

const LIMIT_MESSAGES: Record<ProFeature, string> = {
  schedule_scan: 'You’ve used your free schedule scan. Start your 7-day free Pro trial to scan again.',
  syllabus_scan: 'You’ve used your free syllabus scan. Try Pro free for 7 days to import more deadlines.',
  copilot: 'Dormo is out of free messages for today 🦕 Pro gets 100 a day. Try it free for 7 days.',
}

/**
 * Uses one unit of a limited feature, or throws ProLimitError (HTTP 402).
 * Returns a refund function to call if the AI request then fails.
 */
export async function consumeFeature(userId: string, feature: ProFeature): Promise<() => Promise<void>> {
  const admin = getSupabaseAdminClient()
  const pro = await isPro(userId)
  if (pro && feature !== 'copilot') return async () => {}
  const period = pro ? `pro-${manilaDay()}` : periodOf(feature)
  const limit = pro ? PRO_COPILOT_DAILY : FREE_LIMITS[feature].limit
  const { data, error } = await admin.rpc('pro_consume', { p_user: userId, p_feature: feature, p_period: period, p_limit: limit })
  if (error) throw new Error('usage_unavailable')
  if (data === -1) {
    if (pro) throw new InputError('You’ve reached today’s Copilot limit. It resets at midnight.', 429)
    throw new ProLimitError(feature, LIMIT_MESSAGES[feature])
  }
  return async () => { await admin.rpc('pro_refund', { p_user: userId, p_feature: feature, p_period: period }) }
}

/** Starts the one-per-account 7-day trial. */
export async function startTrial(userId: string) {
  const now = new Date()
  const { error } = await getSupabaseAdminClient().from('pro_entitlements').insert({
    user_id: userId, plan: 'trial', source: 'trial', starts_at: now.toISOString(), ends_at: new Date(now.getTime() + TRIAL_DAYS * DAY).toISOString(),
  })
  if (error?.code === '23505') throw new InputError('Your free trial has already been used.', 409)
  if (error) throw new Error('trial_failed')
}

/**
 * Grants a paid plan atomically via Postgres advisory-locked RPC (`pro_grant_plan`).
 * Falls back gracefully only if the RPC migration has not yet been applied.
 */
export async function grantPlan(userId: string, plan: PaidPlan, opts: { source: 'payment' | 'manual'; paymentId?: string; by?: string }) {
  const admin = getSupabaseAdminClient()
  const { error: rpcErr } = await admin.rpc('pro_grant_plan', {
    p_user: userId,
    p_plan: plan,
    p_source: opts.source,
    p_payment_id: opts.paymentId ?? null,
    p_by: opts.by ?? null,
  })
  if (!rpcErr || rpcErr.code === '23505') return
  if (rpcErr.code !== '42883' && rpcErr.code !== 'PGRST202') throw new Error('grant_failed')

  console.warn('[Pro Billing]', { category: 'pro_grant_rpc_missing' })
  const rows = await getEntitlements(userId)
  const now = Date.now()
  const latestEnd = remaining(rows, now).reduce((m, r) => (r.ends_at ? Math.max(m, Date.parse(r.ends_at)) : m), now)
  const days = PLANS[plan].days
  const starts = days === null ? now : latestEnd
  const { error } = await admin.from('pro_entitlements').insert({
    user_id: userId, plan, source: opts.source, payment_id: opts.paymentId ?? null, created_by: opts.by ?? null,
    starts_at: new Date(starts).toISOString(), ends_at: days === null ? null : new Date(starts + days * DAY).toISOString(),
  })
  if (error?.code === '23505') return
  if (error) throw new Error('grant_failed')
}

/** Ends every active Pro period now (refunds, mistakes). */
export async function revokePro(userId: string) {
  const { error } = await getSupabaseAdminClient().from('pro_entitlements').update({ revoked_at: new Date().toISOString() })
    .eq('user_id', userId).is('revoked_at', null)
  if (error) throw new Error('revoke_failed')
}

/**
 * Each student's personal payment reference, e.g. DORMO-4F7KQ2. Stable per account so
 * it can be shown before they pay; the admin matches it against the wallet message.
 */
export function referenceCode(userId: string) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const digest = createHash('sha256').update(`dormosaur-pro:${userId}`).digest()
  return `DORMO-${Array.from(digest.subarray(0, 6), b => alphabet[b % alphabet.length]).join('')}`
}
