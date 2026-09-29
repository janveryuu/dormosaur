'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, UploadCloud } from 'lucide-react'
import { useSchedule } from '@/components/schedule-provider'
import type { ClassEntry } from '@/lib/data'
import { minutesOf, weekDays } from '@/lib/data'
import { getDynamicGridTimeRange } from '@/lib/template-helper'
import { ClassDetailModal } from '@/components/schedule/class-detail-modal'
import { ClassEditModal } from '@/components/schedule/class-edit-modal'

// ─── Premium Muted Color Palette (Notion / Linear inspired) ─────────────────
const GRID_COLORS = [
  // 0 – Indigo
  { dot: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-300', soft: 'bg-indigo-50 dark:bg-indigo-950/60', border: 'border-indigo-200 dark:border-indigo-800/60', accent: 'bg-indigo-500' },
  // 1 – Sky
  { dot: 'bg-sky-500', text: 'text-sky-700 dark:text-sky-300', soft: 'bg-sky-50 dark:bg-sky-950/60', border: 'border-sky-200 dark:border-sky-800/60', accent: 'bg-sky-500' },
  // 2 – Violet
  { dot: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-300', soft: 'bg-violet-50 dark:bg-violet-950/60', border: 'border-violet-200 dark:border-violet-800/60', accent: 'bg-violet-500' },
  // 3 – Emerald
  { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', soft: 'bg-emerald-50 dark:bg-emerald-950/60', border: 'border-emerald-200 dark:border-emerald-800/60', accent: 'bg-emerald-500' },
  // 4 – Rose
  { dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300', soft: 'bg-rose-50 dark:bg-rose-950/60', border: 'border-rose-200 dark:border-rose-800/60', accent: 'bg-rose-500' },
  // 5 – Amber
  { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', soft: 'bg-amber-50 dark:bg-amber-950/60', border: 'border-amber-200 dark:border-amber-800/60', accent: 'bg-amber-500' },
  // 6 – Teal
  { dot: 'bg-teal-500', text: 'text-teal-700 dark:text-teal-300', soft: 'bg-teal-50 dark:bg-teal-950/60', border: 'border-teal-200 dark:border-teal-800/60', accent: 'bg-teal-500' },
  // 7 – Pink
  { dot: 'bg-pink-500', text: 'text-pink-700 dark:text-pink-300', soft: 'bg-pink-50 dark:bg-pink-950/60', border: 'border-pink-200 dark:border-pink-800/60', accent: 'bg-pink-500' },
  // 8 – Orange
  { dot: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-300', soft: 'bg-orange-50 dark:bg-orange-950/60', border: 'border-orange-200 dark:border-orange-800/60', accent: 'bg-orange-500' },
  // 9 – Cyan
  { dot: 'bg-cyan-500', text: 'text-cyan-700 dark:text-cyan-300', soft: 'bg-cyan-50 dark:bg-cyan-950/60', border: 'border-cyan-200 dark:border-cyan-800/60', accent: 'bg-cyan-500' },
  // 10 – Purple
  { dot: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-300', soft: 'bg-purple-50 dark:bg-purple-950/60', border: 'border-purple-200 dark:border-purple-800/60', accent: 'bg-purple-500' },
  // 11 – Lime
  { dot: 'bg-lime-500', text: 'text-lime-700 dark:text-lime-300', soft: 'bg-lime-50 dark:bg-lime-950/60', border: 'border-lime-200 dark:border-lime-800/60', accent: 'bg-lime-500' },
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
const HOUR_HEIGHT_MOBILE = 64
const MOBILE_CLASS_HEIGHT = 44

const shortDayFull: Record<string, string> = {
  Mon: 'Mon',
  Tue: 'Tue',
  Wed: 'Wed',
  Thu: 'Thu',
  Fri: 'Fri',
  Sat: 'Sat',
  Sun: 'Sun',
}

// Returns minutes since midnight for "now" in local time
function nowMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

// Today's weekday as a Mon/Tue/… key
const JS_DAY_TO_KEY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function compactTimeRange(start: string, end: string) {
  const short = (value: string) => {
    const [hour, minute] = value.split(':').map(Number)
    return `${hour % 12 || 12}${minute ? `:${String(minute).padStart(2, '0')}` : ''}`
  }
  return `${short(start)}–${short(end)}`
}

export function WeekGrid({ weekOffset = 0 }: { weekOffset?: number }) {
  const { classes, isHydrated, isSyncing, addClass, updateClass, deleteClass } = useSchedule()
  const [selectedClass, setSelectedClass] = React.useState<ClassEntry | null>(null)
  const [editClass, setEditClass] = React.useState<ClassEntry | null>(null)
  const [nowMins, setNowMins] = React.useState(nowMinutes)
  const [todayKey, setTodayKey] = React.useState(() => JS_DAY_TO_KEY[new Date().getDay()])
  const desktopScrollRef = React.useRef<HTMLDivElement | null>(null)

  // Live clock – update every 30s
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

  // ─── Loading Skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    const skeletonHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
    return (
      <div className="overflow-hidden rounded-3xl bg-card shadow-ios border border-border/60">
        <div className="no-scrollbar overflow-x-auto">
          <div className="w-full min-w-[760px]">
            <div className="sticky top-0 z-10 flex border-b border-separator bg-card/95 backdrop-blur-md">
              <div className="w-14 shrink-0 border-r border-separator/40" />
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="flex-1 py-3 text-center text-[12.5px] font-semibold tracking-[0.03em] text-muted-foreground uppercase"
                >
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
                  <div
                    key={hour}
                    style={{ top: i * HOUR_HEIGHT_DESKTOP }}
                    className="pointer-events-none absolute inset-x-0 border-t border-separator/30"
                    aria-hidden="true"
                  />
                ))}
                {weekDays.map((day, dayIndex) => (
                  <div
                    key={day}
                    className="relative flex-1 border-l first:border-l-0 border-separator/30 px-1.5"
                    style={{ height: skeletonHours.length * HOUR_HEIGHT_DESKTOP }}
                  >
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

  // ─── Empty State ───────────────────────────────────────────────────────────
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
          className="mt-2 flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-bold text-primary-foreground shadow-sm transition-[color,background-color,box-shadow,transform] hover:scale-105"
        >
          <UploadCloud className="size-4" />
          <span>Import Schedule</span>
        </Link>
      </div>
    )
  }

  // ─── Compute Grid Range ────────────────────────────────────────────────────
  const range = getDynamicGridTimeRange(classes)
  const startHour = range.startHour
  const endHour = range.endHour
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i)
  // The mobile board shows the hours occupied by real classes without the
  // desktop grid's generous empty-hour buffer.
  const mobileStartHour = Math.floor(Math.min(...classes.map((entry) => minutesOf(entry.start))) / 60)
  const mobileEndHour = Math.ceil(Math.max(...classes.map((entry) => minutesOf(entry.end))) / 60) + 1
  const mobileHours = Array.from({ length: mobileEndHour - mobileStartHour }, (_, i) => mobileStartHour + i)

  const topDesktop = (time: string) =>
    ((minutesOf(time) - startHour * 60) / 60) * HOUR_HEIGHT_DESKTOP
  const heightDesktop = (start: string, end: string) =>
    ((minutesOf(end) - minutesOf(start)) / 60) * HOUR_HEIGHT_DESKTOP
  const topMobile = (time: string) =>
    ((minutesOf(time) - mobileStartHour * 60) / 60) * HOUR_HEIGHT_MOBILE

  // "Now" indicator position (pixels from grid top)
  const nowTopDesktop = ((nowMins - startHour * 60) / 60) * HOUR_HEIGHT_DESKTOP
  const nowTopMobile = ((nowMins - mobileStartHour * 60) / 60) * HOUR_HEIGHT_MOBILE
  const nowVisible = nowMins >= startHour * 60 && nowMins <= endHour * 60
  const nowVisibleMobile = nowMins >= mobileStartHour * 60 && nowMins <= mobileEndHour * 60

  // Smart column widths – days with 0 classes get 0.55 flex, days with classes get 1
  const dayClassCount = weekDays.map((day) => classes.filter((c) => c.days.includes(day)).length)
  const getDesktopFlex = (count: number) => (count === 0 ? '0.55' : '1')
  const mobileWeekStart = new Date()
  mobileWeekStart.setDate(mobileWeekStart.getDate() - ((mobileWeekStart.getDay() + 6) % 7) + weekOffset * 7)
  const mobileDays = weekDays.slice(0, 5)
  const mobileDayLayouts = mobileDays.map((day) => {
    let previousBottom = -Infinity
    return classes
      .filter((entry) => entry.days.includes(day))
      .sort((a, b) => minutesOf(a.start) - minutesOf(b.start))
      .map((entry) => {
        // Labels keep their real start position unless another label occupies it.
        const actualTop = Math.max(0, topMobile(entry.start))
        const top = Math.max(actualTop, previousBottom + 3)
        previousBottom = top + MOBILE_CLASS_HEIGHT
        return { entry, top }
      })
  })
  const mobileGridHeight = Math.max(
    mobileHours.length * HOUR_HEIGHT_MOBILE,
    ...mobileDayLayouts.flatMap((day) => day.map(({ top }) => top + MOBILE_CLASS_HEIGHT + 12)),
  )

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

      {/* Mobile weekly board keeps the same live class data and detail modal. */}
      <div className="mobile-week-board block sm:hidden overflow-hidden rounded-3xl bg-card shadow-ios border border-border/60">
        {/* Header */}
        <div className="flex border-b border-separator bg-card/95 backdrop-blur-md">
          <div className="w-12 shrink-0 py-2.5" />
          <div className="grid flex-1 grid-cols-5">
            {mobileDays.map((day, index) => {
              const isToday = day === todayKey && weekOffset === 0
              const date = new Date(mobileWeekStart)
              date.setDate(mobileWeekStart.getDate() + index)
              return (
                <div
                  key={day}
                  className={`mobile-week-day py-2 text-center border-l first:border-l-0 border-separator/40 ${
                    isToday ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  <span>{day}</span><strong>{date.getDate()}</strong>
                </div>
              )
            })}
          </div>
        </div>

        {/* Body */}
        <div className="relative flex">
          {/* Time column */}
          <div className="w-12 shrink-0 bg-card/50" style={{ height: mobileGridHeight }}>
            {mobileHours.map((hour) => (
              <div key={hour} style={{ height: HOUR_HEIGHT_MOBILE }} className="relative pr-1 text-right">
                <span className="mobile-week-hour absolute -top-2 right-1 text-muted-foreground/70 select-none">
                  {hour % 12 === 0 ? 12 : hour % 12} {hour >= 12 ? 'PM' : 'AM'}
                </span>
              </div>
            ))}
          </div>

          <div className="relative grid flex-1 grid-cols-5">
            {/* Hour grid lines */}
            {mobileHours.map((hour, i) => (
              <div
                key={hour}
                style={{ top: i * HOUR_HEIGHT_MOBILE }}
                className="pointer-events-none absolute inset-x-0 border-t border-separator/25"
                aria-hidden="true"
              />
            ))}

            {/* Today column tint */}
            {mobileDays.map((day, di) =>
              day === todayKey && weekOffset === 0 ? (
                <div
                  key={`today-tint-mobile-${di}`}
                  className="pointer-events-none absolute inset-y-0 bg-primary/[0.04]"
                  style={{
                    left: `${(di / 5) * 100}%`,
                    width: `${(1 / 5) * 100}%`,
                  }}
                />
              ) : null,
            )}

            {/* Now indicator line (mobile) */}
            {nowVisibleMobile && (
              <div
                className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                style={{ top: nowTopMobile - 1 }}
              >
                <div className="size-2 shrink-0 rounded-full bg-rose-500 shadow-xs" style={{ marginLeft: -1 }} />
                <div className="h-[1.5px] flex-1 bg-rose-500/80" />
              </div>
            )}

            {mobileDays.map((day, dayIndex) => {
              const dayClasses = mobileDayLayouts[dayIndex]
              return (
                <div
                  key={day}
                  className="relative border-l first:border-l-0 border-separator/25 px-[1.5px]"
                  style={{ height: mobileGridHeight }}
                >
                  {dayClasses.map(({ entry, top }) => {
                    const colorIdx = codeToColorIndex(entry.code)
                    const color = GRID_COLORS[colorIdx]
                    const compactCode = entry.code.replace(/\s+/g, '')

                    return (
                      <motion.button
                        type="button"
                        key={entry.id}
                        onClick={() => setSelectedClass(entry)}
                        aria-label={`${entry.code}, ${entry.start} to ${entry.end}. View class details`}
                        title={`${entry.code} · ${entry.start}–${entry.end}`}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          top,
                          height: MOBILE_CLASS_HEIGHT,
                        }}
                        className={`mobile-class-block absolute inset-x-[2px] overflow-hidden rounded-md ${color.soft} border ${color.border} flex flex-col justify-center text-left cursor-pointer transition-transform`}
                      >
                        <span className={`absolute inset-y-0 left-0 w-[3px] ${color.accent}`} aria-hidden="true" />

                        <div className="mobile-class-content flex flex-col justify-center leading-tight pl-[6px] pr-[1px] py-0.5">
                          <span className={`mobile-class-code font-bold ${color.text} ${compactCode.length > 8 ? 'is-long' : ''}`}>{compactCode}</span>
                          <span className="mobile-class-time font-medium text-muted-foreground tabular-nums">
                            {compactTimeRange(entry.start, entry.end)}
                          </span>
                        </div>
                      </motion.button>
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
          <div className="w-full min-w-[690px] sm:min-w-[710px] lg:min-w-[780px]">
            {/* ── Header Row ── */}
            <div className="sticky top-0 z-20 flex border-b border-separator bg-card/95 backdrop-blur-md">
              {/* Time column spacer */}
              <div className="sticky left-0 z-30 w-11 sm:w-12 lg:w-14 shrink-0 bg-card/95 backdrop-blur-md border-r border-separator/40" />
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
              <div className="sticky left-0 z-20 w-11 sm:w-12 lg:w-14 shrink-0 bg-card/95 backdrop-blur-md border-r border-separator/40">
                {hours.map((hour) => (
                  <div key={hour} style={{ height: HOUR_HEIGHT_DESKTOP }} className="relative pr-2 text-right">
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
                  <div
                    key={hour}
                    style={{ top: i * HOUR_HEIGHT_DESKTOP }}
                    className="pointer-events-none absolute inset-x-0 border-t border-separator/25"
                    aria-hidden="true"
                  />
                ))}

                {/* Half-hour subtle lines */}
                {hours.map((hour, i) => (
                  <div
                    key={`half-${hour}`}
                    style={{ top: i * HOUR_HEIGHT_DESKTOP + HOUR_HEIGHT_DESKTOP / 2 }}
                    className="pointer-events-none absolute inset-x-0 border-t border-separator/12"
                    aria-hidden="true"
                  />
                ))}

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
                      className={`relative border-l first:border-l-0 border-separator/25 px-1.5 ${
                        isToday ? 'bg-primary/[0.025]' : ''
                      }`}
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

                        // Info tier based on block height
                        // Tier A (≥80px): code + room + time (full detail)
                        // Tier B (≥52px): code + start time   (medium)
                        // Tier C (<52px):  code only          (compact)
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
                              {/* Course code — NEVER truncated */}
                              <p
                                className={`text-[11.5px] font-black leading-none tracking-tight whitespace-nowrap overflow-hidden ${color.text}`}
                                style={{ textOverflow: 'clip' }}
                              >
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
