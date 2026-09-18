'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpRight,
  BellRing,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ClipboardCheck,
  CookingPot,
  House,
  Menu,
  Plus,
  Sparkles,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSchedule } from '@/components/schedule-provider'

const mobileTabs = [
  { href: '/dashboard', label: 'Today', icon: House },
  { href: '/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/deadlines', label: 'Tasks', icon: ClipboardCheck },
  { href: '/profile', label: 'Profile', icon: User },
]

const desktopTabs = [
  { href: '/dashboard', label: 'Today', icon: House },
  { href: '/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/alarms', label: 'Alarms', icon: BellRing },
  { href: '/deadlines', label: 'Deadlines', icon: CalendarClock },
  { href: '/kitchen', label: 'Kitchen', icon: CookingPot },
  { href: '/profile', label: 'Profile', icon: User },
]

function isActive(pathname: string | null | undefined, href: string) {
  return Boolean(pathname && (pathname === href || pathname.startsWith(`${href}/`)))
}

export function AppNav() {
  const pathname = usePathname()
  const { profile, deadlines, alarms } = useSchedule()
  const [isQuickOpen, setIsQuickOpen] = React.useState(false)

  const isSubRoute = Boolean(
    pathname &&
      (pathname === '/profile' ||
        pathname.startsWith('/schedule/import') ||
        pathname.startsWith('/schedule/review') ||
        pathname.startsWith('/deadlines/import') ||
        pathname.startsWith('/deadlines/review') ||
        pathname.startsWith('/kitchen/')),
  )

  const backTarget = React.useMemo(() => {
    if (!pathname) return '/dashboard'
    if (pathname.startsWith('/kitchen/')) return '/kitchen'
    if (pathname.startsWith('/schedule/review')) return '/schedule/import'
    if (pathname.startsWith('/schedule/import')) return '/schedule'
    if (pathname.startsWith('/deadlines/review')) return '/deadlines/import'
    if (pathname.startsWith('/deadlines/import')) return '/deadlines'
    return '/dashboard'
  }, [pathname])

  const subRouteTitle = React.useMemo(() => {
    if (!pathname) return ''
    if (pathname.startsWith('/kitchen/')) return 'Recipe'
    if (pathname.startsWith('/schedule/review')) return 'Review schedule'
    if (pathname.startsWith('/schedule/import')) return 'Import schedule'
    if (pathname.startsWith('/deadlines/review')) return 'Review deadlines'
    if (pathname.startsWith('/deadlines/import')) return 'Import deadlines'
    if (pathname === '/profile') return 'Profile & settings'
    return ''
  }, [pathname])

  const backTargetLabel = React.useMemo(() => {
    if (!pathname) return 'Today'
    if (pathname.startsWith('/kitchen/')) return 'Kitchen'
    if (pathname.startsWith('/schedule/review')) return 'Import schedule'
    if (pathname.startsWith('/schedule/import')) return 'Schedule'
    if (pathname.startsWith('/deadlines/review')) return 'Import deadlines'
    if (pathname.startsWith('/deadlines/import')) return 'Deadlines'
    return 'Today'
  }, [pathname])

  const pendingDeadlinesCount = React.useMemo(
    () => deadlines.filter((deadline) => !deadline?.completed).length,
    [deadlines],
  )
  const hasActiveAlarms = React.useMemo(
    () => alarms.some((alarm) => alarm?.enabled),
    [alarms],
  )

  React.useEffect(() => {
    setIsQuickOpen(false)
  }, [pathname])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsQuickOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Keep the motion props stable during SSR and hydration. MotionConfig in the
  // root layout still honors prefers-reduced-motion without changing markup.
  const tapProps = { whileTap: { scale: 0.96 } }

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-30 border-b border-line/80 bg-background/94 backdrop-blur-md lg:hidden"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="relative flex h-[5.25rem] items-center justify-between px-4">
          {isSubRoute ? (
            <Link
              href={backTarget}
              aria-label={`Back to ${backTargetLabel}`}
              className="flex min-h-11 items-center gap-1 text-sm font-bold text-primary"
            >
              <ChevronLeft className="size-5" />
              Back
            </Link>
          ) : (
            <motion.button
              type="button"
              {...tapProps}
              onClick={() => setIsQuickOpen((open) => !open)}
              aria-label={isQuickOpen ? 'Close quick actions' : 'Open quick actions'}
              aria-expanded={isQuickOpen}
              aria-controls="mobile-quick-actions"
              aria-haspopup="menu"
              className="flex size-11 cursor-pointer items-center justify-center text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Menu className="size-7" strokeWidth={1.8} />
            </motion.button>
          )}

          {!isSubRoute && (
            <Link href="/dashboard" className="absolute left-1/2 flex min-h-11 items-center gap-2.5 -translate-x-1/2">
              <span>
                <span className="block text-[1.05rem] font-extrabold tracking-[-0.045em]">Dormosaur</span>
                <span className="hidden text-[0.62rem] font-medium text-muted-foreground sm:block">Plan. Study. Belong.</span>
              </span>
            </Link>
          )}

          {isSubRoute && (
            <span className="absolute left-1/2 max-w-[52%] -translate-x-1/2 truncate text-sm font-bold text-foreground">
              {subRouteTitle}
            </span>
          )}

          {!isSubRoute ? (
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('open-dormosaur-ai'))} aria-label="Open Dormosaur AI" className="flex h-12 cursor-pointer items-center gap-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <img src="/dormosaur-mascot-transparent.png" alt="" aria-hidden="true" width={40} height={40} className="size-10 object-contain" />
              <span className="hidden max-w-16 text-[0.62rem] font-bold leading-tight text-muted-foreground sm:block">A brighter you</span>
            </button>
          ) : (
            <Link href="/profile" aria-label="View profile and settings" className="relative flex size-11 cursor-pointer items-center justify-center rounded-2xl border border-line bg-field text-xs font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt={profile?.name || 'User'} width={44} height={44} className="size-11 rounded-2xl object-cover" /> : profile?.initials || 'ST'}
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-primary" aria-hidden="true" />
            </Link>
          )}
        </div>
      </header>

      <div className={cn('fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden', isSubRoute && 'hidden')}>
        <AnimatePresence>
          {isQuickOpen && (
            <>
              <motion.button
                type="button"
                aria-label="Close quick actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsQuickOpen(false)}
                className="fixed inset-0 z-0 cursor-pointer bg-night/45 backdrop-blur-[2px]"
              />
              <motion.div
                id="mobile-quick-actions"
                role="menu"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="absolute bottom-[calc(100%+0.75rem)] right-0 z-10 w-[min(19rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-line bg-card p-2 shadow-floating"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsQuickOpen(false)
                    window.dispatchEvent(new CustomEvent('open-dormosaur-ai'))
                  }}
                  className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-2xl border-b border-line px-3 text-left transition-colors hover:bg-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary"><Sparkles className="size-4" aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">Dormosaur AI</span>
                    <span className="block truncate text-xs text-muted-foreground">Campus helper and study tutor</span>
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </button>

                <QuickLink href="/alarms" icon={BellRing} title="Alarms" detail={hasActiveAlarms ? 'Active now' : 'Class reminders'} onClick={() => setIsQuickOpen(false)} />
                <QuickLink href="/kitchen" icon={CookingPot} title="Kitchen" detail="Dorm-friendly meals" onClick={() => setIsQuickOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="relative z-10 flex items-center gap-2">
          <nav aria-label="Main navigation" className="flex h-[4.5rem] min-w-0 flex-1 items-center gap-1 rounded-full border border-line bg-card p-1.5 shadow-floating">
            {mobileTabs.map((tab) => {
              const active = isActive(pathname, tab.href)
              const Icon = tab.icon
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-full px-1 text-[0.65rem] font-bold transition-[background-color,color,transform] duration-200 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97]',
                    active ? 'bg-primary text-primary-foreground shadow-soft' : 'text-muted-foreground hover:bg-fill hover:text-foreground',
                  )}
                >
                  <span className="relative">
                    <Icon className="size-[1.1rem]" strokeWidth={active ? 2.4 : 1.9} />
                    {tab.href === '/deadlines' && pendingDeadlinesCount > 0 && (
                      <span className="absolute -right-2 -top-2 flex min-w-4 items-center justify-center rounded-full bg-highlight px-1 text-[0.55rem] font-extrabold text-accent-foreground">
                        {pendingDeadlinesCount > 9 ? '9+' : pendingDeadlinesCount}
                      </span>
                    )}
                  </span>
                  {tab.label}
                </Link>
              )
            })}
          </nav>

          <motion.button
            type="button"
            {...tapProps}
            onClick={() => setIsQuickOpen((open) => !open)}
            aria-label={isQuickOpen ? 'Close quick actions' : 'Open quick actions'}
            aria-expanded={isQuickOpen}
            aria-controls="mobile-quick-actions"
            aria-haspopup="menu"
            className="flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-floating transition-[background-color,transform] duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95"
          >
            <span className="sr-only">{isQuickOpen ? 'Close quick actions' : 'Open quick actions'}</span>
            <Plus aria-hidden="true" className="size-8" strokeWidth={1.8} />
          </motion.button>
        </div>
      </div>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-line bg-background lg:flex lg:flex-col lg:px-7 lg:py-8">
        <Link href="/dashboard" className="flex min-h-12 items-center gap-3" aria-label="Dormosaur home">
          <img src="/android-chrome-192x192.png" alt="" aria-hidden="true" width={40} height={40} className="size-10 object-contain" />
          <span className="text-[1.35rem] font-extrabold tracking-[-0.055em]">Dormosaur</span>
        </Link>

        <div className="mt-12">
          <p className="route-label mb-3">Your week</p>
          <nav aria-label="Primary navigation" className="space-y-1">
            {desktopTabs.map((tab) => {
              const active = isActive(pathname, tab.href)
              const Icon = tab.icon
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative flex min-h-12 cursor-pointer items-center gap-3 border-l-2 px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active ? 'border-primary bg-fill text-primary' : 'border-transparent text-muted-foreground hover:border-line hover:bg-fill hover:text-foreground',
                  )}
                >
                  <Icon className="size-[1.1rem]" strokeWidth={active ? 2.4 : 1.9} />
                  <span>{tab.label}</span>
                  {tab.href === '/deadlines' && pendingDeadlinesCount > 0 && <span className="ml-auto text-xs tabular-nums text-primary">{pendingDeadlinesCount}</span>}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto space-y-5">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-dormosaur-ai'))}
            className="group flex min-h-14 w-full cursor-pointer items-center gap-3 border-t border-line pt-5 text-left focus-visible:ring-2 focus-visible:ring-ring"
          >
            <img src="/dormosaur-hi.png" alt="" aria-hidden="true" width={48} height={48} className="size-12 object-contain transition-transform duration-300 group-hover:-translate-y-1" />
            <span>
              <span className="block text-sm font-bold">Dormosaur AI</span>
              <span className="block text-xs text-muted-foreground">Your campus copilot</span>
            </span>
            <ArrowUpRight className="ml-auto size-4 text-muted-foreground" />
          </button>

          <Link href="/profile" className="flex min-h-14 cursor-pointer items-center gap-3 border-t border-line pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt={profile?.name || 'User'} width={36} height={36} className="size-9 rounded-full object-cover" /> : <span className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{profile?.initials || 'ST'}</span>}
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{profile?.name || 'Student'}</span>
              <span className="block truncate text-xs text-muted-foreground">{profile?.school || 'Profile & settings'}</span>
            </span>
          </Link>
        </div>
      </aside>
    </>
  )
}

function QuickLink({ href, icon: Icon, title, detail, onClick }: { href: string; icon: typeof BellRing; title: string; detail: string; onClick: () => void }) {
  return (
    <Link href={href} role="menuitem" onClick={onClick} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl px-3 transition-colors hover:bg-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="flex size-9 items-center justify-center rounded-xl bg-fill text-muted-foreground"><Icon className="size-4" aria-hidden="true" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{detail}</span>
      </span>
      <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}
