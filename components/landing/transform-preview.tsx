'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { classes, formatTime, subjectColorClass } from '@/lib/data'

const messyLines = [
  'MATH101 calculus 1 MWF 8:30-9:50am sci hall 204 reyes',
  'chem 120 general chem lab, mon/wed 10:15 to 12, lab b12',
  'ENG205 modern lit TTh 9-10:20 humanities 310 (tanaka)',
  'cs150 intro programming tues thurs 1pm-2:40pm tech 118',
  'psy 110 mon fri 3:00-4:20 west wing 22 dr patel',
]

export function TransformPreview() {
  const organized = classes.slice(0, 5)

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className="rounded-3xl bg-card p-5 shadow-ios"
      >
        <p className="mb-3 text-[12px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          What you paste
        </p>
        <div className="flex flex-col gap-2">
          {messyLines.map((line) => (
            <p
              key={line}
              className="truncate font-mono text-[12px] leading-relaxed text-muted-foreground"
            >
              {line}
            </p>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.15 }}
        className="mx-auto flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_var(--primary)]"
      >
        <ArrowRight className="size-5 rotate-90 sm:rotate-0" strokeWidth={2.2} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: 'spring', stiffness: 260, damping: 30, delay: 0.25 }}
        className="rounded-3xl bg-card p-5 shadow-ios-lg"
      >
        <p className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.06em] text-primary uppercase">
          <Sparkles className="size-3.5" strokeWidth={2.2} />
          What you get
        </p>
        <div className="flex flex-col gap-2">
          {organized.map((entry) => {
            const color = subjectColorClass[entry.color]
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 rounded-2xl ${color.soft} px-3 py-2`}
              >
                <span className={`h-7 w-1 shrink-0 rounded-full ${color.bg}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold tracking-[-0.01em]">
                    {entry.subject}
                  </span>
                  <span className="block truncate text-[11.5px] text-muted-foreground">
                    {entry.days.join(' · ')} · {entry.room}
                  </span>
                </span>
                <span className="shrink-0 text-[11.5px] font-medium text-muted-foreground">
                  {formatTime(entry.start)}
                </span>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
