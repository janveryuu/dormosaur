'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BellRing,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  CookingPot,
  House,
  Plus,
  Sparkles,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSchedule } from '@/components/schedule-provider'
import { IOS_SPRING_SNAPPY, LAYOUT_SPRING } from '@/lib/springs'

// 3 Curated Primary Mobile Tabs — direct 1-tap access to primary surfaces
const mobileTabs = [
  { href: '/dashboard', label: 'Today', icon: House },
  { href: '/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/deadlines', label: 'Deadlines', icon: CalendarClock },
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

function isActive(pathname: string | null | undefined, href: string) {
  if (!pathname) return false
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppNav() {
  const pathname = usePathname()
  const { profile, deadlines, alarms } = useSchedule()
  const [isPlusOpen, setIsPlusOpen] = React.useState(false)

  // Auto-close '+' popover on route change
  React.useEffect(() => {
    setIsPlusOpen(false)
  }, [pathname])

  // Close '+' popover on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPlusOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const isQuickHubActive = isActive(pathname, '/alarms') || isActive(pathname, '/kitchen')

  const pendingDeadlinesCount = React.useMemo(() => {
    if (!Array.isArray(deadlines)) return 0
    return deadlines.filter((d) => !d?.completed).length
  }, [deadlines])

  const hasActiveAlarms = React.useMemo(() => {
    if (!Array.isArray(alarms)) return false
    return alarms.some((a) => a?.enabled)
  }, [alarms])

  const isSubRoute = Boolean(
    pathname &&
      (pathname === '/profile' ||
        pathname.startsWith('/schedule/import') ||
        pathname.startsWith('/schedule/review') ||
        pathname.startsWith('/deadlines/import') ||
        pathname.startsWith('/deadlines/review') ||
        pathname.startsWith('/kitchen/')),
  )

  const isModalFlow = Boolean(
    pathname &&
      (pathname.startsWith('/schedule/import') ||
        pathname.startsWith('/schedule/review') ||
        pathname.startsWith('/deadlines/import') ||
        pathname.startsWith('/deadlines/review')),
  )

  const backTarget = React.useMemo(() => {
    if (!pathname) return '/dashboard'
    if (pathname.startsWith('/kitchen/')) return '/kitchen'
    if (pathname.startsWith('/schedule/review')) return '/schedule/import'
    if (pathname.startsWith('/schedule/import')) return '/schedule'
    if (pathname.startsWith('/deadlines/review')) return '/deadlines/import'
    if (pathname.startsWith('/deadlines/import')) return '/deadlines'
    if (pathname === '/profile') return '/dashboard'
    return '/dashboard'
  }, [pathname])

  const subRouteTitle = React.useMemo(() => {
    if (!pathname) return ''
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

          {/* Right: Profile Avatar (Copilot relocated to floating dock '+' menu) */}
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className={cn(
                'relative flex size-8 items-center justify-center rounded-full border border-border/70 bg-card text-[12px] font-bold text-foreground shadow-2xs transition-transform active:scale-95',
                pathname === '/profile' && 'ring-2 ring-primary border-primary',
              )}
              aria-label="View Profile & Settings"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile?.name || 'User'}
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-primary font-bold text-[11px]">
                  {profile?.initials || 'ST'}
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

      {/* ── Mobile: Premium Floating Island Dock (Pawi Project Spec) ── */}
      <div
        className={cn(
          'fixed bottom-[calc(env(safe-area-inset-bottom,0px)+14px)] inset-x-0 z-40 flex justify-center px-3.5 pointer-events-none lg:hidden',
          isModalFlow && 'hidden',
        )}
      >
        {/* Backdrop overlay for dismissing the '+' Quick Hub */}
        <AnimatePresence>
          {isPlusOpen && (
            <motion.div
              key="plus-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsPlusOpen(false)}
              className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs pointer-events-auto"
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        <div className="relative flex w-full max-w-[390px] items-center gap-2.5 pointer-events-auto">
          {/* ── Floating '+' Quick Hub Menu (Pawi Project Spec) ── */}
          <AnimatePresence>
            {isPlusOpen && (
              <motion.div
                key="plus-popover-menu"
                initial={{ opacity: 0, scale: 0.94, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 10 }}
                transition={{ type: 'spring', stiffness: 440, damping: 28 }}
                className="absolute bottom-full right-0 mb-3 w-[290px] overflow-hidden rounded-[28px] border border-black/[0.08] dark:border-white/[0.1] bg-white/98 dark:bg-[#151a17]/98 p-2.5 shadow-[0_24px_50px_-10px_rgba(0,0,0,0.22),0_1px_2px_rgba(255,255,255,0.06)_inset] backdrop-blur-2xl z-50"
              >
                <div className="flex flex-col gap-1">
                  {/* 1. Dormosaur AI Copilot (Hero Action - Relocated from header) */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setIsPlusOpen(false)
                      window.dispatchEvent(new CustomEvent('open-dormosaur-ai'))
                    }}
                    className="group flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-colors hover:bg-primary/8 active:bg-primary/12"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Sparkles className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-bold text-foreground">
                          Dormosaur AI
                        </span>
                        <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[9.5px] font-black text-primary uppercase tracking-wide">
                          Copilot
                        </span>
                      </div>
                      <p className="truncate text-[11.5px] text-muted-foreground">
                        Campus helper & study tutor
                      </p>
                    </div>
                  </motion.button>

                  <div className="my-0.5 h-px bg-border/40" />

                  {/* 2. Alarms */}
                  <Link
                    href="/alarms"
                    onClick={() => setIsPlusOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl p-2.5 transition-colors',
                      isActive(pathname, '/alarms')
                        ? 'bg-primary/12 text-primary font-medium'
                        : 'hover:bg-neutral-100 dark:hover:bg-white/5 active:bg-neutral-200/60 dark:active:bg-white/10 text-foreground',
                    )}
                  >
                    <div
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors',
                        isActive(pathname, '/alarms')
                          ? 'bg-primary/20 text-primary'
                          : 'bg-neutral-100 dark:bg-white/8 text-muted-foreground',
                      )}
                    >
                      <BellRing className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] font-bold">Alarms</span>
                        {hasActiveAlarms && (
                          <span className="flex items-center gap-1 text-[10.5px] font-bold text-emerald-500">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                            Active
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[11.5px] text-muted-foreground">
                        Walking lead-time class alarms
                      </p>
                    </div>
                  </Link>

                  <div className="my-0.5 h-px bg-border/40" />

                  {/* 3. Kitchen */}
                  <Link
                    href="/kitchen"
                    onClick={() => setIsPlusOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl p-2.5 transition-colors',
                      isActive(pathname, '/kitchen')
                        ? 'bg-primary/12 text-primary font-medium'
                        : 'hover:bg-neutral-100 dark:hover:bg-white/5 active:bg-neutral-200/60 dark:active:bg-white/10 text-foreground',
                    )}
                  >
                    <div
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors',
                        isActive(pathname, '/kitchen')
                          ? 'bg-primary/20 text-primary'
                          : 'bg-neutral-100 dark:bg-white/8 text-muted-foreground',
                      )}
                    >
                      <CookingPot className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[14px] font-bold">Kitchen</span>
                      <p className="truncate text-[11.5px] text-muted-foreground">
                        Microwave & kettle dorm recipes
                      </p>
                    </div>
                  </Link>

                  <div className="my-0.5 h-px bg-border/40" />

                  {/* 4. Profile & Settings */}
                  <Link
                    href="/profile"
                    onClick={() => setIsPlusOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl p-2.5 transition-colors',
                      pathname === '/profile'
                        ? 'bg-primary/12 text-primary font-medium'
                        : 'hover:bg-neutral-100 dark:hover:bg-white/5 active:bg-neutral-200/60 dark:active:bg-white/10 text-foreground',
                    )}
                  >
                    <div
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors',
                        pathname === '/profile'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-neutral-100 dark:bg-white/8 text-muted-foreground',
                      )}
                    >
                      <User className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[14px] font-bold">Profile & Settings</span>
                      <p className="truncate text-[11.5px] text-muted-foreground">
                        Dorm info, room & appliances
                      </p>
                    </div>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Element 1: Main Floating Navigation Pill Island ── */}
          <nav
            aria-label="Main navigation"
            className="relative flex h-[52px] flex-1 items-center justify-between rounded-full border border-black/[0.07] dark:border-white/[0.08] bg-white/95 dark:bg-[#151a17]/95 p-1.5 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_40px_-6px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          >
            {mobileTabs.map((tab) => {
              const active = isActive(pathname, tab.href)
              const Icon = tab.icon
              const hasDeadlineBadge = tab.href === '/deadlines' && pendingDeadlinesCount > 0

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setIsPlusOpen(false)}
                  className="relative flex flex-1 h-full items-center justify-center rounded-full select-none"
                >
                  {/* Active tab background capsule (smooth layout animation) */}
                  {active && (
                    <motion.span
                      layoutId="pawi-active-pill"
                      transition={{ type: 'spring', stiffness: 480, damping: 34 }}
                      className="absolute inset-0 rounded-full bg-primary/12 dark:bg-primary/22 border border-primary/20 shadow-2xs"
                      aria-hidden="true"
                    />
                  )}

                  <motion.div
                    whileTap={{ scale: 0.94 }}
                    transition={IOS_SPRING_SNAPPY}
                    className="relative z-10 flex items-center justify-center gap-1.5 px-2"
                  >
                    <div className="relative flex items-center justify-center">
                      <Icon
                        className={cn(
                          'size-4.5 transition-colors duration-150',
                          active
                            ? 'text-primary'
                            : 'text-[#505D55] dark:text-neutral-400',
                        )}
                        strokeWidth={active ? 2.3 : 1.9}
                      />

                      {/* Deadline count badge */}
                      {hasDeadlineBadge && (
                        <span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[8.5px] font-black text-white shadow-2xs font-mono tabular-nums">
                          {pendingDeadlinesCount > 9 ? '9+' : pendingDeadlinesCount}
                        </span>
                      )}
                    </div>

                    <span
                      className={cn(
                        'text-[13px] tracking-tight transition-colors duration-150',
                        active
                          ? 'text-primary font-bold'
                          : 'text-[#505D55] dark:text-neutral-400 font-semibold',
                      )}
                    >
                      {tab.label}
                    </span>
                  </motion.div>
                </Link>
              )
            })}
          </nav>

          {/* ── Element 2: Standalone Floating FAB (+) Button (Pawi Project Spec) ── */}
          <motion.button
            type="button"
            onClick={() => setIsPlusOpen((prev) => !prev)}
            whileTap={{ scale: 0.92 }}
            transition={IOS_SPRING_SNAPPY}
            className={cn(
              'relative flex size-[52px] shrink-0 items-center justify-center rounded-full transition-all duration-200 select-none',
              isPlusOpen
                ? 'bg-[#8E9F94] dark:bg-neutral-800 text-white dark:text-foreground shadow-md ring-1 ring-black/10'
                : isQuickHubActive
                  ? 'bg-primary text-primary-foreground shadow-[0_10px_25px_-3px_rgba(26,80,52,0.45)] ring-2 ring-primary/40'
                  : 'bg-primary text-primary-foreground shadow-[0_10px_25px_-3px_rgba(26,80,52,0.38),0_2px_6px_rgba(0,0,0,0.06)]',
            )}
            aria-label={isPlusOpen ? 'Close quick menu' : 'Open quick menu'}
            aria-expanded={isPlusOpen}
          >
            <motion.div
              animate={{ rotate: isPlusOpen ? 45 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            >
              <Plus className="size-6" strokeWidth={2.4} />
            </motion.div>

            {/* Indicator dot if Alarms or Kitchen is currently active */}
            {!isPlusOpen && isQuickHubActive && (
              <span className="absolute top-2 right-2 flex size-2 rounded-full bg-primary-foreground ring-2 ring-primary" />
            )}
          </motion.button>
        </div>
      </div>

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
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile?.name || 'User'}
              className="size-9 shrink-0 rounded-full object-cover shadow-ios-sm"
            />
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground">
              {profile?.initials || 'ST'}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-semibold tracking-[-0.015em]">
              {profile?.name}
            </span>
            <span className="block truncate text-[12px] text-muted-foreground">
              {profile?.school}
            </span>
          </span>
        </Link>
      </aside>
    </>
  )
}
