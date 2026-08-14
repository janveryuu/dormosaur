'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, Clock, MapPin, User, X } from 'lucide-react'
import type { ClassEntry } from '@/lib/data'
import { formatTimeRange, subjectColorClass } from '@/lib/data'

interface ClassDetailModalProps {
  entry: ClassEntry | null
  onClose: () => void
}

const fullDayMap: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
}

export function ClassDetailModal({ entry, onClose }: ClassDetailModalProps) {
  if (!entry) return null

  const color = subjectColorClass[entry.color]
  const daysFormatted = entry.days.map((d) => fullDayMap[d] || d).join(', ')
  const timeRange = formatTimeRange(entry.start, entry.end)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Sheet / Card Container */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-border/80 bg-card p-6 shadow-2xl overflow-hidden"
        >
          {/* Header Colored Accent Bar */}
          <div className={`absolute inset-x-0 top-0 h-2 ${color.bg}`} />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-all hover:bg-muted"
          >
            <X className="size-4" />
          </button>

          {/* Course Code & Title */}
          <div className="mt-2 pr-8">
            <span className={`inline-block rounded-full ${color.soft} px-3 py-1 text-[11px] font-black tracking-wider uppercase ${color.text} border border-black/5 dark:border-white/10`}>
              {entry.code}
            </span>
            <h3 className="mt-2 text-[20px] font-black tracking-tight text-foreground">
              {entry.subject}
            </h3>
          </div>

          {/* Detail Cards List */}
          <div className="mt-6 flex flex-col gap-3">
            {/* Time & Duration */}
            <div className="flex items-center gap-3.5 rounded-2xl bg-muted/40 p-3.5 border border-border/40">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Time Slot</span>
                <span className="text-[14.5px] font-bold text-foreground mt-0.5">{timeRange}</span>
              </div>
            </div>

            {/* Days */}
            <div className="flex items-center gap-3.5 rounded-2xl bg-muted/40 p-3.5 border border-border/40">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Calendar className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Schedule Days</span>
                <span className="text-[14.5px] font-bold text-foreground mt-0.5">{daysFormatted}</span>
              </div>
            </div>

            {/* Room / Location */}
            <div className="flex items-center gap-3.5 rounded-2xl bg-muted/40 p-3.5 border border-border/40">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Room / Location</span>
                <span className="text-[14.5px] font-bold text-foreground mt-0.5">{entry.room || 'Room TBA'}</span>
              </div>
            </div>

            {/* Instructor */}
            <div className="flex items-center gap-3.5 rounded-2xl bg-muted/40 p-3.5 border border-border/40">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <User className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Instructor</span>
                <span className="text-[14.5px] font-bold text-foreground mt-0.5">{entry.instructor || 'TBA'}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
