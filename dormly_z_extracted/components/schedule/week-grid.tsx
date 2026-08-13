'use client'

import { motion } from 'framer-motion'
import { classes, formatTime, minutesOf, subjectColorClass, weekDays } from '@/lib/data'

const START_HOUR = 8
const END_HOUR = 17
const HOUR_HEIGHT = 62

const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)

export function WeekGrid() {
  const top = (time: string) => ((minutesOf(time) - START_HOUR * 60) / 60) * HOUR_HEIGHT
  const height = (start: string, end: string) =>
    ((minutesOf(end) - minutesOf(start)) / 60) * HOUR_HEIGHT

  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-ios">
      <div className="no-scrollbar overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="ios-glass flex border-b border-separator">
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
                            top: top(entry.start),
                            height: Math.max(height(entry.start, entry.end) - 4, 34),
                          }}
                          className={`absolute inset-x-1 overflow-hidden rounded-2xl ${color.soft} px-2 py-1.5`}
                        >
                          <span
                            className={`absolute inset-y-1.5 left-1 w-[3px] rounded-full ${color.bg}`}
                            aria-hidden="true"
                          />
                          <div className="pl-2.5">
                            <p
                              className={`truncate text-[11.5px] leading-tight font-semibold ${color.text}`}
                            >
                              {entry.code}
                            </p>
                            <p className="mt-0.5 truncate text-[10.5px] leading-tight text-muted-foreground">
                              {entry.room}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] leading-tight text-muted-foreground">
                              {formatTime(entry.start)}
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
