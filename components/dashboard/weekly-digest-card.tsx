'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useNow } from '@/hooks/use-browser-state'
import { clockAt } from '@/lib/copilot/time'
import { useSchedule } from '@/components/schedule-provider'
import { parseTimeToMinutes } from '@/lib/schedule-gap-analyzer'
import { DormosaurMascot } from '@/components/brand/dormosaur-mascot'

const STORAGE_DIGEST_KEY = 'dormosaur_weekly_digest_v1'

export function WeeklyDigestCard() {
  const { classes, deadlines, profile, isHydrated } = useSchedule()
  const { user } = useAuth()
  const now = useNow()
  const date = now ? clockAt(new Date(now), profile.timezone).date : ''
  const [refresh, setRefresh] = React.useState(0)
  const [result, setResult] = React.useState<{ key: string; text: string | null; error: boolean } | null>(null)

  // Aggregate schedule by day for the API input format
  const prepareWeeklyPayload = React.useCallback(() => {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const aggregatedDays = daysOfWeek.map((dayName) => {
      const dayClasses = classes.filter((c) =>
        c.days.some((d) => d.toLowerCase().startsWith(dayName.toLowerCase().slice(0, 3)))
      )

      let totalClassHours = 0
      let maxGapMins = 0

      dayClasses.forEach((c) => {
        const startMins = parseTimeToMinutes(c.start)
        const endMins = parseTimeToMinutes(c.end)
        totalClassHours += Math.max(0, (endMins - startMins) / 60)
      })

      // Calculate gaps
      const sorted = [...dayClasses].sort((a, b) => parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start))
      for (let i = 0; i < sorted.length - 1; i++) {
        const gap = parseTimeToMinutes(sorted[i + 1].start) - parseTimeToMinutes(sorted[i].end)
        if (gap > maxGapMins) maxGapMins = gap
      }

      return {
        day_name: dayName,
        classes: dayClasses.map((c) => ({
          subject: c.subject,
          start_time: c.start,
          end_time: c.end,
          room: c.room,
        })),
        total_class_hours: Math.round(totalClassHours * 10) / 10,
        longest_gap_minutes: maxGapMins > 0 ? maxGapMins : null,
      }
    })

    const upcomingDeadlines = deadlines
      .filter((d) => !d.completed)
      .map((d) => ({
        subject: d.code || d.title,
        type: d.type || 'exam',
        date: d.dueDate,
      }))

    return {
      week_start_date: date,
      days: aggregatedDays,
      upcoming_deadlines: upcomingDeadlines,
    }
  }, [classes, deadlines, date])

  const payload = React.useMemo(() => prepareWeeklyPayload(), [prepareWeeklyPayload])
  const signature = JSON.stringify(payload)
  const cacheKey = `${STORAGE_DIGEST_KEY}:${user?.id || 'guest'}`
  const requestKey = `${cacheKey}:${signature}:${refresh}`
  const loading = result?.key !== requestKey
  const digest = result?.key === requestKey ? result.text : null

  React.useEffect(() => {
    if (!isHydrated || !user || !date || !classes.length) return
    const controller = new AbortController()
    async function readDigest() {
      if (!refresh) {
        try {
          const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null')
          if (cached?.signature === signature && typeof cached.text === 'string' && Date.now() - cached.timestamp < 3 * 24 * 60 * 60 * 1000) return cached.text
        } catch {}
      }
      const res = await fetch('/api/digest/weekly', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: signature, signal: controller.signal,
      })
      const data = await res.json()
      if (!res.ok || typeof data.digest !== 'string' || !data.digest) throw new Error('digest_unavailable')
      if (!controller.signal.aborted) {
        try { localStorage.setItem(cacheKey, JSON.stringify({ text: data.digest, signature, timestamp: Date.now() })) } catch {}
      }
      return data.digest
    }
    void readDigest().then(text => {
      if (!controller.signal.aborted) setResult({ key: requestKey, text, error: false })
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ key: requestKey, text: null, error: true })
    })
    return () => controller.abort()
  }, [isHydrated, user, date, classes.length, refresh, cacheKey, signature, requestKey])

  if (!isHydrated || !user || !classes.length) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className="dashboard-section rounded-3xl border border-line bg-field p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <DormosaurMascot
            variant="thinking"
            alt="Dormosaur thinking through your weekly route"
            width={40}
            height={40}
            className="size-9 shrink-0 object-contain select-none"
          />
          <span className="route-label">
            Weekly route brief
          </span>
        </div>
        <button
          onClick={() => setRefresh(value => value + 1)}
          disabled={loading}
          className="flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-card px-3 text-[11px] font-bold text-muted-foreground transition-colors hover:text-foreground active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`size-3 ${loading ? 'animate-spin text-primary' : ''}`} />
          <span>{loading ? 'Analyzing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Main Digest Text */}
      <div className="mt-3.5">
        <p className="text-[14.5px] leading-relaxed text-foreground font-medium">
          {result?.key === requestKey && result.error ? 'Your weekly brief is unavailable right now. Tap Refresh to retry.' : digest || (
            <span className="text-muted-foreground animate-pulse">
              Dormosaur AI is reviewing your timetable and deadlines for the week ahead...
            </span>
          )}
        </p>
      </div>
    </motion.section>
  )
}
