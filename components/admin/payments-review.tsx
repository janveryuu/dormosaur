'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Check, ExternalLink, Inbox, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { AdminPayment, PaymentStatus } from '@/lib/pro-admin'

const QUICK_REASONS = [
  'Amount received was less than the plan price.',
  'We could not find this payment in our wallet history.',
  'The receipt image is unclear. Please upload a clearer screenshot.',
  'The reference number does not match the receipt.',
]

const manila = (iso: string) => new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))

export function PaymentsReview({ payments, tab, focusId }: { payments: AdminPayment[]; tab: PaymentStatus; focusId?: string }) {
  useEffect(() => {
    if (focusId) document.getElementById(`payment-${focusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusId])

  if (!payments.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-border/40 bg-card p-12 text-center">
        <Inbox className="size-10 text-muted-foreground" />
        <p className="font-semibold">{tab === 'pending' ? 'All caught up' : `No ${tab} payments yet`}</p>
        <p className="text-sm text-muted-foreground">{tab === 'pending' ? 'New receipts appear here, and you’ll get an email for each one.' : 'Reviewed payments will be listed here.'}</p>
      </div>
    )
  }
  return <div className="grid gap-5">{payments.map(p => <PaymentCard key={p.id} p={p} focused={p.id === focusId} />)}</div>
}

function PaymentCard({ p, focused }: { p: AdminPayment; focused: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const act = async (action: 'approve' | 'reject') => {
    if (busy) return
    if (action === 'reject' && !reason.trim()) { setError('Add a short reason so the student knows what to fix.'); return }
    setBusy(action); setError('')
    try {
      const res = await fetch(`/api/admin/payments/${p.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, reason: reason.trim() }) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Something went wrong. Please try again.')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      setBusy(null)
    }
  }

  return (
    <article id={`payment-${p.id}`} className={`grid gap-5 rounded-3xl border bg-card p-5 shadow-ios md:grid-cols-[220px_1fr] ${focused ? 'border-primary ring-2 ring-primary/30' : 'border-border/40'}`}>
      {p.receiptUrl ? (
        <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-2xl bg-muted" title="Open full-size receipt">
          {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL from private storage */}
          <img src={p.receiptUrl} alt={`Receipt from ${p.name}`} className="h-72 w-full object-contain transition-transform group-hover:scale-[1.02]" />
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-semibold"><ExternalLink className="size-3" /> Zoom</span>
        </a>
      ) : <div className="flex h-72 items-center justify-center rounded-2xl bg-muted text-sm text-muted-foreground">Receipt unavailable</div>}

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <a href={`/admin/users/${p.userId}`} className="text-lg font-bold hover:underline">{p.name}</a>
            <p className="text-sm text-muted-foreground">{p.email}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold">₱{p.amount}</p>
            <p className="text-sm font-semibold text-muted-foreground">{p.planName}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <Item k="Wallet" v={p.walletName} />
          <Item k="Message code" v={p.referenceCode} mono />
          <Item k="Transaction no." v={p.transactionRef} mono />
          <Item k="Submitted" v={manila(p.createdAt)} />
          {p.reviewedAt && <Item k="Reviewed" v={manila(p.reviewedAt)} />}
          <Item k="History" v={`${p.history.approved} approved · ${p.history.rejected} rejected`} />
        </dl>

        {p.status === 'pending' ? (
          <>
            <p className="rounded-2xl bg-accent px-4 py-3 text-sm text-accent-foreground">
              Open your <b>{p.walletName}</b> and confirm <b>₱{p.amount}</b> arrived with message <b className="font-mono">{p.referenceCode}</b> or transaction <b className="font-mono">{p.transactionRef}</b>.
            </p>
            {rejecting && (
              <div className="grid gap-2">
                <div className="flex flex-wrap gap-2">
                  {QUICK_REASONS.map(r => (
                    <button key={r} type="button" onClick={() => setReason(r)} className="rounded-full bg-muted px-3 py-1 text-xs font-medium hover:bg-muted/70">{r}</button>
                  ))}
                </div>
                <Textarea value={reason} onChange={e => setReason(e.target.value.slice(0, 200))} placeholder="Reason the student will see" rows={2} />
              </div>
            )}
            {error && <p className="text-sm font-medium text-destructive" role="alert">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => act('approve')} disabled={!!busy} className="rounded-full px-5">
                <Check className="size-4" /> {busy === 'approve' ? 'Approving…' : 'Approve & turn on Pro'}
              </Button>
              {rejecting
                ? <Button variant="destructive" onClick={() => act('reject')} disabled={!!busy} className="rounded-full px-5"><X className="size-4" /> {busy === 'reject' ? 'Rejecting…' : 'Send rejection'}</Button>
                : <Button variant="outline" onClick={() => setRejecting(true)} disabled={!!busy} className="rounded-full px-5">Reject…</Button>}
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={p.status === 'approved' ? 'default' : 'destructive'}>{p.status === 'approved' ? 'Approved' : 'Rejected'}</Badge>
            {p.rejectReason && <span className="text-sm text-muted-foreground">{p.rejectReason}</span>}
          </div>
        )}
      </div>
    </article>
  )
}

function Item({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{k}</dt>
      <dd className={`font-semibold ${mono ? 'font-mono' : ''}`}>{v}</dd>
    </div>
  )
}
