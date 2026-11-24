'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type Plan = 'monthly' | 'semester' | 'lifetime'
const PLAN_LABEL: Record<string, string> = { trial: '7-day trial', monthly: 'Monthly', semester: 'Semester', lifetime: 'Lifetime' }

/** Admin card on a student's page: current Pro status, manual grant and revoke. */
export function ProControl({ userId, isPro, plan, endsAt, lifetime }: { userId: string; isPro: boolean; plan: string | null; endsAt: string | null; lifetime: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmRevoke, setConfirmRevoke] = useState(false)

  const send = async (body: { action: 'grant'; plan: Plan } | { action: 'revoke' }) => {
    if (busy) return
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/admin/pro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, ...body }) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Something went wrong.')
      setConfirmRevoke(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setConfirmRevoke(false)
    } finally {
      setBusy(false)
    }
  }

  const until = lifetime ? 'forever' : endsAt ? new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium' }).format(new Date(endsAt)) : ''

  return (
    <section className="mb-6 flex flex-col gap-4 rounded-3xl border border-border/40 bg-card p-5 shadow-ios sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className={`flex size-10 items-center justify-center rounded-2xl ${isPro ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          <Crown className="size-5" />
        </span>
        <div>
          <p className="font-bold">{isPro ? `Pro · ${PLAN_LABEL[plan ?? ''] ?? 'Active'}` : 'Free plan'}</p>
          <p className="text-sm text-muted-foreground">{isPro ? `Active until ${until}` : 'No active Pro period'}</p>
          {error && <p className="text-sm font-medium text-destructive" role="alert">{error}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {(['monthly', 'semester', 'lifetime'] as Plan[]).map(p => (
          <Button key={p} variant="outline" size="sm" disabled={busy} className="rounded-full" onClick={() => send({ action: 'grant', plan: p })}>
            Give {PLAN_LABEL[p]}
          </Button>
        ))}
        {isPro && <Button variant="destructive" size="sm" disabled={busy} className="rounded-full" onClick={() => setConfirmRevoke(true)}>End Pro</Button>}
      </div>

      <AlertDialog open={confirmRevoke} onOpenChange={setConfirmRevoke}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this student’s Pro access?</AlertDialogTitle>
            <AlertDialogDescription>
              This revokes all active and queued Pro entitlements immediately. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); void send({ action: 'revoke' }) }}>
              {busy ? 'Revoking…' : 'End Pro'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
