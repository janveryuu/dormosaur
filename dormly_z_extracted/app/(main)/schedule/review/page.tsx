'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CircleCheckBig, TriangleAlert } from 'lucide-react'
import { ScreenHeader } from '@/components/ios/screen-header'
import { PillButton } from '@/components/ios/pill-button'
import { classes, subjectColorClass, weekDays, type ClassEntry } from '@/lib/data'

type Field = 'subject' | 'code' | 'start' | 'end' | 'room' | 'instructor'

export default function ReviewSchedulePage() {
  const router = useRouter()
  const [entries, setEntries] = React.useState<ClassEntry[]>(classes)
  const [confirmed, setConfirmed] = React.useState(false)

  const lowCount = entries.filter((e) => e.confidence === 'low').length

  const update = (id: string, field: Field, value: string) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              [field]: value,
              lowFields: entry.lowFields?.filter((f) => f !== field),
              confidence:
                entry.lowFields?.filter((f) => f !== field).length === 0
                  ? 'high'
                  : entry.confidence,
            }
          : entry,
      ),
    )
  }

  const toggleDay = (id: string, day: string) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              days: entry.days.includes(day)
                ? entry.days.filter((d) => d !== day)
                : [...entry.days, day].sort(
                    (a, b) => weekDays.indexOf(a) - weekDays.indexOf(b),
                  ),
            }
          : entry,
      ),
    )
  }

  const confirm = () => {
    setConfirmed(true)
    setTimeout(() => router.push('/schedule'), 900)
  }

  return (
    <>
      <ScreenHeader
        title="Review & confirm"
        backHref="/schedule/import"
        eyebrow="Step 2 of 2"
        subtitle={
          lowCount > 0
            ? `We found ${entries.length} classes. ${lowCount} need a quick look — tap any field to fix it.`
            : `All ${entries.length} classes look clean. Tap any field to edit.`
        }
      />

      <div className="flex flex-col gap-3 pb-24">
        {entries.map((entry, index) => {
          const color = subjectColorClass[entry.color]
          const isLow = (field: Field) => entry.lowFields?.includes(field)

          return (
            <motion.article
              key={entry.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 330, damping: 30, delay: index * 0.04 }}
              className="rounded-3xl bg-card p-5 shadow-ios"
            >
              <div className="flex items-start gap-3">
                <span className={`mt-1.5 h-8 w-1 shrink-0 rounded-full ${color.bg}`} />
                <div className="min-w-0 flex-1">
                  <EditableField
                    value={entry.subject}
                    onChange={(v) => update(entry.id, 'subject', v)}
                    label="Subject"
                    flagged={isLow('subject')}
                    className="text-[18px] font-semibold tracking-[-0.02em]"
                  />
                  <EditableField
                    value={entry.code}
                    onChange={(v) => update(entry.id, 'code', v)}
                    label="Course code"
                    flagged={isLow('code')}
                    className={`text-[13.5px] font-medium ${color.text}`}
                  />
                </div>
                {entry.confidence === 'low' ? (
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-warn/15 px-2.5 py-1 text-[12px] font-semibold text-warn">
                    <TriangleAlert className="size-3.5" strokeWidth={2.2} />
                    Check
                  </span>
                ) : (
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-subject-5/15 text-subject-5">
                    <CircleCheckBig className="size-3.5" strokeWidth={2.4} />
                  </span>
                )}
              </div>

              <div className="mt-4 grid gap-x-4 gap-y-3 sm:grid-cols-2">
                <FieldRow label="Starts" flagged={isLow('start')}>
                  <input
                    type="time"
                    value={entry.start}
                    onChange={(e) => update(entry.id, 'start', e.target.value)}
                    aria-label={`${entry.code} start time`}
                    className="w-full rounded-xl bg-fill px-3 py-2 text-[15px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </FieldRow>
                <FieldRow label="Ends" flagged={isLow('end')}>
                  <input
                    type="time"
                    value={entry.end}
                    onChange={(e) => update(entry.id, 'end', e.target.value)}
                    aria-label={`${entry.code} end time`}
                    className="w-full rounded-xl bg-fill px-3 py-2 text-[15px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </FieldRow>
                <FieldRow label="Room" flagged={isLow('room')}>
                  <input
                    value={entry.room}
                    onChange={(e) => update(entry.id, 'room', e.target.value)}
                    aria-label={`${entry.code} room`}
                    className="w-full rounded-xl bg-fill px-3 py-2 text-[15px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </FieldRow>
                <FieldRow label="Instructor" flagged={isLow('instructor')}>
                  <input
                    value={entry.instructor}
                    onChange={(e) => update(entry.id, 'instructor', e.target.value)}
                    aria-label={`${entry.code} instructor`}
                    className="w-full rounded-xl bg-fill px-3 py-2 text-[15px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </FieldRow>
              </div>

              <div className="mt-4">
                <p className="mb-2 px-1 text-[11.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                  Days
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {weekDays.map((day) => {
                    const active = entry.days.includes(day)
                    return (
                      <motion.button
                        key={day}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 600, damping: 28 }}
                        onClick={() => toggleDay(entry.id, day)}
                        aria-pressed={active}
                        className={
                          active
                            ? 'size-9 rounded-full bg-primary text-[12.5px] font-semibold text-primary-foreground'
                            : 'size-9 rounded-full bg-fill text-[12.5px] font-medium text-muted-foreground'
                        }
                      >
                        {day.slice(0, 2)}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.article>
          )
        })}
      </div>

      <div className="ios-glass fixed inset-x-0 bottom-0 z-30 border-t border-separator px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+76px)] lg:left-72 lg:pb-4">
        <div className="mx-auto w-full max-w-3xl lg:px-8">
          <PillButton size="lg" full onClick={confirm} disabled={confirmed}>
            {confirmed ? (
              <>
                <CircleCheckBig className="size-4.5" strokeWidth={2.3} />
                Saved
              </>
            ) : (
              `Confirm ${entries.length} classes`
            )}
          </PillButton>
        </div>
      </div>
    </>
  )
}

function FieldRow({
  label,
  flagged,
  children,
}: {
  label: string
  flagged?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 px-1 text-[11.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
        {label}
        {flagged && <span className="size-1.5 rounded-full bg-warn" aria-label="Low confidence" />}
      </span>
      {children}
    </label>
  )
}

function EditableField({
  value,
  onChange,
  label,
  flagged,
  className,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  flagged?: boolean
  className?: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={`w-full rounded-lg bg-transparent outline-none focus-visible:bg-fill focus-visible:px-2 ${className}`}
      />
      {flagged && <span className="size-1.5 shrink-0 rounded-full bg-warn" />}
    </div>
  )
}
