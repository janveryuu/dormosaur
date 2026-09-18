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

      <div className="flex flex-col gap-8 sm:gap-10">
        <section className="schedule-summary" aria-label="Schedule overview">
          <div>
            <p className="route-label">Your planning board</p>
            <h2>Every class, one clear route.</h2>
            <p className="schedule-summary-copy">Keep your week visible, then make room for the parts between.</p>
          </div>
          <div className="schedule-summary-stats">
            <div><strong>{classes.length}</strong><span>{classes.length === 1 ? 'course' : 'courses'}</span></div>
            <div><strong>{pendingDeadlines.length}</strong><span>open deadlines</span></div>
            <div><strong>3</strong><span>views to plan</span></div>
          </div>
        </section>

        {/* Wallpapers Spotlight Strip */}
        <div className="schedule-spotlight">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="schedule-spotlight-icon">
                <Palette className="size-4.5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-bold text-foreground tracking-tight">
                    Schedule Wallpapers & Themes
                  </span>
                  <span className="schedule-spotlight-badge">
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
              className="schedule-spotlight-action"
            >
              <Sparkles className="size-3.5" />
              <span>Choose Theme</span>
            </button>
          </div>
        </div>

        {/* View Segmented Control (Day / Week / Agenda) */}
        <div className="schedule-view-toolbar">
          <div>
            <p className="route-label">Timetable view</p>
            <p className="mt-1 text-xs text-muted-foreground">Choose the level of detail that helps right now.</p>
          </div>
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
        <section className="schedule-section mt-2 flex flex-col gap-3">
          <div className="schedule-section-heading">
            <h2>
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
            <div className="schedule-empty-state">
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
          <section className="schedule-legend">
            <h2 className="route-label">
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
