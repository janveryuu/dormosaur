'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  Coffee,
  MapPin,
  Plus,
  Sparkles,
  UploadCloud,
  User,
} from 'lucide-react'
import { useSchedule } from '@/components/schedule-provider'
import type { ClassEntry } from '@/lib/data'
import { formatTime, formatTimeRange, minutesOf, subjectColorClass, weekDays } from '@/lib/data'
import { ClassDetailModal } from '@/components/schedule/class-detail-modal'
import { ClassEditModal } from '@/components/schedule/class-edit-modal'
import { IOS_SPRING_SNAPPY, LAYOUT_SPRING } from '@/lib/springs'
import { cn } from '@/lib/utils'

const fullDayMap: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
}

const JS_DAY_TO_KEY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function nowMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export function DayView() {
  const { classes, isHydrated, isSyncing, addClass, updateClass, deleteClass } = useSchedule()
  const [selectedDay, setSelectedDay] = React.useState<string>(() => {
    const today = JS_DAY_TO_KEY[new Date().getDay()]
    return weekDays.includes(today) ? today : 'Mon'
  })
  const [selectedClass, setSelectedClass] = React.useState<ClassEntry | null>(null)
  const [editClass, setEditClass] = React.useState<ClassEntry | null>(null)
  const [addClassOpen, setAddClassOpen] = React.useState(false)
  const [nowMins, setNowMins] = React.useState(nowMinutes)

  const todayKey = JS_DAY_TO_KEY[new Date().getDay()]
  const isTodaySelected = selectedDay === todayKey

  // Live timer for "NOW" line
  React.useEffect(() => {
    const tick = () => setNowMins(nowMinutes())
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  // Sync to today's day on initial client mount
  React.useEffect(() => {
    const today = JS_DAY_TO_KEY[new Date().getDay()]
    if (weekDays.includes(today)) {
      setSelectedDay(today)
    }
  }, [])

  // Format current time
  const nowHours = Math.floor(nowMins / 60)
  const nowMinutesRem = nowMins % 60
  const nowFormatted = formatTime(
    `${String(nowHours).padStart(2, '0')}:${String(nowMinutesRem).padStart(2, '0')}`
  )

  // Classes for the selected day, sorted by start time
  const dayClasses = React.useMemo(() => {
    return classes
      .filter((c) => c.days.includes(selectedDay))
      .sort((a, b) => minutesOf(a.start) - minutesOf(b.start))
  }, [classes, selectedDay])

  // Compute gaps between classes and place chronological NOW line
  const timelineItems = React.useMemo(() => {
    type TimelineItem =
      | { type: 'class'; data: ClassEntry }
      | { type: 'gap'; minutes: number; start: string; end: string }
      | { type: 'now'; timeFormatted: string; isFinished?: boolean }

    const items: TimelineItem[] = []
    let nowPlaced = false

    // Check if now is before first class
    if (dayClasses.length > 0 && isTodaySelected) {
      const firstStart = minutesOf(dayClasses[0].start)
      if (nowMins < firstStart) {
        items.push({ type: 'now', timeFormatted: nowFormatted })
        nowPlaced = true
      }
    }

    for (let i = 0; i < dayClasses.length; i++) {
      const current = dayClasses[i]
      const curEnd = minutesOf(current.end)

      items.push({ type: 'class', data: current })

      if (i < dayClasses.length - 1) {
        const next = dayClasses[i + 1]
        const nextStart = minutesOf(next.start)
        const gap = nextStart - curEnd

        // Check if now is between current class end and next class start
        if (isTodaySelected && !nowPlaced && nowMins >= curEnd && nowMins < nextStart) {
          items.push({ type: 'now', timeFormatted: nowFormatted })
          nowPlaced = true
        }

        if (gap >= 20) {
          items.push({
            type: 'gap',
            minutes: gap,
            start: current.end,
            end: next.start,
          })
        }
      }
    }

    // Check if now is after last class
    if (dayClasses.length > 0 && isTodaySelected && !nowPlaced) {
      const lastEnd = minutesOf(dayClasses[dayClasses.length - 1].end)
      if (nowMins >= lastEnd) {
        items.push({ type: 'now', timeFormatted: nowFormatted, isFinished: true })
        nowPlaced = true
      }
    }

    return items
  }, [dayClasses, isTodaySelected, nowMins, nowFormatted])

  const isLoading = !isHydrated || isSyncing

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex h-12 w-full animate-pulse rounded-2xl bg-muted/50" />
        <div className="flex h-48 w-full animate-pulse rounded-3xl bg-muted/40" />
      </div>
    )
  }

  return (
    <>
      <ClassDetailModal
        entry={selectedClass}
        onClose={() => setSelectedClass(null)}
        onEdit={(entry) => {
          setSelectedClass(null)
          setEditClass(entry)
        }}
      />

      <ClassEditModal
        open={Boolean(editClass) || addClassOpen}
        onClose={() => {
          setEditClass(null)
          setAddClassOpen(false)
        }}
        initialData={editClass}
        onSave={(classData) => {
          if (editClass) {
            updateClass(editClass.id, classData)
          } else {
            addClass(classData)
          }
        }}
        onDelete={(id) => deleteClass(id)}
      />

      <div className="flex flex-col gap-5">
        {/* ── 7-Day Responsive Selector Strip (Fits All Mobile Screens) ── */}
        <div className="w-full">
          <div className="grid grid-cols-7 gap-1 rounded-2xl bg-card border border-border/70 p-1 shadow-2xs">
            {weekDays.map((day) => {
              const active = day === selectedDay
              const isToday = day === todayKey
              const count = classes.filter((c) => c.days.includes(day)).length

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className="relative flex flex-col items-center justify-center py-2 px-0.5 rounded-xl transition-all cursor-pointer select-none"
                >
                  {/* Active day background pill */}
                  {active && (
                    <motion.span
                      layoutId="day-strip-active"
                      transition={LAYOUT_SPRING}
                      className="absolute inset-0 rounded-xl bg-primary text-primary-foreground shadow-xs"
                      aria-hidden="true"
                    />
                  )}

                  <span
                    className={cn(
                      'relative z-10 text-[11px] sm:text-[12px] font-bold uppercase tracking-wider transition-colors',
                      active
                        ? 'text-primary-foreground font-black'
                        : isToday
                        ? 'text-primary font-black'
                        : 'text-muted-foreground',
                    )}
                  >
                    {day}
                  </span>

                  {/* Class count indicator dots */}
                  <div className="relative z-10 mt-1 flex items-center justify-center gap-0.5 h-1.5">
                    {count > 0 ? (
                      <span
                        className={cn(
                          'size-1.5 rounded-full transition-colors',
                          active
                            ? 'bg-primary-foreground'
                            : isToday
                            ? 'bg-primary'
                            : 'bg-muted-foreground/50',
                        )}
                      />
                    ) : (
                      <span className="size-1 opacity-0" />
                    )}
                  </div>

                  {/* "Today" subtle indicator pill */}
                  {isToday && !active && (
                    <span className="absolute bottom-1 h-0.5 w-2.5 rounded-full bg-primary" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Day Header Summary ── */}
        <div className="flex items-center justify-between px-1">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight text-foreground">
                {fullDayMap[selectedDay]}
              </h3>
              {!isTodaySelected ? (
                <button
                  type="button"
                  onClick={() => setSelectedDay(todayKey)}
                  className="flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary hover:bg-primary/20 transition-all active:scale-95 cursor-pointer"
                >
                  <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                  Jump to Today
                </button>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Today
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dayClasses.length === 0
                ? 'No classes scheduled'
                : `${dayClasses.length} ${
                    dayClasses.length === 1 ? 'class' : 'classes'
                  } scheduled`}
              {isTodaySelected && ' · Real-time schedule active'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAddClassOpen(true)}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Add Class</span>
          </button>
        </div>

        {/* ── Timeline List for Selected Day ── */}
        {dayClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3.5 rounded-3xl border border-dashed border-border/80 bg-card/60 py-16 px-4 text-center shadow-2xs">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Calendar className="size-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-foreground">
                Free day on {fullDayMap[selectedDay]}
              </h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs leading-relaxed">
                No classes scheduled. Add a course or import your syllabus timetable.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => setAddClassOpen(true)}
                className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-2xs hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Add Course</span>
              </button>
              <Link
                href="/schedule/import"
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-fill transition-colors"
              >
                <UploadCloud className="size-3.5" />
                <span>Import</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {timelineItems.map((item, idx) => {
              if (item.type === 'now') {
                return (
                  <div key={`now-${idx}`} className="relative my-1 flex items-center gap-3 py-1">
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10.5px] font-black uppercase text-emerald-700 dark:text-emerald-400 shrink-0 shadow-2xs">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="tabular-nums">NOW · {item.timeFormatted}</span>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/60 via-emerald-500/25 to-transparent" />
                    {item.isFinished && (
                      <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
                        Classes finished for today 🎉
                      </span>
                    )}
                  </div>
                )
              }

              if (item.type === 'gap') {
                const hours = Math.floor(item.minutes / 60)
                const mins = item.minutes % 60
                const label = hours > 0 ? `${hours}h ${mins}m free break` : `${mins}m free break`

                return (
                  <div
                    key={`gap-${idx}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border/80 bg-fill/40 px-4 py-2.5 text-[12px] text-muted-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <Coffee className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="font-bold text-foreground">{label}</span>
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        ({formatTime(item.start)} – {formatTime(item.end)})
                      </span>
                    </div>

                    <Link
                      href="/kitchen"
                      className="text-[11px] font-semibold text-primary hover:underline shrink-0"
                    >
                      Quick snack?
                    </Link>
                  </div>
                )
              }

              const entry = item.data
              const color = subjectColorClass[entry.color] || subjectColorClass[1]
              const entryStartMins = minutesOf(entry.start)
              const entryEndMins = minutesOf(entry.end)
              const isHappeningNow =
                isTodaySelected && nowMins >= entryStartMins && nowMins <= entryEndMins
              const hasPassed = isTodaySelected && nowMins > entryEndMins

              return (
                <motion.div
                  key={entry.id}
                  onClick={() => setSelectedClass(entry)}
                  whileTap={{ scale: 0.985 }}
                  transition={IOS_SPRING_SNAPPY}
                  className={`group relative overflow-hidden rounded-3xl border p-4 sm:p-5 shadow-ios transition-all cursor-pointer ${
                    isHappeningNow
                      ? 'border-primary/40 bg-primary/[0.04] ring-1 ring-primary/20'
                      : hasPassed
                      ? 'border-border/50 bg-card/70 opacity-80'
                      : 'border-border/70 bg-card hover:border-primary/40'
                  }`}
                >
                  {/* Left color bar */}
                  <span
                    className={`absolute inset-y-0 left-0 w-1.5 ${color.bg}`}
                    aria-hidden="true"
                  />

                  <div className="flex items-start justify-between gap-3 pl-1">
                    <div className="min-w-0 flex-1">
                      {/* Top Badges */}
                      <div className="flex items-center gap-2">
                        {isHappeningNow && (
                          <span className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10.5px] font-extrabold uppercase text-amber-700 dark:text-amber-300">
                            <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                            In Session
                          </span>
                        )}
                        {entry.code && (
                          <span className="rounded-md bg-fill px-2 py-0.5 text-[11px] font-extrabold text-foreground border border-border/50">
                            {entry.code}
                          </span>
                        )}
                        <span className="text-[12px] font-bold text-muted-foreground tabular-nums">
                          {formatTimeRange(entry.start, entry.end)}
                        </span>
                      </div>

                      {/* Course Name */}
                      <h4 className="mt-1.5 text-base sm:text-lg font-extrabold tracking-tight text-foreground">
                        {entry.subject}
                      </h4>

                      {/* In-Session Live Progress Bar */}
                      {isHappeningNow && (
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                            <span>Lecture in progress</span>
                            <span className="tabular-nums">
                              {Math.max(0, entryEndMins - nowMins)}m remaining
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-fill">
                            <div
                              className="h-full bg-amber-500 transition-all duration-500 rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    5,
                                    ((nowMins - entryStartMins) / (entryEndMins - entryStartMins)) * 100
                                  )
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Room & Instructor Row */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 rounded-full bg-fill/80 border border-border/40 px-2.5 py-1 text-[11.5px] font-semibold text-foreground">
                          <MapPin className="size-3 text-muted-foreground shrink-0" />
                          <span>{entry.room || 'Online'}</span>
                        </span>

                        {entry.instructor &&
                          entry.instructor !== 'TBA' &&
                          entry.instructor !== 'None' && (
                            <span className="flex items-center gap-1.5 rounded-full bg-fill/80 border border-border/40 px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground">
                              <User className="size-3 text-muted-foreground shrink-0" />
                              <span>{entry.instructor}</span>
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
