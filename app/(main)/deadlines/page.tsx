'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarCheck,
  CheckSquare,
  Clock,
  Plus,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import { ScreenHeader } from '@/components/ios/screen-header'
import { SegmentedControl } from '@/components/ios/segmented-control'
import { AddDeadlineModal } from '@/components/schedule/add-deadline-modal'
import { DeadlineCard } from '@/components/schedule/deadline-card'
import { DormosaurMascot } from '@/components/brand/dormosaur-mascot'
import { useSchedule } from '@/components/schedule-provider'

type FilterStatus = 'pending' | 'completed' | 'all'

export default function DeadlinesPage() {
  const { deadlines } = useSchedule()
  const [filter, setFilter] = React.useState<FilterStatus>('pending')
  const [addModalOpen, setAddModalOpen] = React.useState(false)

  const pendingCount = deadlines.filter((d) => !d.completed).length
  const completedCount = deadlines.filter((d) => d.completed).length
  const dueSoonCount = deadlines.filter((d) => {
    if (d.completed) return false
    const due = new Date(d.dueDate).getTime()
    return due >= Date.now() && due - Date.now() <= 48 * 60 * 60 * 1000
  }).length

  const filteredDeadlines = deadlines.filter((d) => {
    if (filter === 'pending') return !d.completed
    if (filter === 'completed') return d.completed
    return true
  })

  return (
    <>
      <AddDeadlineModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />

      <ScreenHeader
        title="Deadlines"
        eyebrow="Assignments & Exams"
        subtitle={`${pendingCount} ${
          pendingCount === 1 ? 'deadline' : 'deadlines'
        } remaining this term.`}
        trailing={
          <div className="flex items-center gap-2">
            <Link
              href="/deadlines/import"
              className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 transition-transform active:scale-95 shadow-2xs"
            >
              <UploadCloud className="size-3.5" strokeWidth={2.2} />
              <span>Import</span>
            </Link>

            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer"
              title="Add deadline"
            >
              <Plus className="size-4.5" strokeWidth={2.4} />
            </button>
          </div>
        }
      />

      <div className="flex flex-col gap-8 pb-12 sm:gap-10">
        <section className="task-summary" aria-label="Deadline overview">
          <div>
            <p className="route-label">Your due board</p>
            <h2>Make room for what’s next.</h2>
            <p className="task-summary-copy">Keep the important dates visible without letting them take over your day.</p>
          </div>
          <div className="task-summary-stats">
            <div><strong>{pendingCount}</strong><span>to do</span></div>
            <div><strong>{dueSoonCount}</strong><span>due soon</span></div>
            <div><strong>{completedCount}</strong><span>finished</span></div>
          </div>
        </section>

        {/* ── Compact Syllabus Scanner Action Strip ── */}
        <div className="task-scanner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="task-scanner-icon">
                <CheckSquare className="size-4.5" strokeWidth={2.2} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-bold text-foreground tracking-tight">
                    Syllabus Camera & File Import
                  </span>
                  <span className="task-scanner-badge">
                    AI Vision
                  </span>
                </div>
                <p className="text-[11.5px] text-muted-foreground mt-0.5">
                  Snap a photo of your syllabus or paste dates to extract deadlines.
                </p>
              </div>
            </div>

            <Link
              href="/deadlines/import"
              className="task-scanner-action"
            >
              <Sparkles className="size-3.5" />
              <span>Import Deadlines</span>
            </Link>
          </div>
        </div>

        {/* ── Filter Segmented Controls ── */}
        <div className="task-view-toolbar">
          <div>
            <p className="route-label">Deadline view</p>
            <p className="mt-1 text-xs text-muted-foreground">Track the work that still needs your attention.</p>
          </div>
          <SegmentedControl
            value={filter}
            onChange={(v) => setFilter(v as FilterStatus)}
            options={[
              { value: 'pending', label: `Upcoming (${pendingCount})` },
              { value: 'completed', label: `Done (${completedCount})` },
              { value: 'all', label: `All (${deadlines.length})` },
            ]}
            layoutId="deadlines-filter"
            className="w-full sm:max-w-md"
          />
        </div>

        {/* ── Deadlines List ── */}
        {filteredDeadlines.length > 0 ? (
          <div className="task-list">
            <AnimatePresence mode="popLayout">
              {filteredDeadlines.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                >
                  <DeadlineCard deadline={item} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="schedule-empty-state gap-3 py-16 px-4">
            <DormosaurMascot
              variant="youGotThis"
              alt="Dormosaur celebrating that you are all caught up"
              width={128}
              height={128}
              className="size-28 sm:size-36 object-contain drop-shadow-md select-none"
            />
            <div>
              <h3 className="text-base font-bold text-foreground">
                {filter === 'completed' ? 'No completed deadlines' : 'No upcoming deadlines'}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs leading-relaxed">
                {filter === 'completed'
                  ? 'Check off tasks as you finish them.'
                  : 'Add assignments, quizzes, and exams from your syllabus.'}
              </p>
            </div>
            {filter !== 'completed' && (
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="mt-1 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-2xs hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Add Deadline</span>
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
