'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BellRing,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  CookingPot,
  House,
  Plus,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSchedule } from '@/components/schedule-provider'
import { IOS_SPRING_SNAPPY, LAYOUT_SPRING } from '@/lib/springs'

// 3 Main Essential Tabs for Mobile Floating Dock
const mobileMainTabs = [
  { href: '/dashboard', label: 'Today',    icon: House },
  { href: '/schedule',  label: 'Schedule', icon: CalendarDays },
  { href: '/alarms',    label: 'Alarms',   icon: BellRing },
]

// Desktop Sidebar Navigation
const desktopTabs = [
  { href: '/dashboard', label: 'Today',     icon: House },
  { href: '/schedule',  label: 'Schedule',  icon: CalendarDays },
  { href: '/alarms',    label: 'Alarms',    icon: BellRing },
  { href: '/deadlines', label: 'Deadlines', icon: CalendarClock },
  { href: '/kitchen',   label: 'Kitchen',   icon: CookingPot },
  { href: '/profile',   label: 'Profile',   icon: User },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppNav() {
  const pathname = usePathname()
  const { profile } = useSchedule()
  const [isPlusOpen, setIsPlusOpen] = React.useState(false)

  // Automatically close plus menu on route change
  React.useEffect(() => {
    setIsPlusOpen(false)
  }, [pathname])

  // Close plus menu on Escape key
  React.useEffect(() => {
    if (!isPlusOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPlusOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isPlusOpen])

  return (
    <>
      {/* ── Mobile: Premium Floating Dock (3 Main Tabs + Action Plus) ── */}
      <nav
        aria-label="Main navigation"
        className="fixed bottom-5 inset-x-0 mx-auto z-40 w-[calc(100%-2rem)] max-w-sm pointer-events-none lg:hidden"
        style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))' }}
      >
        <div className="pointer-events-auto flex items-center justify-between gap-1 rounded-full border border-border/70 bg-card/85 p-1.5 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_48px_-8px_rgba(0,0,0,0.65)] backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-black/[0.04] dark:ring-white/[0.08]">
          {/* 3 Main Tabs */}
          <div className="flex flex-1 items-center justify-around">
            {mobileMainTabs.map((tab) => {
              const active = isActive(pathname, tab.href)
              const Icon = tab.icon
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className="relative flex flex-1 flex-col items-center justify-center py-2 px-1 rounded-full transition-colors group select-none"
                >
                  {/* Active tab background pill — shared layoutId for smooth transition */}
                  {active && (
                    <motion.span
                      layoutId="mobile-dock-active"
                      transition={LAYOUT_SPRING}
                      className="absolute inset-0 rounded-full bg-primary/12 dark:bg-primary/20 border border-primary/20"
                      aria-hidden="true"
                    />
                  )}
                  <motion.span
                    whileTap={{ scale: 0.86 }}
                    transition={IOS_SPRING_SNAPPY}
                    className="relative z-10 flex flex-col items-center gap-0.5"
                  >
                    <Icon
                      className={cn(
                        'size-5 transition-colors duration-150',
                        active ? 'text-primary fill-primary/20' : 'text-muted-foreground group-hover:text-foreground',
                      )}
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                    <span
                      className={cn(
                        'text-[10px] font-semibold tracking-[-0.01em] transition-colors duration-150',
                        active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    >
                      {tab.label}
                    </span>
                  </motion.span>
                </Link>
              )
            })}
          </div>

          {/* Crisp Hairline Separator */}
          <div className="h-6 w-px bg-border/60 mx-1 shrink-0" aria-hidden="true" />

          {/* High-Craft Action Plus (+) Button */}
          <motion.button
            type="button"
            onClick={() => setIsPlusOpen(!isPlusOpen)}
            whileTap={{ scale: 0.88 }}
            transition={IOS_SPRING_SNAPPY}
            aria-label={isPlusOpen ? 'Close menu' : 'Open quick apps and Dormosaur AI'}
            aria-expanded={isPlusOpen}
            className={cn(
              'relative flex size-11 shrink-0 items-center justify-center rounded-full shadow-ios-sm transition-all duration-200',
              isPlusOpen
                ? 'bg-foreground text-background shadow-ios-md'
                : 'bg-primary text-primary-foreground hover:bg-primary/95 shadow-ios',
            )}
          >
            <motion.div
              animate={{ rotate: isPlusOpen ? 135 : 0 }}
              transition={IOS_SPRING_SNAPPY}
              className="flex items-center justify-center"
            >
              <Plus className="size-5" strokeWidth={2.4} />
            </motion.div>
            {/* Subtle live indicator badge when closed */}
            {!isPlusOpen && (
              <span className="absolute top-1 right-1 flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-300" />
              </span>
            )}
          </motion.button>
        </div>
      </nav>

      {/* ── Mobile: Action Plus Sheet Modal ── */}
      <AnimatePresence>
        {isPlusOpen && (
          <React.Fragment key="plus-action-menu">
            {/* Backdrop */}
            <motion.div
              key="plus-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsPlusOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
            />

            {/* Floating Action Sheet */}
            <motion.div
              key="plus-sheet-content"
              initial={{ opacity: 0, y: 30, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.94 }}
              transition={LAYOUT_SPRING}
              className="fixed inset-x-4 bottom-22 z-50 mx-auto max-w-sm overflow-hidden rounded-3xl border border-border/80 bg-card/95 p-3.5 shadow-[0_24px_60px_-10px_rgba(0,0,0,0.3)] backdrop-blur-2xl ring-1 ring-black/[0.05] dark:ring-white/[0.08] lg:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-1 pb-2.5 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-bold text-foreground">More & AI Copilot</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    Quick Access
                  </span>
                </div>
                <button
                  onClick={() => setIsPlusOpen(false)}
                  className="flex size-7 items-center justify-center rounded-full bg-fill text-muted-foreground transition-colors hover:text-foreground active:scale-90"
                  aria-label="Close"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              {/* 1. Dormosaur AI Hero Card (Replaces the floating button) */}
              <button
                type="button"
                onClick={() => {
                  setIsPlusOpen(false)
                  window.dispatchEvent(new CustomEvent('open-dormosaur-ai'))
                }}
                className="group relative w-full overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/8 to-accent/30 p-3.5 text-left transition-all hover:border-primary/60 active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-ios-sm">
                    <Sparkles className="size-5" />
                    <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-bold tracking-tight text-foreground">Dormosaur AI</span>
                      <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[9.5px] font-bold text-primary">
                        Llama 3
                      </span>
                    </div>
                    <p className="truncate text-[12px] text-muted-foreground mt-0.5">
                      Instant help for classes, alarms & meals
                    </p>
                  </div>
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <ChevronRight className="size-4" />
                  </div>
                </div>
              </button>

              {/* 2. Remaining Navigation Links: Kitchen, Deadlines, Profile */}
              <div className="mt-2.5 space-y-1 rounded-2xl bg-fill/50 p-1 border border-border/50">
                {/* Kitchen */}
                <Link
                  href="/kitchen"
                  onClick={() => setIsPlusOpen(false)}
                  className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-card active:scale-[0.98]"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/12 text-orange-600 dark:text-orange-400">
                    <CookingPot className="size-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-foreground">Kitchen & Meals</div>
                    <div className="text-[11px] text-muted-foreground">Recipes, dorm appliances & meal plans</div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                </Link>

                {/* Deadlines */}
                <Link
                  href="/deadlines"
                  onClick={() => setIsPlusOpen(false)}
                  className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-card active:scale-[0.98]"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-500/12 text-red-600 dark:text-red-400">
                    <CalendarClock className="size-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-foreground">Deadlines & Exams</div>
                    <div className="text-[11px] text-muted-foreground">Upcoming exams, assignments & tasks</div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                </Link>

                {/* Profile & Settings */}
                <Link
                  href="/profile"
                  onClick={() => setIsPlusOpen(false)}
                  className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-card active:scale-[0.98]"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/12 text-blue-600 dark:text-blue-400">
                    <User className="size-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-foreground">Profile & Settings</div>
                    <div className="text-[11px] text-muted-foreground">Account, dorm info & alarm settings</div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      {/* ── Desktop: Floating Sidebar ─────────────────────────────── */}
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
