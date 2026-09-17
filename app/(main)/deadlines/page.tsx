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
import { useSchedule } from '@/components/schedule-provider'

type FilterStatus = 'pending' | 'completed' | 'all'

export default function DeadlinesPage() {
  const { deadlines } = useSchedule()
  const [filter, setFilter] = React.useState<FilterStatus>('pending')
  const [addModalOpen, setAddModalOpen] = React.useState(false)

  const pendingCount = deadlines.filter((d) => !d.completed).length
  const completedCount = deadlines.filter((d) => d.completed).length

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

      <div className="flex flex-col gap-5 pb-12">
        {/* ── Compact Syllabus Scanner Action Strip ── */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-2xs">
                <CheckSquare className="size-4.5" strokeWidth={2.2} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-bold text-foreground tracking-tight">
                    Syllabus Camera & File Import
                  </span>
                  <span className="rounded-full bg-emerald-600/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-800 dark:text-emerald-300">
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
              className="flex h-8 sm:h-9 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 whitespace-nowrap self-start sm:self-auto cursor-pointer transition-transform active:scale-95"
            >
              <Sparkles className="size-3.5" />
              <span>Import Deadlines</span>
            </Link>
          </div>
        </div>

        {/* ── Filter Segmented Controls ── */}
        <div className="flex items-center justify-between">
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
          <div className="flex flex-col gap-2.5">
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
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/80 bg-card/60 py-16 px-4 text-center shadow-2xs">
            <img
              src="/student-dormosaur.png"
              alt="Dormosaur all caught up"
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
