'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { AlarmClock, CalendarClock, CheckCircle2, ChevronRight, Clock3, Coffee, MapPin, Utensils } from 'lucide-react'
import { ScreenHeader } from '@/components/ios/screen-header'
import { NextClassCard } from '@/components/dashboard/next-class-card'
import { ScheduleMealBanner } from '@/components/dashboard/schedule-meal-banner'
import { WeeklyDigestCard } from '@/components/dashboard/weekly-digest-card'
import { NotificationBanner } from '@/components/ios/notification-banner'
import { useSchedule } from '@/components/schedule-provider'
import { formatTime, recipes, subjectColorClass } from '@/lib/data'
import { getNextUpcomingClass } from '@/lib/schedule-engine'
import { DeadlineCard } from '@/components/schedule/deadline-card'
import { DormosaurMascot } from '@/components/brand/dormosaur-mascot'

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function DashboardPage() {
  const { classes, alarms, profile, deadlines } = useSchedule()
  const [banner, setBanner] = React.useState(false)
  const currentDayName = dayNames[new Date().getDay()]

  const nextClassResult = React.useMemo(
    () => getNextUpcomingClass(classes, new Date(), profile.timezone || 'Asia/Manila'),
    [classes, profile.timezone],
  )

  React.useEffect(() => {
    const show = window.setTimeout(() => setBanner(true), 1400)
    const hide = window.setTimeout(() => setBanner(false), 7000)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(hide)
    }
  }, [])

  const todayClasses = React.useMemo(
    () => classes.filter((entry) => entry.days.includes(currentDayName)).sort((a, b) => (a.start || '00:00').localeCompare(b.start || '00:00')),
    [classes, currentDayName],
  )

  const todayWithGaps = React.useMemo(() => {
    const items: Array<
      | { type: 'class'; data: (typeof todayClasses)[number] }
      | { type: 'gap'; minutes: number }
    > = []

    for (let index = 0; index < todayClasses.length; index += 1) {
      const current = todayClasses[index]
      items.push({ type: 'class', data: current })
      const next = todayClasses[index + 1]
      if (!next) continue

      const end = current.end.split(':').map(Number)
      const start = next.start.split(':').map(Number)
      const gap = start[0] * 60 + start[1] - (end[0] * 60 + end[1])
      if (gap >= 20) items.push({ type: 'gap', minutes: gap })
    }
    return items
  }, [todayClasses])

  const activeAlarmsCount = alarms.filter((alarm) => alarm.enabled).length
  const pendingDeadlines = deadlines.filter((deadline) => !deadline.completed)
  const firstName = profile.name ? profile.name.split(' ')[0] : 'Student'
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  return (
    <>
      <NotificationBanner
        open={banner && Boolean(nextClassResult?.entry)}
        onClose={() => setBanner(false)}
        title={`${nextClassResult?.entry.subject || nextClassResult?.entry.code || 'Class'} ${nextClassResult?.status === 'in_progress' ? 'is in session' : 'starts soon'}`}
        body={`${nextClassResult?.entry.room || 'Online'}${nextClassResult?.entry.instructor && nextClassResult.entry.instructor !== 'TBA' ? ` · ${nextClassResult.entry.instructor}` : ''}`}
      />

      <ScreenHeader
        title="Today"
        eyebrow={dateLabel}
        subtitle={`Good morning, ${firstName}. ${todayClasses.length} ${todayClasses.length === 1 ? 'class' : 'classes'} and ${activeAlarmsCount} active ${activeAlarmsCount === 1 ? 'alarm' : 'alarms'}.`}
        contextImage="/campus-daylight.png"
        contextImageAlt="A sunny campus courtyard with trees and a stone academic building"
      />

      <div className="flex flex-col gap-8 sm:gap-10">
        {nextClassResult ? (
          <NextClassCard entry={nextClassResult.entry} nextMeta={nextClassResult} />
        ) : (
          <section className="wayfinding-grid flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-line bg-field p-8 text-center sm:p-12">
            <DormosaurMascot variant="comfy" alt="Dormosaur taking a well-earned break" width={112} height={112} className="size-28 object-contain" />
            <div className="mt-3 max-w-sm">
              <h2 className="text-lg font-extrabold tracking-[-0.03em]">Your board is clear today</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Take the break, or bring in your timetable to start planning the week.</p>
            </div>
            <Link href="/schedule" className="mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-0">
              Open weekly schedule <ChevronRight className="size-4" />
            </Link>
          </section>
        )}

        <section className="briefing-grid" aria-label="Today at a glance">
          <Link href="/deadlines" className="briefing-card">
            <CalendarClock className="briefing-card-icon" />
            <h3>{pendingDeadlines[0]?.title || 'No deadlines due'}</h3>
            <p>{pendingDeadlines[0] ? 'Due next on your route' : 'Your board is clear for now'}</p>
            <ChevronRight className="briefing-arrow size-4" />
          </Link>
          <Link href="/alarms" className="briefing-card">
            {activeAlarmsCount > 0 ? <CheckCircle2 className="briefing-card-icon" /> : <AlarmClock className="briefing-card-icon" />}
            <h3>{activeAlarmsCount > 0 ? 'Alarm ready' : 'Set a class alarm'}</h3>
            <p>{activeAlarmsCount > 0 ? `${activeAlarmsCount} alarms are watching your schedule` : 'Add a lead time before your next class'}</p>
            <ChevronRight className="briefing-arrow size-4" />
          </Link>
          <Link href="/kitchen" className="briefing-card briefing-card--meal">
            <Utensils className="briefing-card-icon" />
            <h3>{recipes[0]?.title || 'Dorm dinner'}</h3>
            <p>{recipes[0] ? `${recipes[0].minutes} min · ${recipes[0].appliance}` : 'Find something easy tonight'}</p>
            {recipes[0]?.image && (
              <span className="briefing-card-media" aria-hidden="true">
                <Image
                  src={recipes[0].image}
                  alt=""
                  fill
                  sizes="(max-width: 480px) 70vw, 240px"
                  className="briefing-card-image"
                />
              </span>
            )}
            <ChevronRight className="briefing-arrow size-4" />
          </Link>
        </section>

        <section className="mascot-callout" aria-label="Dormosaur encouragement">
          <DormosaurMascot variant="youGotThis" alt="Dormosaur celebrating a brighter day" width={200} height={200} />
          <div>
            <p className="route-label !text-primary">Same campus. Bigger you.</p>
            <h2>Show up for a brighter you.</h2>
          </div>
          <p>Small steps, better days.</p>
        </section>

        {todayClasses.length > 0 && (
          <section className="dashboard-section" aria-labelledby="today-route-heading">
            <div className="dashboard-section-title mb-4">
              <h2 id="today-route-heading">Today’s route</h2>
              <Link href="/schedule">Full timetable <ChevronRight className="inline size-3.5" /></Link>
            </div>

            <div className="schedule-rail">
              {todayWithGaps.map((item, index) => {
                if (item.type === 'gap') {
                  const hours = Math.floor(item.minutes / 60)
                  const minutes = item.minutes % 60
                  return (
                    <div key={`gap-${index}`} className="flex min-h-10 items-center gap-2 border-b border-dashed border-line py-2 text-xs text-muted-foreground">
                      <Coffee className="size-3.5 text-highlight" />
                      <span className="font-bold text-foreground">{hours ? `${hours}h ${minutes}m` : `${minutes}m`} break</span>
                      <span className="truncate">· room to reset</span>
                    </div>
                  )
                }

                const entry = item.data
                const color = subjectColorClass[entry.color] || subjectColorClass[1]
                const isCurrent = nextClassResult?.entry.id === entry.id
                return (
                  <motion.div
                    key={entry.id}
                    whileTap={{ scale: 0.99 }}
                    className={`schedule-row ${isCurrent ? 'bg-fill/60' : ''}`}
                  >
                    <span className={`mt-1 h-8 w-1 shrink-0 ${color.bg}`} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="truncate text-sm font-extrabold tracking-[-0.02em] text-foreground">{entry.subject}</h3>
                        {entry.code && <span className="rounded-full bg-fill px-1.5 py-0.5 text-[0.63rem] font-bold text-muted-foreground">{entry.code}</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock3 className="size-3" /><span className="tabular-nums">{formatTime(entry.start)} – {formatTime(entry.end)}</span></span>
                        <span className="flex items-center gap-1"><MapPin className="size-3" />{entry.room || 'Online'}</span>
                      </div>
                    </div>
                    {isCurrent && <span className="route-label mt-1 !text-[0.58rem]">Next</span>}
                  </motion.div>
                )
              })}
            </div>
          </section>
        )}

        <WeeklyDigestCard />
        <ScheduleMealBanner />

        {pendingDeadlines.length > 0 && (
          <section className="dashboard-section" aria-labelledby="deadline-heading">
            <div className="dashboard-section-title mb-4">
              <h2 id="deadline-heading">Upcoming deadlines</h2>
              <div className="flex items-center gap-3"><Link href="/deadlines/import">Import</Link><Link href="/deadlines">View all</Link></div>
            </div>
            <div className="flex flex-col gap-2">{pendingDeadlines.slice(0, 3).map((item) => <DeadlineCard key={item.id} deadline={item} />)}</div>
          </section>
        )}

        <section className="dashboard-section" aria-labelledby="kitchen-heading">
          <div className="dashboard-section-title mb-4">
            <h2 id="kitchen-heading">Quick dorm bites</h2>
            <Link href="/kitchen">Explore kitchen <ChevronRight className="inline size-3.5" /></Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {recipes.slice(0, 3).map((recipe) => (
              <Link key={recipe.slug} href={`/kitchen/${recipe.slug}`} className="group block cursor-pointer overflow-hidden rounded-3xl border border-line bg-card transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-fill">
                  <Image src={recipe.image || '/placeholder.svg'} alt={recipe.title} fill sizes="(max-width: 640px) 100vw, 240px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1.5 text-[0.65rem] font-bold text-primary"><Utensils className="size-3" /> {recipe.minutes} min · {recipe.appliance}</div>
                  <h3 className="mt-2 truncate text-sm font-extrabold tracking-[-0.02em]">{recipe.title}</h3>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{recipe.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
