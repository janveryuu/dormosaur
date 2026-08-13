'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Plus, X } from 'lucide-react'
import { PillButton } from '@/components/ios/pill-button'
import { useSchedule, type DeadlineItem } from '@/components/schedule-provider'
import { type SubjectColor } from '@/lib/data'

export function AddDeadlineModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { classes, addDeadline } = useSchedule()
  const [title, setTitle] = React.useState('')
  const [code, setCode] = React.useState(classes[0]?.code || 'MATH 101')
  const [type, setType] = React.useState<DeadlineItem['type']>('exam')
  const [dueDate, setDueDate] = React.useState(
    new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const matchedClass = classes.find((c) => c.code === code)
    const color: SubjectColor = matchedClass ? matchedClass.color : 1

    addDeadline({
      title: title.trim(),
      code,
      type,
      dueDate,
      color,
    })

    setTitle('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="ios-glass relative z-10 w-full max-w-md overflow-hidden rounded-4xl border border-border p-6 shadow-ios-lg"
          >
            <div className="flex items-center justify-between border-b border-separator pb-3">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Calendar className="size-4" />
                </span>
                <h3 className="text-[18px] font-bold tracking-[-0.02em]">Add Deadline</h3>
              </div>
              <button
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-full bg-fill text-muted-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="px-1 text-[12px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                  Title
                </span>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midterm 1, Final Essay"
                  className="rounded-2xl bg-fill px-4 py-3 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="px-1 text-[12px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                    Course Code
                  </span>
                  <select
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="rounded-2xl bg-fill px-3 py-3 text-[14.5px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="px-1 text-[12px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                    Type
                  </span>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as DeadlineItem['type'])}
                    className="rounded-2xl bg-fill px-3 py-3 text-[14.5px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment</option>
                    <option value="project">Project</option>
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="px-1 text-[12px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                  Due Date & Time
                </span>
                <input
                  type="datetime-local"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="rounded-2xl bg-fill px-4 py-3 text-[14.5px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>

              <PillButton type="submit" size="lg" full className="mt-2">
                <Plus className="size-4.5" /> Save Deadline
              </PillButton>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
