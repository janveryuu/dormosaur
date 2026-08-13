'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { BellRing, CalendarDays, ChevronRight, Clock, CookingPot, MapPin } from 'lucide-react'
import { ScreenHeader, PullAffordance } from '@/components/ios/screen-header'
import { NextClassCard } from '@/components/dashboard/next-class-card'
import { NotificationBanner } from '@/components/ios/notification-banner'
import { alarms, classes, formatTime, profile, recipes, subjectColorClass } from '@/lib/data'

const todayName = 'Mon'

export default function DashboardPage() {
  const [banner, setBanner] = React.useState(false)

  React.useEffect(() => {
    const show = setTimeout(() => setBanner(true), 1200)
    const hide = setTimeout(() => setBanner(false), 6500)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [])

  const today = classes.filter((c) => c.days.includes(todayName))
  const next = today[0]
  const remaining = today.slice(1)
  const activeAlarms = alarms.filter((a) => a.enabled && a.day === 'Today').length
  const featured = recipes.slice(0, 3)

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      <NotificationBanner
        open={banner}
        onClose={() => setBanner(false)}
        title="Calculus I starts in 30 min"
        body="Sci Hall 204 · Dr. Elena Reyes"
      />

      <PullAffordance />
      <ScreenHeader
        title="Today"
        eyebrow={dateLabel}
        subtitle={`Good morning, ${profile.name.split(' ')[0]}. You have ${today.length} classes and ${activeAlarms} alarms set.`}
      />

      <div className="flex flex-col gap-8">
        {next && <NextClassCard entry={next} />}

        {remaining.length > 0 && (
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-[21px] font-bold tracking-[-0.025em]">Later today</h2>
              <Link href="/schedule" className="text-[15px] font-medium text-primary">
                See all
              </Link>
            </div>
            <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
              {remaining.map((entry) => {
                const color = subjectColorClass[entry.color]
                return (
                  <motion.article
                    key={entry.id}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 520, damping: 30 }}
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
                    <div className="mt-4 flex flex-col gap-1.5 text-[13.5px] text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-4" strokeWidth={1.9} />
                        {formatTime(entry.start)} – {formatTime(entry.end)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-4" strokeWidth={1.9} />
                        {entry.room}
                      </span>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          </section>
        )}

        <section className="grid gap-3 sm:grid-cols-3">
          <QuickTile
            href="/schedule"
            icon={<CalendarDays className="size-5" strokeWidth={1.9} />}
            title="Schedule"
            detail={`${classes.length} classes this week`}
          />
          <QuickTile
            href="/alarms"
            icon={<BellRing className="size-5" strokeWidth={1.9} />}
            title="Alarms"
            detail={`${activeAlarms} active today`}
          />
          <QuickTile
            href="/kitchen"
            icon={<CookingPot className="size-5" strokeWidth={1.9} />}
            title="Kitchen"
            detail={`${recipes.length} dorm recipes`}
          />
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[21px] font-bold tracking-[-0.025em]">Eat between classes</h2>
            <Link href="/kitchen" className="text-[15px] font-medium text-primary">
              Kitchen
            </Link>
          </div>
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0">
            {featured.map((recipe) => (
              <Link
                key={recipe.slug}
                href={`/kitchen/${recipe.slug}`}
                className="w-[200px] shrink-0 snap-start"
              >
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 520, damping: 30 }}
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
                  <div className="p-4">
                    <h3 className="text-[15.5px] leading-snug font-semibold tracking-[-0.015em]">
                      {recipe.title}
                    </h3>
                    <p className="mt-1 text-[13px] text-muted-foreground">
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
    <Link href={href}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 520, damping: 30 }}
        className="flex items-center gap-3 rounded-3xl bg-card p-4 shadow-ios"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15.5px] font-semibold tracking-[-0.015em]">{title}</span>
          <span className="block truncate text-[13px] text-muted-foreground">{detail}</span>
        </span>
        <ChevronRight className="size-4.5 shrink-0 text-muted-foreground" />
      </motion.div>
    </Link>
  )
}
