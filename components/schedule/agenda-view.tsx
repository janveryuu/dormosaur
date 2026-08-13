'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, MapPin, UploadCloud, User } from 'lucide-react'
import { useSchedule } from '@/components/schedule-provider'
import { formatTime, minutesOf, subjectColorClass, weekDays } from '@/lib/data'

const fullDay: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
}

export function AgendaView() {
  const { classes, isHydrated, isSyncing } = useSchedule()
  const isLoading = !isHydrated || isSyncing

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {['Mon', 'Wed', 'Fri'].map((day) => (
          <section key={day}>
            <div className="ios-glass sticky top-14 z-10 -mx-5 flex items-baseline gap-2 px-5 py-2 lg:-mx-8 lg:px-8">
              <h2 className="text-[17px] font-bold tracking-[-0.02em]">{fullDay[day]}</h2>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <div className="animate-pulse flex h-24 gap-4 rounded-3xl bg-card/70 p-4 shadow-ios" />
              <div className="animate-pulse flex h-24 gap-4 rounded-3xl bg-card/40 p-4 shadow-ios" />
            </div>
          </section>
        ))}
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

  return (
    <div className="flex flex-col gap-6">
      {weekDays.map((day) => {
        const dayClasses = classes
          .filter((c) => c.days.includes(day))
          .sort((a, b) => minutesOf(a.start) - minutesOf(b.start))

        return (
          <section key={day}>
            <div className="ios-glass sticky top-14 z-10 -mx-5 flex items-baseline gap-2 px-5 py-2 lg:-mx-8 lg:px-8">
              <h2 className="text-[17px] font-bold tracking-[-0.02em]">{fullDay[day]}</h2>
              <span className="text-[13.5px] text-muted-foreground">
                {dayClasses.length === 0
                  ? 'No classes'
                  : `${dayClasses.length} ${dayClasses.length === 1 ? 'class' : 'classes'}`}
              </span>
            </div>

            {dayClasses.length === 0 ? (
              <p className="mt-2 rounded-3xl bg-card px-5 py-6 text-center text-[14.5px] text-muted-foreground shadow-ios">
                Nothing scheduled. Enjoy it.
              </p>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                {dayClasses.map((entry, index) => {
                  const color = subjectColorClass[entry.color]
                  return (
                    <motion.article
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 340,
                        damping: 30,
                        delay: index * 0.03,
                      }}
                      whileTap={{ scale: 0.985 }}
                      className="flex gap-4 rounded-3xl bg-card p-4 shadow-ios"
                    >
                      <div className="w-16 shrink-0 pt-0.5">
                        <p className="text-[14px] font-semibold tracking-[-0.01em] tabular-nums">
                          {formatTime(entry.start).replace(' ', '')}
                        </p>
                        <p className="mt-0.5 text-[12px] text-muted-foreground tabular-nums">
                          {formatTime(entry.end).replace(' ', '')}
                        </p>
                      </div>
                      <span className={`w-[3px] shrink-0 rounded-full ${color.bg}`} />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[16.5px] leading-snug font-semibold tracking-[-0.02em]">
                          {entry.subject}
                        </h3>
                        <p className={`mt-0.5 text-[13px] font-medium ${color.text}`}>
                          {entry.code}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="size-3.5" strokeWidth={1.9} />
                            {entry.room}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <User className="size-3.5" strokeWidth={1.9} />
                            {entry.instructor}
                          </span>
                        </div>
                      </div>
                    </motion.article>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
