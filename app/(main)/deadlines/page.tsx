'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Filter,
  Plus,
  Sparkles,
  Trash2,
  UploadCloud,
  CheckSquare,
  AlertTriangle,
} from 'lucide-react'
import { PullAffordance, ScreenHeader } from '@/components/ios/screen-header'
import { SegmentedControl } from '@/components/ios/segmented-control'
import { AddDeadlineModal } from '@/components/schedule/add-deadline-modal'
import { DeadlineCard } from '@/components/schedule/deadline-card'
import { useSchedule } from '@/components/schedule-provider'
import { PillButton } from '@/components/ios/pill-button'
import { cn } from '@/lib/utils'

type FilterStatus = 'all' | 'pending' | 'completed'

export default function DeadlinesPage() {
  const { deadlines, toggleDeadlineCompleted, deleteDeadline } = useSchedule()
  const [filter, setFilter] = React.useState<FilterStatus>('pending')
  const [addModalOpen, setAddModalOpen] = React.useState(false)

  const filteredDeadlines = deadlines.filter((d) => {
    if (filter === 'pending') return !d.completed
    if (filter === 'completed') return d.completed
    return true
  })

  const pendingCount = deadlines.filter((d) => !d.completed).length

  return (
    <>
      <AddDeadlineModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />

      <PullAffordance />
      <ScreenHeader
        title="Deadlines"
        eyebrow="Assignments & Exams"
        subtitle={`${pendingCount} upcoming ${pendingCount === 1 ? 'deadline' : 'deadlines'} remaining.`}
        trailing={
          <div className="flex items-center gap-2">
            <Link
              href="/deadlines/import"
              className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 py-1.5 text-[13px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 transition-all shadow-xs"
            >
              <UploadCloud className="size-4" strokeWidth={2.2} />
              <span>Import Deadlines</span>
            </Link>

            <button
              onClick={() => setAddModalOpen(true)}
              className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:scale-105 shadow-ios"
              title="Add deadline manually"
            >
              <Plus className="size-4.5" strokeWidth={2.4} />
            </button>
          </div>
        }
      />

      <div className="flex flex-col gap-6 pb-12">
        {/* ─── Hero Feature Banner ───────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-5 shadow-xs backdrop-blur-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                <CheckSquare className="size-5.5" strokeWidth={2.2} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-extrabold text-foreground tracking-tight">
                    Dormosaur's Deadline Import
                  </span>
                  <span className="rounded-full bg-emerald-600/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider">
                    TEXT · CAMERA · PHOTOS
                  </span>
                </div>
                <p className="text-[12.5px] text-muted-foreground mt-0.5">
                  Snap a photo of your syllabus or paste raw assignment notes to convert them automatically.
                </p>
              </div>
            </div>

            <Link
              href="/deadlines/import"
              className="flex h-10 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 text-[13.5px] font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 whitespace-nowrap self-start sm:self-auto"
            >
              <Sparkles className="size-4" />
              <span>Import Deadlines</span>
            </Link>
          </div>
        </div>

        {/* ─── Filter Controls ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <SegmentedControl
            value={filter}
            onChange={(v) => setFilter(v as FilterStatus)}
            options={[
              { value: 'pending', label: `Upcoming (${deadlines.filter((d) => !d.completed).length})` },
              { value: 'completed', label: `Completed (${deadlines.filter((d) => d.completed).length})` },
              { value: 'all', label: `All (${deadlines.length})` },
            ]}
            layoutId="deadlines-filter"
            className="max-w-md"
          />
        </div>

        {/* ─── Deadlines List ───────────────────────────────────────────────── */}
        {filteredDeadlines.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            <AnimatePresence mode="popLayout">
              {filteredDeadlines.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
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
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/80 bg-card/60 py-16 text-center shadow-xs">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CalendarCheck className="size-7" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-foreground">
                {deadlines.length === 0 ? 'No deadlines yet' : 'No matching deadlines'}
              </h3>
              <p className="text-[13.5px] text-muted-foreground mt-1 max-w-sm">
                {deadlines.length === 0
                  ? 'Import your syllabus or add one manually to get started.'
                  : filter === 'pending'
                  ? 'You have completed all your upcoming exams and assignments!'
                  : 'No completed deadlines recorded yet.'}
              </p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Link
                href="/deadlines/import"
                className="rounded-full bg-emerald-600 px-5 py-2 text-[13.5px] font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                Import Deadlines
              </Link>
              <button
                onClick={() => setAddModalOpen(true)}
                className="rounded-full bg-muted px-4 py-2 text-[13.5px] font-semibold text-foreground hover:bg-accent"
              >
                + Add Manually
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
