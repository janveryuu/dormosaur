'use client'

import * as React from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, Download, Palette, Plus, Sparkles } from 'lucide-react'
import { PullAffordance, ScreenHeader } from '@/components/ios/screen-header'
import { SegmentedControl } from '@/components/ios/segmented-control'
import { PillButton } from '@/components/ios/pill-button'
import { WeekGrid } from '@/components/schedule/week-grid'
import { AgendaView } from '@/components/schedule/agenda-view'
import { ExportModal } from '@/components/schedule/export-modal'
import { AddDeadlineModal } from '@/components/schedule/add-deadline-modal'
import { TemplateModal } from '@/components/schedule/templates/template-modal'
import { DeadlineCard } from '@/components/schedule/deadline-card'
import { ClassEditModal } from '@/components/schedule/class-edit-modal'
import { useSchedule } from '@/components/schedule-provider'
import { subjectColorClass } from '@/lib/data'

type View = 'grid' | 'agenda'

export default function SchedulePage() {
  const [view, setView] = React.useState<View>('grid')
  const [exportOpen, setExportOpen] = React.useState(false)
  const [templateOpen, setTemplateOpen] = React.useState(false)
  const [addDeadlineOpen, setAddDeadlineOpen] = React.useState(false)
  const [addClassOpen, setAddClassOpen] = React.useState(false)
  const { classes, deadlines, addClass } = useSchedule()

  const pendingDeadlines = deadlines.filter((d) => !d.completed)

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

      <PullAffordance />
      <ScreenHeader
        title="Schedule"
        eyebrow="Semester Schedule"
        subtitle={
          classes.length === 0
            ? 'No courses scheduled yet. Import your timetable or add classes.'
            : `${classes.length} ${classes.length === 1 ? 'course' : 'courses'}, colour-coded and synced to your alarms.`
        }
        trailing={
          <div className="flex items-center gap-1.5">
            {/* Simple, Modern Templates Icon Button matching top action bar */}
            <button
              onClick={() => setTemplateOpen(true)}
              aria-label="Schedule Templates & Wallpaper Export"
              title="Schedule Templates & Export"
              className="flex size-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 transition-all"
            >
              <Sparkles className="size-4.5" strokeWidth={2.2} />
            </button>

            <button
              onClick={() => setExportOpen(true)}
              aria-label="Export schedule"
              title="Export schedule"
              className="flex size-9 items-center justify-center rounded-full bg-fill text-foreground hover:bg-accent transition-all"
            >
              <Download className="size-4.5" strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={() => setAddClassOpen(true)}
              aria-label="Add a course"
              title="Add course"
              className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:scale-105"
            >
              <Plus className="size-4.5" strokeWidth={2.4} />
            </button>
          </div>
        }
      />

      <div className="flex flex-col gap-6">
        {/* Sleek Modern Spotlight Banner for Templates */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-4 shadow-xs backdrop-blur-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                <Palette className="size-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-extrabold text-foreground tracking-tight">
                    Schedule Wallpapers & Visual Themes
                  </span>
                  <span className="rounded-full bg-emerald-600/20 px-2 py-0.5 text-[9.5px] font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider">
                    7 STYLES
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Turn your weekly timetable into phone/desktop wallpapers or printouts.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTemplateOpen(true)}
              className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 whitespace-nowrap self-start sm:self-auto"
            >
              <Sparkles className="size-4" />
              <span>Choose Theme</span>
            </button>
          </div>
        </div>

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

        {/* Deadlines Section */}
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="text-[13px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
              Exams & Assignment Deadlines ({pendingDeadlines.length})
            </h2>
            <button
              onClick={() => setAddDeadlineOpen(true)}
              className="flex items-center gap-1 text-[13.5px] font-semibold text-primary"
            >
              <Plus className="size-4" /> Add Deadline
            </button>
          </div>

          {deadlines.length > 0 ? (
            <div className="flex flex-col gap-2">
              {deadlines.map((item) => (
                <DeadlineCard key={item.id} deadline={item} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-3xl bg-card p-6 text-center shadow-ios">
              <Calendar className="size-6 text-muted-foreground" />
              <p className="text-[14.5px] font-semibold">No upcoming deadlines</p>
              <PillButton size="sm" variant="secondary" onClick={() => setAddDeadlineOpen(true)}>
                Add Midterm or Assignment
              </PillButton>
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-card p-5 shadow-ios">
          <h2 className="text-[13px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
            Subject colours
          </h2>
          {classes.length > 0 ? (
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
          ) : (
            <p className="mt-2 text-[13.5px] text-muted-foreground">
              No subjects added yet. Import your timetable to enable subject colors.
            </p>
          )}
        </section>
      </div>
    </>
  )
}
