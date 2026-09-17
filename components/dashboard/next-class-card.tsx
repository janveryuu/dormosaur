'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, Clock, MapPin, Navigation, User } from 'lucide-react'
import { formatTime, subjectColorClass, type ClassEntry } from '@/lib/data'
import type { NextClassResult } from '@/lib/schedule-engine'

function useLiveCountdown(remainingMinutes: number, targetTimeStr: string) {
  const [countdownLabel, setCountdownLabel] = React.useState<string>(() => {
    if (!remainingMinutes || remainingMinutes <= 0) return '0m 00s'
    const days = Math.floor(remainingMinutes / (24 * 60))
    const hours = Math.floor((remainingMinutes % (24 * 60)) / 60)
    const mins = remainingMinutes % 60
    if (days > 0) return `${days}d ${hours}h ${String(mins).padStart(2, '0')}m`
    if (hours > 0) return `${hours}h ${String(mins).padStart(2, '0')}m 00s`
    return `${mins}m 00s`
  })

  React.useEffect(() => {
    const startTime = Date.now()
    const totalTargetSeconds = Math.max(0, remainingMinutes * 60)

    const tick = () => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
      const currentSecondsRemaining = Math.max(0, totalTargetSeconds - elapsedSeconds)

      const totalMins = Math.floor(currentSecondsRemaining / 60)
      const secs = currentSecondsRemaining % 60
      const days = Math.floor(totalMins / (24 * 60))
      const hours = Math.floor((totalMins % (24 * 60)) / 60)
      const mins = totalMins % 60

      if (days > 0) {
        setCountdownLabel(`${days}d ${hours}h ${String(mins).padStart(2, '0')}m`)
      } else if (hours > 0) {
        setCountdownLabel(`${hours}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`)
      } else {
        setCountdownLabel(`${mins}m ${String(secs).padStart(2, '0')}s`)
      }
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [remainingMinutes, targetTimeStr])

  return countdownLabel
}

export function NextClassCard({
  entry,
  nextMeta,
}: {
  entry: ClassEntry
  nextMeta?: NextClassResult | null
}) {
  const isHappeningNow = nextMeta?.status === 'in_progress'
  const isFutureDay = nextMeta?.status === 'upcoming_future'
  const remainingMins = nextMeta?.remainingMinutes ?? 0

  const countdown = useLiveCountdown(
    remainingMins,
    isHappeningNow ? entry.end : entry.start
  )

  const color = subjectColorClass[entry.color] || subjectColorClass[1]

  const hasDistinctCode =
    Boolean(entry.code) &&
    Boolean(entry.subject) &&
    entry.code.trim().toLowerCase() !== entry.subject.trim().toLowerCase()

  const title = entry.subject || entry.code || 'Class'

  let subtitleParts: string[] = []
  if (hasDistinctCode) {
    subtitleParts.push(entry.code)
    if (entry.instructor && entry.instructor !== 'TBA' && entry.instructor !== 'None') {
      subtitleParts.push(entry.instructor)
    }
  } else {
    if (entry.instructor && entry.instructor !== 'TBA' && entry.instructor !== 'None') {
      subtitleParts.push(entry.instructor)
    } else if (entry.room && entry.room !== 'TBA') {
      subtitleParts.push(entry.room)
    }
  }

  const subtitle = subtitleParts.join(' · ')

  return (
    <Link href="/schedule" className="block group select-none">
      <motion.article
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="relative overflow-hidden rounded-3xl bg-card p-5 sm:p-6 shadow-ios border border-border/80 ring-1 ring-black/[0.03] dark:ring-white/[0.05] hover:border-primary/40 transition-all"
      >
        {/* Color bar indicator on the left */}
        <span
          className={`absolute top-0 left-0 bottom-0 w-1.5 ${color.bg}`}
          aria-hidden="true"
        />

        {/* Student Dormosaur Mascot (holding CLASS SCHEDULE) - Maximized with overlap */}
        <div className="pointer-events-none absolute -right-1 sm:right-1 md:right-3 -bottom-2 sm:-bottom-3 md:-bottom-4 z-20 select-none">
          <img
            src="/student-dormosaur.png"
            alt="Student Dormosaur"
            className="h-36 sm:h-48 md:h-56 lg:h-64 w-auto object-contain drop-shadow-xl transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="relative z-10 pr-32 sm:pr-44 md:pr-52 lg:pr-60">
          {/* Live Status Header */}
          <div className="flex items-center justify-between pl-1">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span
                className={`absolute inset-0 animate-ping rounded-full opacity-75 ${
                  isHappeningNow ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
              <span
                className={`relative size-2.5 rounded-full ${
                  isHappeningNow ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
            </span>
            <span
              className={`text-[12px] font-bold tracking-wider uppercase ${
                isHappeningNow
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-primary'
              }`}
            >
              {isHappeningNow
                ? 'Happening Now'
                : isFutureDay && nextMeta?.dayLabel
                ? `Next Class · ${nextMeta.dayLabel}`
                : 'Next Class Today'}
            </span>
          </div>

          <span className="flex items-center gap-1 text-[12px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">
            <span>Schedule</span>
            <ArrowUpRight className="size-3.5" />
          </span>
        </div>

        {/* Primary Subject & Details */}
        <div className="mt-3 pl-1">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground text-balance">
              {title}
            </h2>
            {entry.code && hasDistinctCode && (
              <span className="rounded-md bg-fill px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                {entry.code}
              </span>
            )}
          </div>

          {subtitle && (
            <p className="mt-0.5 text-[13.5px] font-medium text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        {/* Time, Room & Instructor Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pl-1">
          <span className="flex items-center gap-1.5 rounded-full bg-fill/80 border border-border/40 px-3 py-1.5 text-[12.5px] font-semibold text-foreground">
            <Clock className="size-3.5 text-muted-foreground shrink-0" strokeWidth={2} />
            <span className="tabular-nums">
              {formatTime(entry.start)} – {formatTime(entry.end)}
            </span>
          </span>

          <span className="flex items-center gap-1.5 rounded-full bg-fill/80 border border-border/40 px-3 py-1.5 text-[12.5px] font-semibold text-foreground">
            <MapPin className="size-3.5 text-muted-foreground shrink-0" strokeWidth={2} />
            <span>{entry.room || 'Online'}</span>
          </span>

          {entry.instructor &&
            entry.instructor !== 'TBA' &&
            entry.instructor !== 'None' &&
            !subtitle.includes(entry.instructor) && (
              <span className="flex items-center gap-1.5 rounded-full bg-fill/80 border border-border/40 px-3 py-1.5 text-[12.5px] font-semibold text-muted-foreground">
                <User className="size-3.5 text-muted-foreground shrink-0" strokeWidth={2} />
                <span>{entry.instructor}</span>
              </span>
            )}
        </div>

        {/* Live Activity Digital Countdown Ticker */}
        <div className="mt-4.5 flex items-center justify-between border-t border-border/60 pt-3.5 pl-1">
          <div className="flex items-center gap-2">
            <Navigation className="size-3.5 text-muted-foreground" />
            <span className="text-[12.5px] font-medium text-muted-foreground">
              {isHappeningNow ? 'Ends in' : 'Starts in'}
            </span>
          </div>

          <div
            className={`font-mono text-2xl font-black tracking-tight tabular-nums ${
              isHappeningNow ? 'text-amber-600 dark:text-amber-400' : 'text-primary'
            }`}
          >
            {countdown || '—'}
          </div>
        </div>
        </div>
      </motion.article>
    </Link>
  )
}
