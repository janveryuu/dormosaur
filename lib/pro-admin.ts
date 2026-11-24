import 'server-only'
import { getSupabaseAdminClient } from '@/lib/admin-db'
import { sendClassReminder } from '@/lib/notification-service'
import { PLANS, WALLETS, grantPlan, type PaidPlan, type Wallet } from '@/lib/pro'

export type AdminPayment = {
  id: string
  userId: string
  email: string
  name: string
  plan: PaidPlan
  planName: string
  amount: number
  wallet: Wallet
  walletName: string
  referenceCode: string
  transactionRef: string
  status: 'pending' | 'approved' | 'rejected'
  rejectReason: string | null
  createdAt: string
  reviewedAt: string | null
  receiptUrl: string | null
  history: { approved: number; rejected: number }
}

export type PaymentStatus = AdminPayment['status']

async function lookupEmails(admin: ReturnType<typeof getSupabaseAdminClient>, userIds: string[]) {
  const emails = new Map<string, string>()
  for (let i = 0; i < userIds.length; i += 10) {
    const chunk = userIds.slice(i, i + 10)
    const results = await Promise.all(
      chunk.map(id => admin.auth.admin.getUserById(id).then(r => [id, r.data.user?.email ?? ''] as const).catch(() => [id, ''] as const)),
    )
    for (const [id, email] of results) emails.set(id, email)
  }
  return emails
}

/** Payments for the admin review page, with short-lived signed receipt links. */
export async function listPayments(status: PaymentStatus, limit = 60): Promise<AdminPayment[]> {
  const admin = getSupabaseAdminClient()
  const { data, error } = await admin.from('pro_payments')
    .select('id,user_id,plan,amount_php,wallet,reference_code,transaction_ref,receipt_path,status,reject_reason,created_at,reviewed_at')
    .eq('status', status).order('created_at', { ascending: status === 'pending' }).limit(limit)
  if (error) throw new Error('payments_unavailable')
  const rows = data ?? []
  if (!rows.length) return []
  const userIds = [...new Set(rows.map(r => r.user_id))]
  const [profiles, signed, history, emails] = await Promise.all([
    admin.from('profiles').select('id,name').in('id', userIds),
    admin.storage.from('receipts').createSignedUrls(rows.map(r => r.receipt_path), 60 * 30),
    admin.from('pro_payments').select('user_id,status').in('user_id', userIds).neq('status', 'pending'),
    lookupEmails(admin, userIds),
  ])
  return rows.map((r, i) => ({
    id: r.id,
    userId: r.user_id,
    email: emails.get(r.user_id) || '',
    name: profiles.data?.find(p => p.id === r.user_id)?.name || 'Student',
    plan: r.plan,
    planName: PLANS[r.plan as PaidPlan]?.name ?? r.plan,
    amount: r.amount_php,
    wallet: r.wallet,
    walletName: WALLETS[r.wallet as Wallet] ?? r.wallet,
    referenceCode: r.reference_code,
    transactionRef: r.transaction_ref,
    status: r.status,
    rejectReason: r.reject_reason,
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at,
    receiptUrl: signed.data?.[i]?.signedUrl ?? null,
    history: {
      approved: (history.data ?? []).filter(h => h.user_id === r.user_id && h.status === 'approved').length,
      rejected: (history.data ?? []).filter(h => h.user_id === r.user_id && h.status === 'rejected').length,
    },
  }))
}

export async function countPending() {
  const { count, error } = await getSupabaseAdminClient().from('pro_payments').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  if (error) return 0
  return count ?? 0
}

/**
 * Approve or reject a pending payment atomically via `pro_review_payment` RPC
 * so status updates and stacked Pro entitlement grants commit in one transaction.
 */
export async function reviewPayment(id: string, action: 'approve' | 'reject', adminId: string, reason?: string) {
  const admin = getSupabaseAdminClient()
  let targetUserId = ''
  let targetPlan: PaidPlan = 'monthly'

  const { data: rpcData, error: rpcErr } = await admin.rpc('pro_review_payment', {
    p_payment_id: id,
    p_action: action,
    p_admin_id: adminId,
    p_reason: reason ?? null,
  })

  if (!rpcErr) {
    const row = (Array.isArray(rpcData) ? rpcData[0] : rpcData) as { changed?: boolean; user_id?: string; plan?: string } | null
    if (!row?.changed || !row.user_id) return { changed: false }
    targetUserId = row.user_id
    targetPlan = (row.plan as PaidPlan) || 'monthly'
  } else {
    if (rpcErr.code !== '42883' && rpcErr.code !== 'PGRST202') throw new Error('review_failed')
    console.warn('[Pro Billing]', { category: 'pro_review_rpc_missing' })
    const { data, error } = await admin.from('pro_payments')
      .update({ status: action === 'approve' ? 'approved' : 'rejected', reject_reason: action === 'reject' ? reason : null, reviewed_by: adminId, reviewed_at: new Date().toISOString() })
      .eq('id', id).eq('status', 'pending').select('user_id,plan').maybeSingle()
    if (error) throw new Error('review_failed')
    if (!data) return { changed: false }
    if (action === 'approve') {
      try {
        await grantPlan(data.user_id, data.plan as PaidPlan, { source: 'payment', paymentId: id, by: adminId })
      } catch (grantErr) {
        await admin.from('pro_payments')
          .update({ status: 'pending', reject_reason: null, reviewed_by: null, reviewed_at: null })
          .eq('id', id).eq('status', 'approved')
        throw grantErr
      }
    }
    targetUserId = data.user_id
    targetPlan = data.plan as PaidPlan
  }

  const plan = PLANS[targetPlan]?.name ?? 'Pro'
  await sendClassReminder(action === 'approve'
    ? { userId: targetUserId, title: 'You’re Pro! 🦕', body: `Your ${plan} payment was approved. Enjoy everything Dormosaur Pro unlocks.`, tag: 'dormosaur-pro', url: '/pro' }
    : { userId: targetUserId, title: 'Payment needs another look', body: reason || 'We couldn’t verify your payment. Open Dormosaur to try again.', tag: 'dormosaur-pro', url: '/pro' },
  admin).catch(() => {})
  return { changed: true }
}
