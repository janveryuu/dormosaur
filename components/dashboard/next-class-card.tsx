'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Navigation } from 'lucide-react'
import Link from 'next/link'
import { formatTime, type ClassEntry } from '@/lib/data'
import type { NextClassResult } from '@/lib/schedule-engine'

function useLiveCountdown(remainingMinutes: number, targetTimeStr: string) {
  const [countdownLabel, setCountdownLabel] = React.useState(() => formatRemaining(remainingMinutes))

  React.useEffect(() => {
    const startedAt = Date.now()
    const totalTargetSeconds = Math.max(0, remainingMinutes * 60)

    const tick = () => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000)
      setCountdownLabel(formatRemaining(Math.max(0, totalTargetSeconds - elapsedSeconds), true))
    }

    tick()
    const intervalId = window.setInterval(tick, 1000)
    return () => window.clearInterval(intervalId)
  }, [remainingMinutes, targetTimeStr])

  return countdownLabel
}

function formatRemaining(value: number, fromSeconds = false) {
  const totalSeconds = fromSeconds ? value : Math.max(0, value) * 60
  const totalMinutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
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
  const countdown = useLiveCountdown(nextMeta?.remainingMinutes ?? 0, isHappeningNow ? entry.end : entry.start)
  const title = entry.subject || entry.code || 'Class'
  const subtitle = [
    entry.code && entry.code.trim().toLowerCase() !== title.trim().toLowerCase() ? entry.code : null,
    entry.instructor && !['TBA', 'None'].includes(entry.instructor) ? entry.instructor : null,
  ].filter(Boolean).join(' · ')

  return (
    <Link href="/schedule" className="group block select-none" aria-label={`Open schedule for ${title}`}>
      <motion.article
        whileTap={{ scale: 0.99 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className="departure-card p-5 sm:p-7"
      >
      <div className="wayfinding-grid pointer-events-none absolute inset-0 z-0 opacity-20" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-1 -right-3 z-0 sm:right-6" aria-hidden="true">
        <img
          src="/student-dormosaur.png"
          alt=""
          width={240}
          height={240}
          className="h-28 w-auto object-contain opacity-35 transition-transform duration-500 sm:h-48 sm:opacity-100 md:h-56"
        />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="departure-heading">
            <span className="departure-heading-icon"><ArrowRight className="size-6" /></span>
            <div>
              <p className="route-label !text-highlight">{isHappeningNow ? 'On the route now' : 'Next departure'}</p>
              <p className="mt-1 text-xs font-medium text-primary-foreground/65">{isFutureDay && nextMeta?.dayLabel ? `Your next class · ${nextMeta.dayLabel}` : 'Same direction, one less thing to remember'}</p>
            </div>
          </div>
          <span className="hidden items-center gap-1 text-xs font-bold text-primary-foreground/78 sm:flex">Open schedule <ArrowRight className="size-3.5" /></span>
        </div>

        <div className="mt-7 max-w-[32rem] sm:mt-9">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-primary-foreground/55">Class</p>
          <h2 className="mt-2 text-[2rem] font-extrabold leading-[0.98] tracking-[-0.06em] text-primary-foreground sm:text-[2.8rem]">{title}</h2>
          {subtitle && <p className="mt-2 text-sm font-medium text-primary-foreground/72">{subtitle}</p>}
        </div>

        <div className="departure-fields max-w-[48rem]">
          <div className="departure-field"><span className="departure-field-label">Time</span><span className="departure-field-value tabular-nums">{formatTime(entry.start)} – {formatTime(entry.end)}</span></div>
          <div className="departure-field"><span className="departure-field-label">Room</span><span className="departure-field-value">{entry.room || 'Online'}</span></div>
          <div className="departure-field"><span className="departure-field-label">Guide</span><span className="departure-field-value">{entry.instructor && !['TBA', 'None'].includes(entry.instructor) ? entry.instructor.split(' ').slice(-1)[0] : 'Campus'}</span></div>
        </div>

        <div className="departure-action-row max-w-[48rem]">
          <span className="flex items-center gap-2 text-sm font-bold text-primary-foreground/78"><Navigation className="size-4 text-highlight" /> {isHappeningNow ? 'Ends in' : 'Leave in'} <strong className="tabular-nums text-2xl tracking-[-0.05em] text-highlight">{countdown}</strong></span>
          <span className="departure-cta">View route <ArrowRight className="size-4" /></span>
        </div>
      </div>
      </motion.article>
    </Link>
  )
}
