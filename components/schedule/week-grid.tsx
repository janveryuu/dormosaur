'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, Plus, UploadCloud } from 'lucide-react'
import { useSchedule } from '@/components/schedule-provider'
import { formatTimeRange, minutesOf, subjectColorClass, weekDays } from '@/lib/data'
import { getDynamicGridTimeRange } from '@/lib/template-helper'

const HOUR_HEIGHT = 62

export function WeekGrid() {
  const { classes, isHydrated, isSyncing } = useSchedule()

  const isLoading = !isHydrated || isSyncing

  if (isLoading) {
    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
    return (
      <div className="overflow-hidden rounded-3xl bg-card shadow-ios">
        <div className="no-scrollbar overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="sticky top-0 z-10 flex border-b border-separator bg-card/95 backdrop-blur-md">
              <div className="w-14 shrink-0" />
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
              <div className="w-14 shrink-0">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    style={{ height: HOUR_HEIGHT }}
                    className="relative pr-2 text-right"
                  >
                    <span className="absolute -top-2 right-2 text-[11px] font-medium text-muted-foreground/60">
                      {hour % 12 === 0 ? 12 : hour % 12}
                      {hour >= 12 ? 'p' : 'a'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="relative flex flex-1">
                {hours.map((hour, i) => (
                  <div
                    key={hour}
                    style={{ top: i * HOUR_HEIGHT }}
                    className="pointer-events-none absolute inset-x-0 border-t border-separator/40"
                    aria-hidden="true"
                  />
                ))}

                {weekDays.map((day, dayIndex) => (
                  <div
                    key={day}
                    className="relative flex-1 border-l border-separator/40 px-1 py-2"
                    style={{ height: hours.length * HOUR_HEIGHT }}
                  >
                    {/* Pulsing Skeleton Blocks */}
                    {dayIndex % 2 === 0 && (
                      <div className="animate-pulse absolute inset-x-1 top-6 h-20 rounded-2xl bg-muted/60" />
                    )}
                    {dayIndex % 3 === 1 && (
                      <div className="animate-pulse absolute inset-x-1 top-36 h-24 rounded-2xl bg-muted/50" />
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

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3.5 rounded-3xl border border-dashed border-border/80 bg-card/60 py-16 text-center shadow-xs">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Calendar className="size-7" />
        </div>
        <div>
          <h3 className="text-[17px] font-bold text-foreground">No classes yet</h3>
          <p className="text-[13.5px] text-muted-foreground mt-1 max-w-sm">
            No classes yet — import your schedule to get started.
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Link
            href="/schedule/import"
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-bold text-primary-foreground shadow-sm transition-all hover:scale-105"
          >
            <UploadCloud className="size-4" />
            <span>Import Schedule</span>
          </Link>
        </div>
      </div>
    )
  }

  const range = getDynamicGridTimeRange(classes)
  const startHour = range.startHour
  const endHour = range.endHour
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i)

  const top = (time: string) => ((minutesOf(time) - startHour * 60) / 60) * HOUR_HEIGHT
  const height = (start: string, end: string) =>
    ((minutesOf(end) - minutesOf(start)) / 60) * HOUR_HEIGHT

  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-ios">
      <div className="no-scrollbar overflow-x-auto">
        <div className="min-w-[680px]">
          {/* Header Row */}
          <div className="sticky top-0 z-10 flex border-b border-separator bg-card/95 backdrop-blur-md">
            <div className="w-14 shrink-0" />
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
            <div className="w-14 shrink-0">
              {hours.map((hour) => (
                <div
                  key={hour}
                  style={{ height: HOUR_HEIGHT }}
                  className="relative pr-2 text-right"
                >
                  <span className="absolute -top-2 right-2 text-[11px] font-medium text-muted-foreground">
                    {hour % 12 === 0 ? 12 : hour % 12}
                    {hour >= 12 ? 'p' : 'a'}
                  </span>
                </div>
              ))}
            </div>

            <div className="relative flex flex-1">
              {hours.map((hour, i) => (
                <div
                  key={hour}
                  style={{ top: i * HOUR_HEIGHT }}
                  className="pointer-events-none absolute inset-x-0 border-t border-separator"
                  aria-hidden="true"
                />
              ))}

              {weekDays.map((day) => {
                const dayClasses = classes.filter((c) => c.days.includes(day))
                return (
                  <div
                    key={day}
                    className="relative flex-1 border-l border-separator px-1"
                    style={{ height: hours.length * HOUR_HEIGHT }}
                  >
                    {dayClasses.map((entry, index) => {
                      const color = subjectColorClass[entry.color]
                      const blockHeight = Math.max(height(entry.start, entry.end) - 4, 34)
                      const isVeryShort = blockHeight < 50
                      const isShort = blockHeight >= 50 && blockHeight < 68
                      const timeRangeStr = formatTimeRange(entry.start, entry.end)

                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, scale: 0.94 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            type: 'spring',
                            stiffness: 320,
                            damping: 28,
                            delay: index * 0.04,
                          }}
                          whileHover={{ scale: 1.02 }}
                          style={{
                            top: Math.max(0, top(entry.start)),
                            height: blockHeight,
                          }}
                          className={`absolute inset-x-1 overflow-hidden rounded-2xl ${color.soft} border border-black/5 dark:border-white/10 px-2 py-1.5 shadow-xs flex flex-col justify-center`}
                        >
                          <span
                            className={`absolute inset-y-1.5 left-1 w-[3px] rounded-full ${color.bg}`}
                            aria-hidden="true"
                          />
                          <div className="pl-2.5 min-w-0">
                            <p
                              className={`truncate text-[11.5px] leading-tight font-semibold ${color.text}`}
                            >
                              {entry.code}
                            </p>
                            {!isVeryShort && (!isShort || blockHeight >= 58) && entry.room && (
                              <p className="mt-0.5 truncate text-[10.5px] leading-tight text-muted-foreground">
                                {entry.room}
                              </p>
                            )}
                            <p className="mt-0.5 truncate text-[10px] leading-tight font-semibold text-muted-foreground">
                              {timeRangeStr}
                            </p>
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
  )
}
