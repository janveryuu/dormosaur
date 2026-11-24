import Link from 'next/link'
import { requireAdminSession } from '@/lib/admin-auth'
import { countPending, listPayments, type PaymentStatus } from '@/lib/pro-admin'
import { AdminTopbar } from '@/components/admin/admin-topbar'
import { PaymentsReview } from '@/components/admin/payments-review'
import { cn } from '@/lib/utils'

export const revalidate = 0

const TABS: { id: PaymentStatus; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ tab?: string; id?: string }> }) {
  const adminUser = await requireAdminSession()
  const params = await searchParams
  const tab: PaymentStatus = TABS.some(t => t.id === params.tab) ? (params.tab as PaymentStatus) : 'pending'
  const [payments, pending] = await Promise.all([listPayments(tab), countPending()])
  const adminInitials = adminUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div>
      <AdminTopbar
        title="Pro Payments"
        description="Check each receipt against your wallet history, then approve to turn on Pro."
        adminName={adminUser.name}
        adminInitials={adminInitials}
      />
      <nav aria-label="Payment status" className="mb-6 flex gap-2">
        {TABS.map(t => (
          <Link key={t.id} href={`/admin/payments?tab=${t.id}`}
            className={cn('rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
            {t.label}{t.id === 'pending' && pending > 0 ? ` · ${pending}` : ''}
          </Link>
        ))}
      </nav>
      <PaymentsReview payments={payments} tab={tab} focusId={params.id} />
    </div>
  )
}
