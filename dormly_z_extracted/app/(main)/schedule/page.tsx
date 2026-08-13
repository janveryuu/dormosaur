'use client'

import * as React from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { PullAffordance, ScreenHeader } from '@/components/ios/screen-header'
import { SegmentedControl } from '@/components/ios/segmented-control'
import { WeekGrid } from '@/components/schedule/week-grid'
import { AgendaView } from '@/components/schedule/agenda-view'
import { classes, subjectColorClass } from '@/lib/data'

type View = 'grid' | 'agenda'

export default function SchedulePage() {
  const [view, setView] = React.useState<View>('grid')

  return (
    <>
      <PullAffordance />
      <ScreenHeader
        title="Schedule"
        eyebrow="Fall semester"
        subtitle="Six courses, colour-coded and synced to your alarms."
        trailing={
          <Link
            href="/schedule/import"
            aria-label="Import a schedule"
            className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <Plus className="size-4.5" strokeWidth={2.4} />
          </Link>
        }
      />

      <div className="flex flex-col gap-5">
        <SegmentedControl
          value={view}
          onChange={(v) => setView(v as View)}
          options={[
            { value: 'grid', label: 'Grid' },
            { value: 'agenda', label: 'Agenda' },
          ]}
          layoutId="schedule-view"
          className="max-w-xs"
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          >
            {view === 'grid' ? <WeekGrid /> : <AgendaView />}
          </motion.div>
        </AnimatePresence>

        <section className="rounded-3xl bg-card p-5 shadow-ios">
          <h2 className="text-[13px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
            Subject colours
          </h2>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2.5">
            {classes.map((entry) => (
              <li key={entry.id} className="flex items-center gap-2 text-[13.5px] font-medium">
                <span
                  className={`size-2.5 rounded-full ${subjectColorClass[entry.color].bg}`}
                  aria-hidden="true"
                />
                {entry.code}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
