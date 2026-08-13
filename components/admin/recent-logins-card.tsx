import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { formatDateTime } from '@/lib/format-admin'

interface RecentLoginItem {
  id: string
  name: string
  email: string
  school: string
  lastSignIn: string
}

export function RecentLoginsCard({ logins }: { logins: RecentLoginItem[] }) {
  return (
    <div className="rounded-3xl bg-card p-5 shadow-ios border border-border/40">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-bold tracking-[-0.01em]">Recent Student Logins</h2>
        <Link
          href="/admin/activity"
          className="flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
        >
          View activity log
          <ArrowUpRight className="size-3.5" strokeWidth={2.2} />
        </Link>
      </div>
      <ul className="flex flex-col divide-y divide-border/40">
        {logins.map((login) => {
          const initials = login.name
            ? login.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
            : 'ST'

          return (
            <li key={login.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[12px] font-bold shadow-xs">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/users/${login.id}`} className="truncate text-[13.5px] font-bold tracking-[-0.01em] hover:underline block text-foreground">
                  {login.name}
                </Link>
                <p className="truncate text-[12px] text-muted-foreground">{login.school}</p>
              </div>
              <span className="shrink-0 text-[11.5px] font-medium text-muted-foreground">
                {formatDateTime(login.lastSignIn)}
              </span>
            </li>
          )
        })}
        {logins.length === 0 && (
          <li className="py-6 text-center text-xs text-muted-foreground">
            No recent logins recorded.
          </li>
        )}
      </ul>
    </div>
  )
}
