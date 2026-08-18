'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, UploadCloud } from 'lucide-react'
import { useSchedule } from '@/components/schedule-provider'
import type { ClassEntry } from '@/lib/data'
import { formatTimeRange, minutesOf, weekDays } from '@/lib/data'
import { getDynamicGridTimeRange } from '@/lib/template-helper'
import { ClassDetailModal } from '@/components/schedule/class-detail-modal'
import { ClassEditModal } from '@/components/schedule/class-edit-modal'

// ─── Premium muted color palette (Notion / Linear inspired) ─────────────────
// Each color slot has: bg gradient, text, soft background, border accent, now-dot
const GRID_COLORS = [
  // 0 – Indigo
  { dot: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-300', soft: 'bg-indigo-50 dark:bg-indigo-950/60', border: 'border-indigo-200 dark:border-indigo-800/60', accent: 'bg-indigo-400' },
  // 1 – Sky
  { dot: 'bg-sky-500', text: 'text-sky-700 dark:text-sky-300', soft: 'bg-sky-50 dark:bg-sky-950/60', border: 'border-sky-200 dark:border-sky-800/60', accent: 'bg-sky-400' },
  // 2 – Violet
  { dot: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-300', soft: 'bg-violet-50 dark:bg-violet-950/60', border: 'border-violet-200 dark:border-violet-800/60', accent: 'bg-violet-400' },
  // 3 – Emerald
  { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', soft: 'bg-emerald-50 dark:bg-emerald-950/60', border: 'border-emerald-200 dark:border-emerald-800/60', accent: 'bg-emerald-400' },
  // 4 – Rose
  { dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300', soft: 'bg-rose-50 dark:bg-rose-950/60', border: 'border-rose-200 dark:border-rose-800/60', accent: 'bg-rose-400' },
  // 5 – Amber
  { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', soft: 'bg-amber-50 dark:bg-amber-950/60', border: 'border-amber-200 dark:border-amber-800/60', accent: 'bg-amber-400' },
  // 6 – Teal
  { dot: 'bg-teal-500', text: 'text-teal-700 dark:text-teal-300', soft: 'bg-teal-50 dark:bg-teal-950/60', border: 'border-teal-200 dark:border-teal-800/60', accent: 'bg-teal-400' },
  // 7 – Pink
  { dot: 'bg-pink-500', text: 'text-pink-700 dark:text-pink-300', soft: 'bg-pink-50 dark:bg-pink-950/60', border: 'border-pink-200 dark:border-pink-800/60', accent: 'bg-pink-400' },
  // 8 – Orange
  { dot: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-300', soft: 'bg-orange-50 dark:bg-orange-950/60', border: 'border-orange-200 dark:border-orange-800/60', accent: 'bg-orange-400' },
  // 9 – Cyan
  { dot: 'bg-cyan-500', text: 'text-cyan-700 dark:text-cyan-300', soft: 'bg-cyan-50 dark:bg-cyan-950/60', border: 'border-cyan-200 dark:border-cyan-800/60', accent: 'bg-cyan-400' },
  // 10 – Purple
  { dot: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-300', soft: 'bg-purple-50 dark:bg-purple-950/60', border: 'border-purple-200 dark:border-purple-800/60', accent: 'bg-purple-400' },
  // 11 – Lime
  { dot: 'bg-lime-500', text: 'text-lime-700 dark:text-lime-300', soft: 'bg-lime-50 dark:bg-lime-950/60', border: 'border-lime-200 dark:border-lime-800/60', accent: 'bg-lime-400' },
]

/** Deterministically map a course code → GRID_COLORS index (stable, never random) */
function codeToColorIndex(code: string): number {
  let hash = 0
  for (let i = 0; i < code.length; i++) {
    hash = (hash * 31 + code.charCodeAt(i)) >>> 0
  }
  return hash % GRID_COLORS.length
}

const HOUR_HEIGHT_DESKTOP = 72
const HOUR_HEIGHT_MOBILE = 54

const shortDayFull: Record<string, string> = {
  Mon: 'Mon',
  Tue: 'Tue',
  Wed: 'Wed',
  Thu: 'Thu',
  Fri: 'Fri',
  Sat: 'Sat',
  Sun: 'Sun',
}
const shortMobileDayMap: Record<string, string> = {
  Mon: 'M',
  Tue: 'T',
  Wed: 'W',
  Thu: 'T',
  Fri: 'F',
  Sat: 'S',
  Sun: 'S',
}

// Returns minutes since midnight for "now" in local time
function nowMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

// Today's weekday as a Mon/Tue/… key
const JS_DAY_TO_KEY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function WeekGrid() {
  const { classes, isHydrated, isSyncing, addClass, updateClass, deleteClass } = useSchedule()
  const [selectedClass, setSelectedClass] = React.useState<ClassEntry | null>(null)
  const [editClass, setEditClass] = React.useState<ClassEntry | null>(null)
  const [nowMins, setNowMins] = React.useState(nowMinutes)
  const [todayKey, setTodayKey] = React.useState(() => JS_DAY_TO_KEY[new Date().getDay()])
  const desktopScrollRef = React.useRef<HTMLDivElement | null>(null)

  // Live clock – update every 30 s
  React.useEffect(() => {
    const tick = () => {
      setNowMins(nowMinutes())
      setTodayKey(JS_DAY_TO_KEY[new Date().getDay()])
    }
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  const isLoading = !isHydrated || isSyncing

  React.useEffect(() => {
    if (desktopScrollRef.current) {
      desktopScrollRef.current.scrollLeft = 0
    }
  }, [classes])

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    const skeletonHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
    return (
      <div className="overflow-hidden rounded-3xl bg-card shadow-ios border border-border/60">
        <div className="no-scrollbar overflow-x-auto">
          <div className="w-full min-w-[760px]">
            <div className="sticky top-0 z-10 flex border-b border-separator bg-card/95 backdrop-blur-md">
              <div className="w-14 shrink-0 border-r border-separator/40" />
              {weekDays.map((day) => (
                <div key={day} className="flex-1 py-3 text-center text-[12.5px] font-semibold tracking-[0.03em] text-muted-foreground uppercase">
                  {day}
                </div>
              ))}
            </div>
            <div className="relative flex">
              <div className="w-14 shrink-0 border-r border-separator/40">
                {skeletonHours.map((hour) => (
                  <div key={hour} style={{ height: HOUR_HEIGHT_DESKTOP }} className="relative pr-2 text-right">
                    <span className="absolute -top-2 right-2 text-[11px] font-medium text-muted-foreground/50">
                      {hour % 12 === 0 ? 12 : hour % 12}{hour >= 12 ? 'p' : 'a'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="relative flex flex-1">
                {skeletonHours.map((hour, i) => (
                  <div key={hour} style={{ top: i * HOUR_HEIGHT_DESKTOP }}
                    className="pointer-events-none absolute inset-x-0 border-t border-separator/30" aria-hidden="true" />
                ))}
                {weekDays.map((day, dayIndex) => (
                  <div key={day} className="relative flex-1 border-l first:border-l-0 border-separator/30 px-1.5"
                    style={{ height: skeletonHours.length * HOUR_HEIGHT_DESKTOP }}>
                    {dayIndex % 2 === 0 && (
                      <div className="animate-pulse absolute inset-x-1.5 top-8 h-[68px] rounded-2xl bg-muted/60" />
                    )}
                    {dayIndex % 3 === 1 && (
                      <div className="animate-pulse absolute inset-x-1.5 top-[168px] h-20 rounded-2xl bg-muted/50" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Empty state ───────────────────────────────────────────────────────────
  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3.5 rounded-3xl border border-dashed border-border/80 bg-card/60 py-16 text-center shadow-xs">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Calendar className="size-7" />
        </div>
        <div>
          <h3 className="text-[17px] font-bold text-foreground">No classes yet</h3>
          <p className="text-[13.5px] text-muted-foreground mt-1 max-w-sm">
            Import your schedule to get started.
          </p>
        </div>
        <Link
          href="/schedule/import"
          className="mt-2 flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-bold text-primary-foreground shadow-sm transition-all hover:scale-105"
        >
          <UploadCloud className="size-4" />
          <span>Import Schedule</span>
        </Link>
      </div>
    )
  }

  // ─── Compute grid range ────────────────────────────────────────────────────
  const range = getDynamicGridTimeRange(classes)
  const startHour = range.startHour
  const endHour = range.endHour
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i)

  const topDesktop = (time: string) =>
    ((minutesOf(time) - startHour * 60) / 60) * HOUR_HEIGHT_DESKTOP
  const heightDesktop = (start: string, end: string) =>
    ((minutesOf(end) - minutesOf(start)) / 60) * HOUR_HEIGHT_DESKTOP
  const topMobile = (time: string) =>
    ((minutesOf(time) - startHour * 60) / 60) * HOUR_HEIGHT_MOBILE
  const heightMobile = (start: string, end: string) =>
    ((minutesOf(end) - minutesOf(start)) / 60) * HOUR_HEIGHT_MOBILE

  // "Now" indicator position (pixels from grid top)
  const nowTopDesktop = ((nowMins - startHour * 60) / 60) * HOUR_HEIGHT_DESKTOP
  const nowTopMobile = ((nowMins - startHour * 60) / 60) * HOUR_HEIGHT_MOBILE
  const nowVisible = nowMins >= startHour * 60 && nowMins <= endHour * 60

  // Smart column widths – days with 0 classes get 0.55 flex, days with classes get 1
  const dayClassCount = weekDays.map((day) => classes.filter((c) => c.days.includes(day)).length)
  const getDesktopFlex = (count: number) => (count === 0 ? '0.55' : '1')

  return (
    <>
      <ClassDetailModal
        entry={selectedClass}
        onClose={() => setSelectedClass(null)}
        onEdit={(entry) => setEditClass(entry)}
      />

      <ClassEditModal
        open={Boolean(editClass)}
        onClose={() => setEditClass(null)}
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

      {/* ── MOBILE 7-DAY COMPACT GRID ── */}
      <div className="block sm:hidden overflow-hidden rounded-3xl bg-card shadow-ios border border-border/60">
        {/* Header */}
        <div className="flex border-b border-separator bg-card/95 backdrop-blur-md">
          <div className="w-8 shrink-0 py-2.5 border-r border-separator/40" />
          <div className="grid flex-1 grid-cols-7">
            {weekDays.map((day) => {
              const isToday = day === todayKey
              return (
                <div
                  key={day}
                  className={`py-2.5 text-center text-[11px] font-black uppercase border-l first:border-l-0 border-separator/40 ${isToday ? 'text-primary' : 'text-foreground'}`}
                >
                  {shortMobileDayMap[day] || day}
                  {isToday && <div className="mx-auto mt-0.5 size-1 rounded-full bg-primary" />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Body */}
        <div className="relative flex">
          {/* Time column */}
          <div className="w-8 shrink-0 border-r border-separator/40 bg-card/50">
            {hours.map((hour) => (
              <div key={hour} style={{ height: HOUR_HEIGHT_MOBILE }} className="relative pr-1 text-right">
                <span className="absolute -top-2 right-1 text-[9px] font-semibold text-muted-foreground/60">
                  {hour % 12 === 0 ? 12 : hour % 12}{hour >= 12 ? 'p' : 'a'}
                </span>
              </div>
            ))}
          </div>

          <div className="relative grid flex-1 grid-cols-7">
            {/* Hour grid lines */}
            {hours.map((hour, i) => (
              <div key={hour} style={{ top: i * HOUR_HEIGHT_MOBILE }}
                className="pointer-events-none absolute inset-x-0 border-t border-separator/25" aria-hidden="true" />
            ))}

            {/* Today column tint */}
            {weekDays.map((day, di) =>
              day === todayKey ? (
                <div
                  key={`today-tint-mobile-${di}`}
                  className="pointer-events-none absolute inset-y-0 bg-primary/[0.035]"
                  style={{
                    left: `${(di / 7) * 100}%`,
                    width: `${(1 / 7) * 100}%`,
                  }}
                />
              ) : null,
            )}

            {/* Now indicator line (mobile) */}
            {nowVisible && (
              <div
                className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                style={{ top: nowTopMobile }}
              >
                <div className="h-[2px] flex-1 bg-rose-500/80" />
                <div className="size-2 shrink-0 rounded-full bg-rose-500" style={{ marginLeft: -1 }} />
              </div>
            )}

            {weekDays.map((day) => {
              const dayClasses = classes.filter((c) => c.days.includes(day))
              return (
                <div
                  key={day}
                  className="relative border-l first:border-l-0 border-separator/25 px-[2px]"
                  style={{ height: hours.length * HOUR_HEIGHT_MOBILE }}
                >
                  {dayClasses.map((entry) => {
                    const colorIdx = codeToColorIndex(entry.code)
                    const color = GRID_COLORS[colorIdx]
                    const blockHeight = Math.max(heightMobile(entry.start, entry.end) - 2, 28)

                    return (
                      <motion.div
                        key={entry.id}
                        onClick={() => setSelectedClass(entry)}
                        whileTap={{ scale: 0.93 }}
                        style={{ top: Math.max(0, topMobile(entry.start)), height: blockHeight }}
                        className={`absolute inset-x-[2px] overflow-hidden rounded-lg ${color.soft} border ${color.border} flex flex-col justify-center items-center text-center cursor-pointer`}
                      >
                        <span className={`w-full px-[2px] text-[8.5px] font-extrabold leading-tight text-center truncate ${color.text}`}>
                          {entry.code}
                        </span>
                      </motion.div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── DESKTOP / TABLET FULL WEEK GRID ── */}
      <div className="hidden sm:block overflow-hidden rounded-3xl bg-card shadow-ios border border-border/60">
        <div ref={desktopScrollRef} className="no-scrollbar overflow-x-auto">
          <div className="w-full min-w-[800px]">

            {/* ── Header Row ── */}
            <div className="sticky top-0 z-20 flex border-b border-separator bg-card/95 backdrop-blur-md">
              {/* Time column spacer */}
              <div className="sticky left-0 z-30 w-14 shrink-0 bg-card/95 backdrop-blur-md border-r border-separator/40" />
              {weekDays.map((day, di) => {
                const isToday = day === todayKey
                const count = dayClassCount[di]
                return (
                  <div
                    key={day}
                    style={{ flex: getDesktopFlex(count) }}
                    className={`relative py-3 text-center transition-colors ${isToday ? 'bg-primary/5' : ''}`}
                  >
                    <span
                      className={`block text-[12px] font-semibold tracking-[0.04em] uppercase transition-colors ${
                        isToday ? 'text-primary font-black' : 'text-muted-foreground'
                      }`}
                    >
                      {shortDayFull[day] || day}
                    </span>
                    {isToday && (
                      <span className="absolute bottom-0 inset-x-0 h-[2.5px] rounded-full bg-primary/60" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* ── Grid Body ── */}
            <div className="relative flex">

              {/* Sticky time column */}
              <div className="sticky left-0 z-20 w-14 shrink-0 bg-card/95 backdrop-blur-md border-r border-separator/40">
                {hours.map((hour) => (
                  <div key={hour} style={{ height: HOUR_HEIGHT_DESKTOP }} className="relative pr-2.5 text-right">
                    <span className="absolute -top-[9px] right-2.5 text-[10.5px] font-medium text-muted-foreground/55 tabular-nums select-none">
                      {hour % 12 === 0 ? 12 : hour % 12}{hour >= 12 ? 'p' : 'a'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Day columns area */}
              <div className="relative flex flex-1">

                {/* Hour gridlines */}
                {hours.map((hour, i) => (
                  <div key={hour} style={{ top: i * HOUR_HEIGHT_DESKTOP }}
                    className="pointer-events-none absolute inset-x-0 border-t border-separator/25" aria-hidden="true" />
                ))}

                {/* Half-hour subtle lines */}
                {hours.map((hour, i) => (
                  <div key={`half-${hour}`}
                    style={{ top: i * HOUR_HEIGHT_DESKTOP + HOUR_HEIGHT_DESKTOP / 2 }}
                    className="pointer-events-none absolute inset-x-0 border-t border-separator/12" aria-hidden="true" />
                ))}

                {/* Today column tint */}
                {weekDays.map((day, di) => {
                  if (day !== todayKey) return null
                  // Calculate left offset from flex (approximate using index / count)
                  return (
                    <div
                      key={`today-tint-${di}`}
                      className="pointer-events-none absolute inset-y-0 bg-primary/[0.03] z-0"
                      style={{
                        // We can't easily get exact flex-position; use a data- hook instead
                        // This will be handled by the column's own background below
                        display: 'none',
                      }}
                    />
                  )
                })}

                {/* "Now" indicator line */}
                {nowVisible && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-30 flex items-center"
                    style={{ top: nowTopDesktop - 1 }}
                  >
                    <div className="size-2.5 shrink-0 rounded-full bg-rose-500 shadow-sm ml-[1px]" />
                    <div className="h-[1.5px] flex-1 bg-rose-500/70" />
                  </div>
                )}

                {/* Per-day columns */}
                {weekDays.map((day, di) => {
                  const dayClasses = classes.filter((c) => c.days.includes(day))
                  const isToday = day === todayKey
                  const count = dayClassCount[di]

                  return (
                    <div
                      key={day}
                      className={`relative border-l first:border-l-0 border-separator/25 px-1.5 ${isToday ? 'bg-primary/[0.025]' : ''}`}
                      style={{
                        flex: getDesktopFlex(count),
                        height: hours.length * HOUR_HEIGHT_DESKTOP,
                      }}
                    >
                      {dayClasses.map((entry, index) => {
                        const colorIdx = codeToColorIndex(entry.code)
                        const color = GRID_COLORS[colorIdx]
                        const rawH = heightDesktop(entry.start, entry.end)
                        // Min height floor = 36px so content always has room
                        const blockHeight = Math.max(rawH - 4, 36)
                        const durationMins = minutesOf(entry.end) - minutesOf(entry.start)

                        // Info tier based on block height AND column flex
                        // Tier A (≥80px): code + room + time   (full detail)
                        // Tier B (≥56px): code + start time     (medium)
                        // Tier C (<56px):  code only            (compact)
                        const tierA = blockHeight >= 80
                        const tierB = blockHeight >= 52 && !tierA
                        const timeStart = (() => {
                          const [h, m] = entry.start.split(':').map(Number)
                          const hr = h % 12 === 0 ? 12 : h % 12
                          const period = h >= 12 ? 'PM' : 'AM'
                          return `${hr}:${String(m).padStart(2, '0')} ${period}`
                        })()

                        return (
                          <motion.div
                            key={entry.id}
                            onClick={() => setSelectedClass(entry)}
                            initial={{ opacity: 0, scale: 0.94, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{
                              type: 'spring',
                              stiffness: 340,
                              damping: 28,
                              delay: index * 0.035,
                            }}
                            whileHover={{ scale: 1.018, zIndex: 10 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                              top: Math.max(0, topDesktop(entry.start)),
                              height: blockHeight,
                              position: 'absolute',
                              left: 6,
                              right: 6,
                            }}
                            className={`overflow-hidden rounded-[14px] ${color.soft} border ${color.border} cursor-pointer shadow-xs flex flex-col transition-shadow hover:shadow-md`}
                          >
                            {/* Left accent stripe */}
                            <span className={`absolute inset-y-[5px] left-[5px] w-[3px] rounded-full ${color.accent}`} />

                            {/* Content */}
                            <div className="pl-[14px] pr-2 py-[5px] flex flex-col justify-center h-full min-h-0">
                              {/* Course code — NEVER truncated, always first priority */}
                              <p className={`text-[11.5px] font-black leading-none tracking-tight whitespace-nowrap overflow-hidden ${color.text}`}
                                style={{ textOverflow: 'clip' }}>
                                {entry.code}
                              </p>

                              {tierA && (
                                <>
                                  {entry.room && entry.room !== 'TBA' && entry.room !== '' && (
                                    <p className="mt-[3px] text-[9.5px] font-semibold text-muted-foreground leading-none truncate">
                                      {entry.room}
                                    </p>
                                  )}
                                  <p className="mt-[3px] text-[9px] font-medium text-muted-foreground/75 leading-none tabular-nums truncate">
                                    {timeStart}
                                  </p>
                                </>
                              )}

                              {tierB && (
                                <p className="mt-[3px] text-[9px] font-medium text-muted-foreground/75 leading-none tabular-nums">
                                  {timeStart}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
