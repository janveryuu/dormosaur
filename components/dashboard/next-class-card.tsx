'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight, Clock, MapPin, User } from 'lucide-react'
import { formatTime, subjectColorClass, type ClassEntry } from '@/lib/data'
import type { NextClassResult } from '@/lib/schedule-engine'

function useLiveCountdown(remainingMinutes: number, targetTimeStr: string) {
  const [countdownLabel, setCountdownLabel] = React.useState<string>('')

  React.useEffect(() => {
    // Record baseline timestamp when component received remainingMinutes
    const startTime = Date.now()
    const totalTargetSeconds = remainingMinutes * 60

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
        setCountdownLabel(`${hours}h ${String(mins).padStart(2, '0')}m`)
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

  // Intelligent display mapping to prevent duplicate codes and "TBA" confusion
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
    // If subject and code are identical, don't duplicate code
    if (entry.instructor && entry.instructor !== 'TBA' && entry.instructor !== 'None') {
      subtitleParts.push(entry.instructor)
    } else if (entry.room && entry.room !== 'TBA') {
      subtitleParts.push(entry.room)
    }
  }

  const subtitle = subtitleParts.join(' · ')

  return (
    <Link href="/schedule" className="block group">
      <motion.article
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="relative overflow-hidden rounded-4xl bg-card p-6 shadow-ios-lg border border-border/40 hover:border-primary/40 transition-colors"
      >
        <span className={`absolute inset-x-0 top-0 h-1 ${color.bg}`} aria-hidden="true" />
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p
              className={`flex items-center gap-2 text-[13px] font-bold tracking-[0.06em] uppercase ${
                isHappeningNow ? 'text-amber-800 dark:text-amber-300' : 'text-primary'
              }`}
            >
              <span className="relative flex size-2">
                <span
                  className={`absolute inset-0 animate-ping rounded-full opacity-75 ${
                    isHappeningNow ? 'bg-amber-500' : 'bg-primary'
                  }`}
                />
                <span
                  className={`relative size-2 rounded-full ${
                    isHappeningNow ? 'bg-amber-500' : 'bg-primary'
                  }`}
                />
              </span>
              {isHappeningNow
                ? 'Happening now'
                : isFutureDay && nextMeta?.dayLabel
                ? `Up next · ${nextMeta.dayLabel}`
                : 'Up next'}
            </p>

            <h2 className="mt-2 text-[26px] sm:text-[28px] leading-tight font-extrabold tracking-[-0.03em] text-foreground text-balance">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 text-[14.5px] font-semibold text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
          <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>

        {/* Info Badges */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-fill px-3.5 py-1.5 text-[13px] font-semibold text-foreground">
            <Clock className="size-3.5 text-muted-foreground" strokeWidth={2} />
            {formatTime(entry.start)} – {formatTime(entry.end)}
          </span>

          <span className="flex items-center gap-1.5 rounded-full bg-fill px-3.5 py-1.5 text-[13px] font-semibold text-foreground">
            <MapPin className="size-3.5 text-muted-foreground" strokeWidth={2} />
            {entry.room || 'Online'}
          </span>

          {entry.instructor &&
            entry.instructor !== 'TBA' &&
            entry.instructor !== 'None' &&
            !subtitle.includes(entry.instructor) && (
              <span className="flex items-center gap-1.5 rounded-full bg-fill px-3.5 py-1.5 text-[13px] font-semibold text-muted-foreground">
                <User className="size-3.5 text-muted-foreground" strokeWidth={2} />
                {entry.instructor}
              </span>
            )}
        </div>

        {/* Countdown Footer */}
        <div className="mt-5 flex items-baseline gap-2 border-t border-separator pt-4.5">
          <span className="text-[13.5px] font-medium text-muted-foreground">
            {isHappeningNow
              ? 'Ends in'
              : isFutureDay && nextMeta?.dayLabel
              ? `Starts ${nextMeta.dayLabel} in`
              : 'Starts in'}
          </span>
          <span
            className={`font-mono text-[26px] leading-none font-bold tracking-[-0.02em] tabular-nums ${
              isHappeningNow ? 'text-amber-800 dark:text-amber-300' : 'text-primary'
            }`}
          >
            {countdown || '—'}
          </span>
        </div>
      </motion.article>
    </Link>
  )
}
