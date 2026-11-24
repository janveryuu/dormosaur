'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  AlarmClock,
  ChefHat,
  Globe2,
  LayoutGrid,
  Settings,
  Users,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MOBILE_NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutGrid },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/payments', label: 'Payments', icon: Wallet },
  { href: '/admin/schedules', label: 'Schedules', icon: AlarmClock },
  { href: '/admin/kitchen', label: 'Kitchen', icon: ChefHat },
  { href: '/admin/countries', label: 'Countries', icon: Globe2 },
  { href: '/admin/activity', label: 'Activity', icon: Activity },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminMobileNav({ pendingPayments = 0 }: { pendingPayments?: number }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin mobile navigation" className="fixed bottom-0 left-0 right-0 z-50 block border-t border-border bg-card/95 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
      <ul className="flex items-center justify-around gap-1 overflow-x-auto no-scrollbar">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          const Icon = item.icon
          const showBadge = item.href === '/admin/payments' && pendingPayments > 0
          return (
            <li key={item.href} className="flex-1 min-w-[60px]">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-xl py-1.5 px-1 text-center transition-colors',
                  active ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span className="relative">
                  <Icon className="size-5 shrink-0" strokeWidth={active ? 2.3 : 1.8} />
                  {showBadge && (
                    <span
                      aria-label={`${pendingPayments} pending payments`}
                      className="absolute -top-1.5 -right-2.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold leading-4 text-white"
                    >
                      {pendingPayments > 99 ? '99+' : pendingPayments}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 text-[10px] truncate max-w-full">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
