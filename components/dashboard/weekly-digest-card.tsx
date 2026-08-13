'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, RefreshCw, Calendar, CheckCircle2 } from 'lucide-react'
import { useSchedule } from '@/components/schedule-provider'
import { parseTimeToMinutes } from '@/lib/schedule-gap-analyzer'

const STORAGE_DIGEST_KEY = 'dormosaur_weekly_digest_v1'

export function WeeklyDigestCard() {
  const { classes, deadlines } = useSchedule()
  const [digest, setDigest] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  // Aggregate schedule by day for the API input format
  const prepareWeeklyPayload = React.useCallback(() => {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
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
        date: d.dueDate || '2026-08-18',
      }))

    return {
      week_start_date: new Date().toISOString().split('T')[0],
      days: aggregatedDays,
      upcoming_deadlines: upcomingDeadlines,
    }
  }, [classes, deadlines])

  const fetchDigest = React.useCallback(async (forceRefresh = false) => {
    // Check localStorage cache first
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(STORAGE_DIGEST_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          // Use cache if less than 3 days old
          if (Date.now() - parsed.timestamp < 3 * 24 * 60 * 60 * 1000) {
            setDigest(parsed.text)
            return
          }
        }
      } catch (e) {
        console.warn('Digest cache notice:', e)
      }
    }

    setLoading(true)
    try {
      const payload = prepareWeeklyPayload()
      const res = await fetch('/api/digest/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.digest) {
        setDigest(data.digest)
        try {
          localStorage.setItem(
            STORAGE_DIGEST_KEY,
            JSON.stringify({ text: data.digest, timestamp: Date.now() })
          )
        } catch (e) {
          console.warn('Digest save notice:', e)
        }
      }
    } catch (err) {
      console.error('Failed to generate weekly digest:', err)
    } finally {
      setLoading(false)
    }
  }, [prepareWeeklyPayload])

  React.useEffect(() => {
    fetchDigest()
  }, [fetchDigest])

  // Don't render card if user has zero classes imported
  if (classes.length === 0 && !loading && !digest) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-[#1f6f50]/12 via-card to-card p-5 shadow-ios"
    >
      {/* Decorative backdrop blur */}
      <div className="absolute top-0 right-0 h-28 w-28 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="size-4" />
          </div>
          <span className="text-[12px] font-bold uppercase tracking-wider text-primary">
            Weekly AI Digest
          </span>
        </div>
        <button
          onClick={() => fetchDigest(true)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full bg-card border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground active:scale-95 disabled:opacity-50 transition-all shadow-sm"
        >
          <RefreshCw className={`size-3 ${loading ? 'animate-spin text-primary' : ''}`} />
          <span>{loading ? 'Analyzing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Main Digest Text */}
      <div className="mt-3.5">
        <p className="text-[14.5px] leading-relaxed text-foreground font-medium">
          {digest || (
            <span className="text-muted-foreground animate-pulse">
              Dormosaur AI is reviewing your timetable and deadlines for the week ahead...
            </span>
          )}
        </p>
      </div>
    </motion.section>
  )
}
