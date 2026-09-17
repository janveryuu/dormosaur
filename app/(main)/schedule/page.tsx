'use client'

import * as React from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, Download, Palette, Plus, Sparkles } from 'lucide-react'
import { ScreenHeader } from '@/components/ios/screen-header'
import { SegmentedControl } from '@/components/ios/segmented-control'
import { PillButton } from '@/components/ios/pill-button'
import { DayView } from '@/components/schedule/day-view'
import { WeekGrid } from '@/components/schedule/week-grid'
import { AgendaView } from '@/components/schedule/agenda-view'
import { ExportModal } from '@/components/schedule/export-modal'
import { AddDeadlineModal } from '@/components/schedule/add-deadline-modal'
import { TemplateModal } from '@/components/schedule/templates/template-modal'
import { DeadlineCard } from '@/components/schedule/deadline-card'
import { ClassEditModal } from '@/components/schedule/class-edit-modal'
import { useSchedule } from '@/components/schedule-provider'
import { subjectColorClass } from '@/lib/data'

type View = 'day' | 'grid' | 'agenda'

export default function SchedulePage() {
  const [view, setView] = React.useState<View>('day')
  const [exportOpen, setExportOpen] = React.useState(false)
  const [templateOpen, setTemplateOpen] = React.useState(false)
  const [addDeadlineOpen, setAddDeadlineOpen] = React.useState(false)
  const [addClassOpen, setAddClassOpen] = React.useState(false)
  const { classes, deadlines, addClass } = useSchedule()

  const pendingDeadlines = deadlines.filter((d) => !d.completed)

  // On larger desktop screens, default to full week grid
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setView('grid')
    }
  }, [])

  return (
    <>
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
      <TemplateModal open={templateOpen} onClose={() => setTemplateOpen(false)} />
      <AddDeadlineModal open={addDeadlineOpen} onClose={() => setAddDeadlineOpen(false)} />
      <ClassEditModal
        open={addClassOpen}
        onClose={() => setAddClassOpen(false)}
        onSave={(classData) => addClass(classData)}
      />

      <ScreenHeader
        title="Schedule"
        eyebrow="Semester Timetable"
        subtitle={
          classes.length === 0
            ? 'No courses scheduled yet. Import your timetable or add classes.'
            : `${classes.length} ${
                classes.length === 1 ? 'course' : 'courses'
              } synced with your alarms and dorm meals.`
        }
        trailing={
          <div className="flex items-center gap-1.5">
            <motion.button
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 500, damping: 26 }}
              onClick={() => setTemplateOpen(true)}
              aria-label="Schedule Wallpapers & Visual Themes"
              title="Schedule Wallpapers & Themes"
              className="flex size-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 cursor-pointer shadow-2xs"
            >
              <Sparkles className="size-4" strokeWidth={2.2} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 500, damping: 26 }}
              onClick={() => setExportOpen(true)}
              aria-label="Export schedule"
              title="Export schedule"
              className="flex size-9 items-center justify-center rounded-full bg-fill text-foreground hover:bg-accent cursor-pointer shadow-2xs"
            >
              <Download className="size-4" strokeWidth={2} />
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 500, damping: 26 }}
              onClick={() => setAddClassOpen(true)}
              aria-label="Add a course"
              title="Add course"
              className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xs cursor-pointer"
            >
              <Plus className="size-4.5" strokeWidth={2.4} />
            </motion.button>
          </div>
        }
      />

      <div className="flex flex-col gap-5">
        {/* Wallpapers Spotlight Strip */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-2xs">
                <Palette className="size-4.5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-bold text-foreground tracking-tight">
                    Schedule Wallpapers & Themes
                  </span>
                  <span className="rounded-full bg-emerald-600/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-800 dark:text-emerald-300">
                    7 STYLES
                  </span>
                </div>
                <p className="text-[11.5px] text-muted-foreground mt-0.5">
                  Export your timetable as a phone lockscreen or PDF.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTemplateOpen(true)}
              className="flex h-8 sm:h-9 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 whitespace-nowrap self-start sm:self-auto cursor-pointer transition-transform active:scale-95"
            >
              <Sparkles className="size-3.5" />
              <span>Choose Theme</span>
            </button>
          </div>
        </div>

        {/* View Segmented Control (Day / Week / Agenda) */}
        <div className="flex items-center justify-between">
          <SegmentedControl
            value={view}
            onChange={(v) => setView(v as View)}
            options={[
              { value: 'day', label: 'Day' },
              { value: 'grid', label: 'Week' },
              { value: 'agenda', label: 'Agenda' },
            ]}
            layoutId="schedule-view-mode"
            className="w-full sm:max-w-xs"
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            {view === 'day' ? (
              <DayView />
            ) : view === 'grid' ? (
              <WeekGrid />
            ) : (
              <AgendaView />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Deadlines Section */}
        <section className="mt-2 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Exams & Assignment Deadlines ({pendingDeadlines.length})
            </h2>
            <button
              type="button"
              onClick={() => setAddDeadlineOpen(true)}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Plus className="size-3.5" /> Add Deadline
            </button>
          </div>

          {deadlines.length > 0 ? (
            <div className="flex flex-col gap-2">
              {deadlines.slice(0, 4).map((item) => (
                <DeadlineCard key={item.id} deadline={item} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-3xl bg-card p-6 text-center shadow-ios border border-border/60">
              <Calendar className="size-6 text-muted-foreground" />
              <p className="text-[14px] font-semibold text-foreground">No upcoming deadlines</p>
              <PillButton size="sm" variant="secondary" onClick={() => setAddDeadlineOpen(true)}>
                Add Midterm or Assignment
              </PillButton>
            </div>
          )}
        </section>

        {/* Subject Colors Legend */}
        {classes.length > 0 && (
          <section className="rounded-3xl bg-card p-4 sm:p-5 shadow-ios border border-border/60">
            <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Subject Colors
            </h2>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              {classes.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-2 rounded-lg bg-fill/60 px-2.5 py-1 text-xs font-medium text-foreground"
                >
                  <span
                    className={`size-2 rounded-full ${subjectColorClass[entry.color].bg}`}
                    aria-hidden="true"
                  />
                  <span>{entry.code}</span>
                  <span className="text-muted-foreground truncate max-w-[120px]">
                    · {entry.subject}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  )
}
