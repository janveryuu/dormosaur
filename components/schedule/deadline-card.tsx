'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Calendar, Check, Clock, FileText, Flag, Trash2 } from 'lucide-react'
import { useSchedule, type DeadlineItem } from '@/components/schedule-provider'
import { subjectColorClass } from '@/lib/data'

function getCountdownText(dueDateStr: string): { label: string; urgent: boolean } {
  const due = new Date(dueDateStr).getTime()
  const now = Date.now()
  const diff = due - now

  if (diff < 0) {
    return { label: 'Overdue', urgent: true }
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  const remHours = hours % 24

  if (days > 0) {
    return { label: `Due in ${days}d ${remHours}h`, urgent: days <= 2 }
  }
  if (hours > 0) {
    return { label: `Due in ${hours}h`, urgent: true }
  }
  return { label: 'Due in less than 1h', urgent: true }
}

import { buttonTapScale, springBouncy, springSmooth } from '@/lib/motion-presets'

export function DeadlineCard({ deadline }: { deadline: DeadlineItem }) {
  const { toggleDeadlineCompleted, deleteDeadline } = useSchedule()
  const { label: countdown, urgent } = getCountdownText(deadline.dueDate)
  const color = subjectColorClass[deadline.color || 1]

  const typeIcon = {
    exam: Flag,
    assignment: FileText,
    project: Calendar,
    quiz: Clock,
    other: FileText,
  }[deadline.type] || FileText

  const Icon = typeIcon

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, height: 0, marginBottom: 0 }}
      transition={springSmooth}
      whileTap={buttonTapScale}
      className="flex items-center gap-3.5 rounded-3xl bg-card p-4 shadow-ios"
    >
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => toggleDeadlineCompleted(deadline.id)}
        aria-label={`Mark ${deadline.title} as ${deadline.completed ? 'incomplete' : 'complete'}`}
        className={`flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
          deadline.completed
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-fill'
        }`}
      >
        {deadline.completed && (
          <motion.span
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={springBouncy}
          >
            <Check className="size-4" strokeWidth={3} />
          </motion.span>
        )}
      </motion.button>

      <span className={`h-9 w-1 shrink-0 rounded-full ${color.bg}`} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`truncate text-[16px] font-semibold tracking-[-0.015em] ${
              deadline.completed ? 'text-muted-foreground line-through' : 'text-foreground'
            }`}
          >
            {deadline.title}
          </span>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.03em] ${color.soft} ${color.text}`}
          >
            {deadline.code}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-3 text-[13px] text-muted-foreground">
          <span className="flex items-center gap-1 font-medium capitalize">
            <Icon className="size-3.5" strokeWidth={2} />
            {deadline.type}
          </span>
          <span
            suppressHydrationWarning
            className={`flex items-center gap-1 font-semibold ${
              deadline.completed
                ? 'text-muted-foreground'
                : urgent
                  ? 'text-destructive'
                  : 'text-primary'
            }`}
          >
            <Clock className="size-3.5" strokeWidth={2} />
            {deadline.completed ? 'Done' : countdown}
          </span>
        </div>
      </div>

      <button
        onClick={() => deleteDeadline(deadline.id)}
        aria-label={`Delete ${deadline.title}`}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-fill hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    </motion.article>
  )
}
