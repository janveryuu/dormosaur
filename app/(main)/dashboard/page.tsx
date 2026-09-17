'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  BellRing,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  Clock,
  Coffee,
  CookingPot,
  MapPin,
  Sparkles,
  User,
} from 'lucide-react'
import { ScreenHeader } from '@/components/ios/screen-header'
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
    const show = setTimeout(() => setBanner(true), 1400)
    const hide = setTimeout(() => setBanner(false), 7000)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [])

  const todayClasses = React.useMemo(() => {
    return classes
      .filter((c) => c.days.includes(currentDayName))
      .sort((a, b) => (a.start || '00:00').localeCompare(b.start || '00:00'))
  }, [classes, currentDayName])

  const activeAlarmsCount = alarms.filter((a) => a.enabled).length
  const allPendingDeadlines = React.useMemo(() => {
    return deadlines.filter((d) => !d.completed)
  }, [deadlines])
  const pendingDeadlines = allPendingDeadlines.slice(0, 3)
  const featuredRecipes = recipes.slice(0, 3)

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  // Calculate gaps between today's classes
  const todayWithGaps = React.useMemo(() => {
    const items: Array<
      | { type: 'class'; data: (typeof todayClasses)[number] }
      | { type: 'gap'; minutes: number; afterClass: string }
    > = []

    for (let i = 0; i < todayClasses.length; i++) {
      const current = todayClasses[i]
      items.push({ type: 'class', data: current })

      if (i < todayClasses.length - 1) {
        const next = todayClasses[i + 1]
        const [cEndH, cEndM] = current.end.split(':').map(Number)
        const [nStartH, nStartM] = next.start.split(':').map(Number)
        const endTotal = cEndH * 60 + cEndM
        const startTotal = nStartH * 60 + nStartM
        const gap = startTotal - endTotal

        if (gap >= 20) {
          items.push({ type: 'gap', minutes: gap, afterClass: current.subject })
        }
      }
    }
    return items
  }, [todayClasses])

  const firstName = profile.name ? profile.name.split(' ')[0] : 'Student'

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

      {/* Screen Title */}
      <ScreenHeader
        title="Today"
        eyebrow={dateLabel}
        subtitle={`Good morning, ${firstName}. ${todayClasses.length} ${
          todayClasses.length === 1 ? 'class' : 'classes'
        } and ${activeAlarmsCount} active ${activeAlarmsCount === 1 ? 'alarm' : 'alarms'}.`}
      />

      <div className="flex flex-col gap-6 sm:gap-7">
        {/* 1. Live Activity / Up Next Hero Card */}
        {nextClassResult ? (
          <NextClassCard entry={nextClassResult.entry} nextMeta={nextClassResult} />
        ) : (
          <section className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/80 bg-card/60 p-8 text-center shadow-ios-sm">
            <img
              src="/dormosaur-hi.png"
              alt="Dormosaur"
              className="size-28 sm:size-32 object-contain drop-shadow-md select-none"
            />
            <div>
              <h3 className="text-base font-bold text-foreground">
                No classes scheduled for today
              </h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
                Enjoy your break or explore quick dorm recipes and upcoming deadlines.
              </p>
            </div>
            <Link
              href="/schedule"
              className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-2xs hover:bg-primary/90 transition-transform active:scale-95"
            >
              <span>View Weekly Schedule</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </section>
        )}

        {/* 2. Glance Metrics Row (Native 3-Stat Card Strip) */}
        <section className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          <Link href="/schedule" className="block group">
            <motion.div
              whileTap={{ scale: 0.96 }}
              transition={IOS_SPRING_SNAPPY}
              className="flex min-h-[76px] sm:min-h-[84px] flex-col items-center justify-center rounded-2xl md:rounded-3xl border border-border/60 bg-card p-2.5 sm:p-3.5 md:p-4 text-center shadow-2xs transition-all group-hover:border-primary/40"
            >
              <span className="font-mono text-xl sm:text-2xl font-black text-foreground tabular-nums">
                {todayClasses.length}
              </span>
              <span className="mt-0.5 text-[10.5px] sm:text-[11.5px] font-semibold text-muted-foreground truncate max-w-full">
                Today's Classes
              </span>
            </motion.div>
          </Link>

          <Link href="/alarms" className="block group">
            <motion.div
              whileTap={{ scale: 0.96 }}
              transition={IOS_SPRING_SNAPPY}
              className="flex min-h-[76px] sm:min-h-[84px] flex-col items-center justify-center rounded-2xl md:rounded-3xl border border-border/60 bg-card p-2.5 sm:p-3.5 md:p-4 text-center shadow-2xs transition-all group-hover:border-primary/40"
            >
              <span className="font-mono text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {activeAlarmsCount}
              </span>
              <span className="mt-0.5 text-[10.5px] sm:text-[11.5px] font-semibold text-muted-foreground truncate max-w-full">
                Alarms Active
              </span>
            </motion.div>
          </Link>

          <Link href="/deadlines" className="block group">
            <motion.div
              whileTap={{ scale: 0.96 }}
              transition={IOS_SPRING_SNAPPY}
              className="flex min-h-[76px] sm:min-h-[84px] flex-col items-center justify-center rounded-2xl md:rounded-3xl border border-border/60 bg-card p-2.5 sm:p-3.5 md:p-4 text-center shadow-2xs transition-all group-hover:border-primary/40"
            >
              <span className="font-mono text-xl sm:text-2xl font-black text-foreground tabular-nums">
                {allPendingDeadlines.length}
              </span>
              <span className="mt-0.5 text-[10.5px] sm:text-[11.5px] font-semibold text-muted-foreground truncate max-w-full">
                Deadlines Due
              </span>
            </motion.div>
          </Link>
        </section>

        {/* 3. Today's Chronological Class Flow (Vertical Timeline Rail) */}
        {todayClasses.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Today's Schedule
              </h2>
              <Link
                href="/schedule"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <span>Full Timetable</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>

            <div className="overflow-hidden rounded-3xl border border-border/70 bg-card p-4 shadow-ios">
              <div className="relative flex flex-col gap-3">
                {todayWithGaps.map((item, idx) => {
                  if (item.type === 'gap') {
                    const hours = Math.floor(item.minutes / 60)
                    const mins = item.minutes % 60
                    const gapLabel = hours > 0 ? `${hours}h ${mins}m break` : `${mins}m break`

                    return (
                      <div
                        key={`gap-${idx}`}
                        className="my-0.5 flex items-center gap-2.5 rounded-xl border border-dashed border-border/80 bg-fill/50 px-3.5 py-2 text-[12px] text-muted-foreground"
                      >
                        <Coffee className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span className="font-semibold text-foreground">{gapLabel}</span>
                        <span className="truncate">· Ideal time for a quick dorm bite or study</span>
                      </div>
                    )
                  }

                  const entry = item.data
                  const color = subjectColorClass[entry.color] || subjectColorClass[1]
                  const isCurrent = nextClassResult?.entry.id === entry.id

                  return (
                    <motion.div
                      key={entry.id}
                      whileTap={{ scale: 0.98 }}
                      transition={IOS_SPRING_SNAPPY}
                      className={`relative flex items-center gap-3.5 rounded-2xl border p-3.5 transition-all ${
                        isCurrent
                          ? 'border-primary/30 bg-primary/[0.04] shadow-2xs'
                          : 'border-border/50 bg-card hover:bg-fill/40'
                      }`}
                    >
                      {/* Left color bar */}
                      <span className={`h-9 w-1 shrink-0 rounded-full ${color.bg}`} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[14.5px] font-bold text-foreground truncate">
                            {entry.subject}
                          </h4>
                          {entry.code && (
                            <span className="rounded bg-fill px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                              {entry.code}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3 shrink-0" />
                            <span className="tabular-nums">
                              {formatTime(entry.start)} – {formatTime(entry.end)}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">{entry.room || 'Online'}</span>
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* 4. Weekly Digest & Campus Briefing */}
        <WeeklyDigestCard />

        {/* 5. Schedule-Aware Meal Recommendation */}
        <ScheduleMealBanner />

        {/* 6. Upcoming Deadlines Section */}
        {pendingDeadlines.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Upcoming Deadlines
              </h2>
              <div className="flex items-center gap-2.5">
                <Link
                  href="/deadlines/import"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  + Import
                </Link>
                <Link
                  href="/deadlines"
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
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

        {/* 7. Quick Kitchen Bites */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold tracking-tight text-foreground">
              Quick Dorm Bites
            </h2>
            <Link
              href="/kitchen"
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>Explore Kitchen</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {featuredRecipes.map((recipe) => (
              <Link
                key={recipe.slug}
                href={`/kitchen/${recipe.slug}`}
                className="group block"
              >
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  transition={IOS_SPRING_SNAPPY}
                  className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xs transition-all group-hover:border-primary/40"
                >
                  <div className="relative aspect-[16/9] w-full bg-muted">
                    <Image
                      src={recipe.image || '/placeholder.svg'}
                      alt={recipe.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 240px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="absolute bottom-2 left-2 rounded-md bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[10.5px] font-bold text-white">
                      {recipe.minutes} min · {recipe.appliance}
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="text-[13.5px] font-bold text-foreground truncate">
                      {recipe.title}
                    </h3>
                    <p className="mt-0.5 line-clamp-1 text-[11.5px] text-muted-foreground">
                      {recipe.blurb}
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
