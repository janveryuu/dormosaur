'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  BellRing,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  CookingPot,
  House,
  Sparkles,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSchedule } from '@/components/schedule-provider'
import { IOS_SPRING_SNAPPY, LAYOUT_SPRING } from '@/lib/springs'

// 5 Essential Mobile Tabs — direct 1-tap access to primary surfaces
const mobileTabs = [
  { href: '/dashboard', label: 'Today', icon: House },
  { href: '/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/deadlines', label: 'Deadlines', icon: CalendarClock },
  { href: '/alarms', label: 'Alarms', icon: BellRing },
  { href: '/kitchen', label: 'Kitchen', icon: CookingPot },
]

// Desktop Sidebar Navigation
const desktopTabs = [
  { href: '/dashboard', label: 'Today', icon: House },
  { href: '/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/alarms', label: 'Alarms', icon: BellRing },
  { href: '/deadlines', label: 'Deadlines', icon: CalendarClock },
  { href: '/kitchen', label: 'Kitchen', icon: CookingPot },
  { href: '/profile', label: 'Profile', icon: User },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppNav() {
  const pathname = usePathname()
  const { profile, deadlines, alarms } = useSchedule()

  const pendingDeadlinesCount = React.useMemo(() => {
    return deadlines.filter((d) => !d.completed).length
  }, [deadlines])

  const hasActiveAlarms = React.useMemo(() => {
    return alarms.some((a) => a.enabled)
  }, [alarms])

  const isSubRoute =
    pathname === '/profile' ||
    pathname.startsWith('/schedule/import') ||
    pathname.startsWith('/schedule/review') ||
    pathname.startsWith('/deadlines/import') ||
    pathname.startsWith('/deadlines/review') ||
    pathname.startsWith('/kitchen/')

  const isModalFlow =
    pathname.startsWith('/schedule/import') ||
    pathname.startsWith('/schedule/review') ||
    pathname.startsWith('/deadlines/import') ||
    pathname.startsWith('/deadlines/review')

  const backTarget = React.useMemo(() => {
    if (pathname.startsWith('/kitchen/')) return '/kitchen'
    if (pathname.startsWith('/schedule/review')) return '/schedule/import'
    if (pathname.startsWith('/schedule/import')) return '/schedule'
    if (pathname.startsWith('/deadlines/review')) return '/deadlines/import'
    if (pathname.startsWith('/deadlines/import')) return '/deadlines'
    if (pathname === '/profile') return '/dashboard'
    return '/dashboard'
  }, [pathname])

  const subRouteTitle = React.useMemo(() => {
    if (pathname.startsWith('/kitchen/')) return 'Recipe'
    if (pathname.startsWith('/schedule/review')) return 'Review Schedule'
    if (pathname.startsWith('/schedule/import')) return 'Import Schedule'
    if (pathname.startsWith('/deadlines/review')) return 'Review Deadlines'
    if (pathname.startsWith('/deadlines/import')) return 'Import Deadlines'
    if (pathname === '/profile') return 'Profile & Settings'
    return ''
  }, [pathname])

  return (
    <>
      {/* ── Mobile: Native Top App Bar (Edge-to-Edge with Safe-Area Glass) ── */}
      <header
        className="fixed top-0 inset-x-0 z-30 border-b border-border/40 bg-background/85 backdrop-blur-xl transition-all lg:hidden"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex h-14 items-center justify-between px-3.5">
          {/* Left: Brand Mark or Contextual Back */}
          {isSubRoute ? (
            <Link
              href={backTarget}
              className="-ml-1 flex items-center gap-0.5 rounded-full px-2 py-1.5 text-[15px] font-semibold text-primary transition-transform active:scale-95"
              aria-label={`Go back to ${backTarget}`}
            >
              <ChevronLeft className="size-5.5" strokeWidth={2.4} />
              <span>Back</span>
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 transition-transform active:scale-95"
              aria-label="Dormosaur Home"
            >
              <img
                src="/android-chrome-192x192.png"
                alt=""
                aria-hidden="true"
                className="size-7.5 rounded-xl object-cover shadow-2xs ring-1 ring-border/40"
              />
              <span className="text-[17px] font-black tracking-tight text-foreground">
                Dormosaur
              </span>
            </Link>
          )}

          {/* Center: Contextual Subroute Title */}
          {isSubRoute && (
            <div className="absolute left-1/2 -translate-x-1/2 max-w-[170px] truncate pointer-events-none">
              <span className="text-[15px] font-bold text-foreground">
                {subRouteTitle}
              </span>
            </div>
          )}

          {/* Right: Copilot Pill + Profile Avatar */}
          <div className="flex items-center gap-2">
            {/* AI Copilot trigger */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-dormosaur-ai'))}
              className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[12px] font-bold text-primary transition-all hover:bg-primary/20 active:scale-95"
              aria-label="Open Dormosaur AI Copilot"
            >
              <Sparkles className="size-3.5" />
              <span>Copilot</span>
            </button>

            {/* User Profile Avatar */}
            <Link
              href="/profile"
              className={cn(
                'relative flex size-8 items-center justify-center rounded-full border border-border/70 bg-card text-[12px] font-bold text-foreground shadow-2xs transition-transform active:scale-95',
                pathname === '/profile' && 'ring-2 ring-primary border-primary',
              )}
              aria-label="View Profile & Settings"
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-primary font-bold text-[11px]">
                  {profile.initials || 'ST'}
                </span>
              )}
              <span
                className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 ring-2 ring-card"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Mobile: Native Bottom Tab Bar (Edge-to-Edge) ───────────── */}
      <nav
        aria-label="Main navigation"
        className={cn(
          'fixed bottom-0 inset-x-0 z-40 border-t border-border/40 bg-card/90 px-2 pt-1.5 backdrop-blur-2xl transition-all lg:hidden',
          isModalFlow && 'hidden',
        )}
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
      >
        <div className="flex items-center justify-around">
          {mobileTabs.map((tab) => {
            const active = isActive(pathname, tab.href)
            const Icon = tab.icon

            const hasDeadlineBadge = tab.href === '/deadlines' && pendingDeadlinesCount > 0
            const hasAlarmDot = tab.href === '/alarms' && hasActiveAlarms

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className="relative flex flex-1 flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-colors select-none"
              >
                {/* Active tab background pill */}
                {active && (
                  <motion.span
                    layoutId="mobile-dock-active"
                    transition={LAYOUT_SPRING}
                    className="absolute inset-x-1.5 inset-y-0.5 rounded-2xl bg-primary/12 dark:bg-primary/20 border border-primary/20"
                    aria-hidden="true"
                  />
                )}

                <motion.span
                  whileTap={{ scale: 0.86 }}
                  transition={IOS_SPRING_SNAPPY}
                  className="relative z-10 flex flex-col items-center gap-0.5"
                >
                  <div className="relative flex items-center justify-center">
                    <Icon
                      className={cn(
                        'size-5 transition-colors duration-150',
                        active
                          ? 'text-primary fill-primary/20'
                          : 'text-muted-foreground',
                      )}
                      strokeWidth={active ? 2.3 : 1.8}
                    />

                    {/* Deadline count badge */}
                    {hasDeadlineBadge && (
                      <span className="absolute -top-1 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[8.5px] font-black text-white shadow-2xs">
                        {pendingDeadlinesCount > 9 ? '9+' : pendingDeadlinesCount}
                      </span>
                    )}

                    {/* Active alarm indicator dot */}
                    {hasAlarmDot && !hasDeadlineBadge && (
                      <span className="absolute -top-0.5 -right-1 flex size-1.5 rounded-full bg-emerald-500" />
                    )}
                  </div>

                  <span
                    className={cn(
                      'text-[10px] font-semibold tracking-tight transition-colors duration-150',
                      active ? 'text-primary font-bold' : 'text-muted-foreground',
                    )}
                  >
                    {tab.label}
                  </span>
                </motion.span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* ── Desktop: Floating Sidebar ─────────────────────────────── */}
      <aside className="fixed top-6 bottom-6 left-6 z-40 hidden w-60 flex-col rounded-4xl bg-card p-4 shadow-ios-lg lg:flex">
        <Link
          href="/"
          className="mb-6 flex items-center gap-2.5 px-2 pt-2"
          aria-label="Dormosaur home"
        >
          <img
            src="/android-chrome-192x192.png"
            alt=""
            aria-hidden="true"
            className="size-9 rounded-2xl object-cover shadow-ios-sm"
          />
          <span className="text-[19px] font-bold tracking-[-0.03em]">Dormosaur</span>
        </Link>

        <ul className="flex flex-col gap-0.5">
          {desktopTabs.map((tab) => {
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
