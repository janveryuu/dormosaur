'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { BellRing, CalendarDays, ChevronRight, Clock, CookingPot, MapPin } from 'lucide-react'
import { ScreenHeader, PullAffordance } from '@/components/ios/screen-header'
import { NextClassCard } from '@/components/dashboard/next-class-card'
import { ScheduleMealBanner } from '@/components/dashboard/schedule-meal-banner'
import { WeeklyDigestCard } from '@/components/dashboard/weekly-digest-card'
import { NotificationBanner } from '@/components/ios/notification-banner'
import { useSchedule } from '@/components/schedule-provider'
import { formatTime, recipes, subjectColorClass } from '@/lib/data'
import { getNextUpcomingClass } from '@/lib/schedule-engine'
import { DeadlineCard } from '@/components/schedule/deadline-card'
import { IOS_SPRING_SNAPPY } from '@/lib/springs'

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function DashboardPage() {
  const { classes, alarms, profile, deadlines } = useSchedule()
  const [banner, setBanner] = React.useState(false)

  const currentDayName = dayNames[new Date().getDay()]

  const nextClassResult = React.useMemo(() => {
    return getNextUpcomingClass(classes, new Date(), profile.timezone || 'Asia/Manila')
  }, [classes, profile.timezone])

  React.useEffect(() => {
    const show = setTimeout(() => setBanner(true), 1200)
    const hide = setTimeout(() => setBanner(false), 6500)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [])

  const today = classes.filter((c) => c.days.includes(currentDayName))
  const remainingToday = nextClassResult
    ? today.filter(
        (c) =>
          c.id !== nextClassResult.entry.id &&
          (c.start || '00:00') >= (nextClassResult.entry.start || '00:00')
      )
    : today
  const activeAlarms = alarms.filter((a) => a.enabled).length
  const pendingDeadlines = deadlines.filter((d) => !d.completed).slice(0, 2)
  const featured = recipes.slice(0, 3)

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      <NotificationBanner
        open={banner && Boolean(nextClassResult?.entry)}
        onClose={() => setBanner(false)}
        title={`${nextClassResult?.entry.subject || nextClassResult?.entry.code || 'Class'} ${
          nextClassResult?.status === 'in_progress' ? 'is in session' : 'starts soon'
        }`}
        body={`${nextClassResult?.entry.room || 'Online'}${
          nextClassResult?.entry.instructor && nextClassResult?.entry.instructor !== 'TBA'
            ? ` · ${nextClassResult?.entry.instructor}`
            : ''
        }`}
      />

      <PullAffordance />
      <ScreenHeader
        title="Today"
        eyebrow={dateLabel}
        subtitle={`Good morning, ${profile.name.split(' ')[0] || 'Student'}. You have ${today.length} classes and ${activeAlarms} alarms set.`}
        headerGraphic={
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="relative flex items-center justify-center shrink-0 -ml-6 sm:-ml-10"
          >
            <img
              src="/dormosaur-hi.png"
              alt=""
              aria-hidden="true"
              className="h-36 sm:h-44 md:h-48 w-auto object-contain filter drop-shadow-md"
            />
          </motion.div>
        }
      />

      <div className="flex flex-col gap-8">
        {nextClassResult ? (
          <NextClassCard entry={nextClassResult.entry} nextMeta={nextClassResult} />
        ) : (
          /* Empty state — directional, not generic icon badge */
          <section className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/80 bg-card/60 py-10 px-5 text-center shadow-ios-sm">
            <div>
              <h3 className="text-[17px] font-bold tracking-[-0.02em] text-foreground">
                No classes imported yet
              </h3>
              <p className="text-[13.5px] text-muted-foreground mt-1.5 max-w-[22rem] leading-snug">
                Paste your schedule from your registrar — we'll turn it into a clean timetable with automatic alarms.
              </p>
            </div>
            <Link
              href="/schedule/import"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-primary-foreground shadow-[0_8px_20px_-6px_rgba(31,111,80,0.4)] transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Import schedule
            </Link>
          </section>
        )}

        {/* Weekly digest / semester insights */}
        <WeeklyDigestCard />

        {/* Schedule-aware meal suggestions */}
        <ScheduleMealBanner />

        {pendingDeadlines.length > 0 && (
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-[21px] font-bold tracking-[-0.025em]">Upcoming deadlines</h2>
              <div className="flex items-center gap-3">
                <Link href="/deadlines/import" className="text-[13px] font-semibold text-primary hover:underline">
                  + Import
                </Link>
                <Link href="/deadlines" className="text-[14px] font-medium text-primary">
                  View all
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {pendingDeadlines.map((item) => (
                <DeadlineCard key={item.id} deadline={item} />
              ))}
            </div>
          </section>
        )}

        {remainingToday.length > 0 && (
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-[21px] font-bold tracking-[-0.025em]">Later today</h2>
              <Link href="/schedule" className="text-[14px] font-medium text-primary">
                See all
              </Link>
            </div>
            <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 lg:mx-0 lg:px-0">
              {remainingToday.map((entry) => {
                const color = subjectColorClass[entry.color]
                return (
                  <motion.article
                    key={entry.id}
                    whileTap={{ scale: 0.97 }}
                    transition={IOS_SPRING_SNAPPY}
                    className="w-[240px] shrink-0 snap-start rounded-3xl bg-card p-5 shadow-ios"
                  >
                    <span
                      className={`mb-3 block h-1.5 w-10 rounded-full ${color.bg}`}
                      aria-hidden="true"
                    />
                    <h3 className="text-[17px] leading-snug font-semibold tracking-[-0.02em]">
                      {entry.subject}
                    </h3>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">{entry.code}</p>
                    <div className="mt-4 flex flex-col gap-1.5 text-[13px] text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5 shrink-0" strokeWidth={2} />
                        <span className="tabular-nums">
                          {formatTime(entry.start)} – {formatTime(entry.end)}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0" strokeWidth={2} />
                        {entry.room}
                      </span>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          </section>
        )}

        {/* Quick-access tiles — clean, no colored icon badge */}
        <section className="grid gap-2.5 sm:grid-cols-3">
          <QuickTile
            href="/schedule"
            icon={<CalendarDays className="size-4.5 text-primary" strokeWidth={2} />}
            title="Schedule"
            detail={`${classes.length} classes this week`}
          />
          <QuickTile
            href="/alarms"
            icon={<BellRing className="size-4.5 text-primary" strokeWidth={2} />}
            title="Alarms"
            detail={`${activeAlarms} active today`}
          />
          <QuickTile
            href="/kitchen"
            icon={<CookingPot className="size-4.5 text-primary" strokeWidth={2} />}
            title="Kitchen"
            detail={`${recipes.length} dorm recipes`}
          />
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[21px] font-bold tracking-[-0.025em]">Quick bites</h2>
            <Link href="/kitchen" className="text-[14px] font-medium text-primary">
              Kitchen
            </Link>
          </div>
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 lg:mx-0 lg:px-0">
            {featured.map((recipe) => (
              <Link
                key={recipe.slug}
                href={`/kitchen/${recipe.slug}`}
                className="w-[200px] shrink-0 snap-start"
              >
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  transition={IOS_SPRING_SNAPPY}
                  className="overflow-hidden rounded-3xl bg-card shadow-ios"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={recipe.image || '/placeholder.svg'}
                      alt={recipe.title}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3.5">
                    <h3 className="text-[15px] leading-snug font-semibold tracking-[-0.015em]">
                      {recipe.title}
                    </h3>
                    <p className="mt-1 text-[12.5px] text-muted-foreground tabular-nums">
                      {recipe.minutes} min · {recipe.appliance}
                    </p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

// ─── Quick Tile — clean, no generic icon-in-badge ─────────────────────────────
function QuickTile({
  href,
  icon,
  title,
  detail,
}: {
  href: string
  icon: React.ReactNode
  title: string
  detail: string
}) {
  return (
    <Link href={href} className="block">
      <motion.div
        whileTap={{ scale: 0.97 }}
        transition={IOS_SPRING_SNAPPY}
        className="flex items-center gap-3.5 rounded-3xl bg-card px-4 py-3.5 shadow-ios border border-separator/40 hover:shadow-ios-lg transition-shadow"
      >
        {/* Icon sits flush — no colored rounded square container */}
        {icon}
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold tracking-[-0.015em]">{title}</span>
          <span className="block truncate text-[12.5px] text-muted-foreground">{detail}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
      </motion.div>
    </Link>
  )
}
