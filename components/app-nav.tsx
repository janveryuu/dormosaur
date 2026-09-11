'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { BellRing, CalendarDays, CookingPot, House, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSchedule } from '@/components/schedule-provider'
import { IOS_SPRING_SNAPPY, LAYOUT_SPRING } from '@/lib/springs'

// 5 tabs — Apple HIG recommends max 5 for bottom tab bars.
// "Deadlines" is folded into the Dashboard (Today tab) to reduce cognitive load.
const tabs = [
  { href: '/dashboard', label: 'Today',    icon: House },
  { href: '/schedule',  label: 'Schedule', icon: CalendarDays },
  { href: '/alarms',    label: 'Alarms',   icon: BellRing },
  { href: '/kitchen',   label: 'Kitchen',  icon: CookingPot },
  { href: '/profile',   label: 'Profile',  icon: User },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppNav() {
  const pathname = usePathname()
  const { profile } = useSchedule()

  return (
    <>
      {/* ── Mobile: iOS-style tab bar ─────────────────────────────── */}
      <nav
        aria-label="Main"
        className="ios-glass fixed inset-x-0 bottom-0 z-40 border-t border-separator pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="flex items-stretch">
          {tabs.map((tab) => {
            const active = isActive(pathname, tab.href)
            const Icon = tab.icon
            return (
              <li key={tab.href} className="relative flex-1">
                {/* Active tab background pill — shared layoutId for smooth transition */}
                {active && (
                  <motion.span
                    layoutId="mobile-tab-bg"
                    transition={LAYOUT_SPRING}
                    className="absolute inset-x-1 top-1.5 h-8 rounded-2xl bg-accent"
                    aria-hidden="true"
                  />
                )}
                <Link
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className="relative flex flex-col items-center gap-0.5 pt-2 pb-2"
                >
                  <motion.span
                    whileTap={active ? undefined : { scale: 0.82 }}
                    transition={IOS_SPRING_SNAPPY}
                  >
                    <Icon
                      className={cn(
                        'size-6 transition-colors duration-150',
                        active ? 'fill-primary/20 text-primary' : 'text-muted-foreground',
                      )}
                      strokeWidth={active ? 2.2 : 1.7}
                    />
                  </motion.span>
                  <span
                    className={cn(
                      'text-[10px] font-semibold tracking-[-0.005em] transition-colors duration-150',
                      active ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {tab.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ── Desktop: floating sidebar ─────────────────────────────── */}
      <aside className="fixed top-6 bottom-6 left-6 z-40 hidden w-60 flex-col rounded-4xl bg-card p-4 shadow-ios-lg lg:flex">
        <Link href="/" className="mb-6 flex items-center gap-2.5 px-2 pt-2" aria-label="Dormosaur home">
          <img
            src="/android-chrome-192x192.png"
            alt=""
            aria-hidden="true"
            className="size-9 rounded-2xl object-cover shadow-ios-sm"
          />
          <span className="text-[19px] font-bold tracking-[-0.03em]">Dormosaur</span>
        </Link>

        <ul className="flex flex-col gap-0.5">
          {tabs.map((tab) => {
            const active = isActive(pathname, tab.href)
            const Icon = tab.icon
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className="relative flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-fill"
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      transition={LAYOUT_SPRING}
                      className="absolute inset-0 rounded-2xl bg-accent"
                    />
                  )}
                  <Icon
                    className={cn(
                      'relative z-10 size-5 transition-colors',
                      active ? 'fill-primary/20 text-primary' : 'text-muted-foreground',
                    )}
                    strokeWidth={active ? 2.2 : 1.7}
                  />
                  <span
                    className={cn(
                      'relative z-10 text-[15px] font-medium tracking-[-0.015em] transition-colors',
                      active ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {tab.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>

        {/* User profile — bottom of sidebar */}
        <Link
          href="/profile"
          className="mt-auto flex items-center gap-3 rounded-3xl bg-fill p-3 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.name}
              className="size-9 shrink-0 rounded-full object-cover shadow-ios-sm"
            />
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground">
              {profile.initials || 'ST'}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-semibold tracking-[-0.015em]">
              {profile.name}
            </span>
            <span className="block truncate text-[12px] text-muted-foreground">
              {profile.school}
            </span>
          </span>
        </Link>
      </aside>
    </>
  )
}
