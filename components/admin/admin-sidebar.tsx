'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Activity,
  AlarmClock,
  ChefHat,
  Globe2,
  LayoutGrid,
  LogOut,
  Settings,
  Users,
  Wallet,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutGrid },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/payments', label: 'Pro Payments', icon: Wallet },
  { href: '/admin/schedules', label: 'Schedules & Alarms', icon: AlarmClock },
  { href: '/admin/kitchen', label: 'Kitchen Content', icon: ChefHat },
  { href: '/admin/countries', label: 'Countries & Localization', icon: Globe2 },
  { href: '/admin/activity', label: 'Activity Log', icon: Activity },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

interface AdminSidebarProps {
  adminName?: string
  adminInitials?: string
  pendingPayments?: number
}

export function AdminSidebar({
  adminName = 'Administrator',
  adminInitials = 'AD',
  pendingPayments = 0,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut().catch(() => {})
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <aside className="fixed top-6 bottom-6 left-6 z-40 hidden w-64 flex-col rounded-4xl bg-card p-4 shadow-ios-lg lg:flex border border-border/40">
      <Link href="/admin" className="mb-6 flex items-center gap-2.5 px-2 pt-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-ios-sm">
          <ChefHat className="size-5" strokeWidth={2.2} />
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-[17px] font-bold tracking-[-0.03em]">Dormosaur</span>
          <span className="text-[11px] font-semibold tracking-[0.02em] text-primary uppercase">
            Admin Panel
          </span>
        </span>
      </Link>

      <nav aria-label="Admin navigation" className="flex flex-1 flex-col gap-1 overflow-y-auto no-scrollbar">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className="relative flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors"
                >
                  {active && (
                    <motion.span
                      layoutId="admin-sidebar-active"
                      transition={{ type: 'spring', stiffness: 480, damping: 34 }}
                      className="absolute inset-0 rounded-2xl bg-primary"
                    />
                  )}
                  <Icon
                    className={cn(
                      'relative z-10 size-[18px] shrink-0',
                      active ? 'text-primary-foreground' : 'text-muted-foreground',
                    )}
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                  <span
                    className={cn(
                      'relative z-10 text-[14px] font-medium tracking-[-0.01em]',
                      active ? 'text-primary-foreground' : 'text-foreground',
                    )}
                  >
                    {item.label}
                  </span>
                  {item.href === '/admin/payments' && pendingPayments > 0 && (
                    <span className="relative z-10 ml-auto rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-white" aria-label={`${pendingPayments} pending`}>
                      {pendingPayments}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-4 flex flex-col gap-2">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-2xl bg-secondary/80 px-3 py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span>View Site</span>
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-2xl bg-secondary/40 px-3 py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="size-4" />
          <span>Sign Out</span>
        </button>

        <div className="flex items-center gap-3 rounded-3xl bg-fill p-3 border border-border/40">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground shadow-xs">
            {adminInitials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-semibold tracking-[-0.01em]">
              {adminName}
            </span>
            <span className="block truncate text-[11.5px] text-emerald-600 dark:text-emerald-400 font-medium">
              Verified Admin
            </span>
          </span>
        </div>
      </div>
    </aside>
  )
}
