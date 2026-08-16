'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Calendar,
  Edit2,
  MapPin,
  Plus,
  Trash2,
  UploadCloud,
  User,
} from 'lucide-react'
import { useSchedule } from '@/components/schedule-provider'
import { formatTime, minutesOf, subjectColorClass, weekDays, type ClassEntry } from '@/lib/data'
import { ClassEditModal } from '@/components/schedule/class-edit-modal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const fullDay: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
}

export function AgendaView() {
  const { classes, isHydrated, isSyncing, addClass, updateClass, deleteClass } = useSchedule()
  const [modalOpen, setModalOpen] = React.useState(false)
  const [selectedClass, setSelectedClass] = React.useState<ClassEntry | null>(null)
  const [quickDeleteClass, setQuickDeleteClass] = React.useState<ClassEntry | null>(null)

  const isLoading = !isHydrated || isSyncing

  const handleOpenAdd = () => {
    setSelectedClass(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (cls: ClassEntry) => {
    setSelectedClass(cls)
    setModalOpen(true)
  }

  const handleSaveClass = (classData: ClassEntry) => {
    if (selectedClass) {
      updateClass(selectedClass.id, classData)
    } else {
      addClass(classData)
    }
  }

  const handleConfirmQuickDelete = () => {
    if (quickDeleteClass) {
      deleteClass(quickDeleteClass.id)
      setQuickDeleteClass(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {['Mon', 'Wed', 'Fri'].map((day) => (
          <section key={day}>
            <div className="ios-glass sticky top-14 z-10 -mx-5 flex items-baseline gap-2 px-5 py-2 lg:-mx-8 lg:px-8">
              <h2 className="text-[17px] font-bold tracking-[-0.02em]">{fullDay[day]}</h2>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <div className="animate-pulse flex h-24 gap-4 rounded-3xl bg-card/70 p-4 shadow-ios" />
              <div className="animate-pulse flex h-24 gap-4 rounded-3xl bg-card/40 p-4 shadow-ios" />
            </div>
          </section>
        ))}
      </div>
    )
  }

  if (classes.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center gap-3.5 rounded-3xl border border-dashed border-border/80 bg-card/60 py-16 text-center shadow-xs">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Calendar className="size-7" />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-foreground">No classes yet</h3>
            <p className="text-[13.5px] text-muted-foreground mt-1 max-w-sm">
              No classes yet — add a course manually or import your schedule.
            </p>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-bold text-primary-foreground shadow-sm transition-all hover:scale-105"
            >
              <Plus className="size-4" strokeWidth={2.4} />
              <span>Add Class</span>
            </button>

            <Link
              href="/schedule/import"
              className="flex items-center gap-2 rounded-full bg-fill px-5 py-2.5 text-[13.5px] font-bold text-foreground hover:bg-accent transition-all"
            >
              <UploadCloud className="size-4" />
              <span>Import Timetable</span>
            </Link>
          </div>
        </div>

        <ClassEditModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          initialData={selectedClass}
          onSave={handleSaveClass}
          onDelete={deleteClass}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Agenda Top Action Bar */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[13px] font-bold tracking-wider text-muted-foreground uppercase">
            {classes.length} Total Course{classes.length === 1 ? '' : 's'}
          </span>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3.5 py-1.5 text-[13px] font-bold text-primary hover:bg-primary/25 transition-colors active:scale-95"
          >
            <Plus className="size-3.5" strokeWidth={2.4} />
            <span>Add Class</span>
          </button>
        </div>

        {/* Day-by-Day Agenda List */}
        {weekDays.map((day) => {
          const dayClasses = classes
            .filter((c) => c.days.includes(day))
            .sort((a, b) => minutesOf(a.start) - minutesOf(b.start))

          return (
            <section key={day}>
              <div className="ios-glass sticky top-14 z-10 -mx-5 flex items-baseline justify-between px-5 py-2 lg:-mx-8 lg:px-8">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-[17px] font-bold tracking-[-0.02em]">{fullDay[day]}</h2>
                  <span className="text-[13.5px] text-muted-foreground">
                    {dayClasses.length === 0
                      ? 'No classes'
                      : `${dayClasses.length} ${dayClasses.length === 1 ? 'class' : 'classes'}`}
                  </span>
                </div>
              </div>

              {dayClasses.length === 0 ? (
                <p className="mt-2 rounded-3xl bg-card px-5 py-6 text-center text-[14.5px] text-muted-foreground shadow-ios">
                  Nothing scheduled. Enjoy it.
                </p>
              ) : (
                <div className="mt-2 flex flex-col gap-2">
                  {dayClasses.map((entry, index) => {
                    const color = subjectColorClass[entry.color] || subjectColorClass[1]
                    return (
                      <motion.article
                        key={`${day}-${entry.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 340,
                          damping: 30,
                          delay: index * 0.03,
                        }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => handleOpenEdit(entry)}
                        className="group relative flex gap-4 rounded-3xl bg-card p-4 shadow-ios border border-border/40 hover:border-primary/40 transition-all cursor-pointer"
                      >
                        {/* Time Column */}
                        <div className="w-16 shrink-0 pt-0.5">
                          <p className="text-[14px] font-semibold tracking-[-0.01em] tabular-nums">
                            {formatTime(entry.start).replace(' ', '')}
                          </p>
                          <p className="mt-0.5 text-[12px] text-muted-foreground tabular-nums">
                            {formatTime(entry.end).replace(' ', '')}
                          </p>
                        </div>

                        {/* Color Tag Pill */}
                        <span className={`w-[3.5px] shrink-0 rounded-full ${color.bg}`} />

                        {/* Course Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-[16.5px] leading-snug font-bold tracking-[-0.02em] text-foreground">
                              {entry.subject}
                            </h3>

                            {/* Hover Edit / Delete Action Icons */}
                            <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenEdit(entry)
                                }}
                                title="Edit class"
                                className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-fill hover:text-foreground transition-colors"
                              >
                                <Edit2 className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setQuickDeleteClass(entry)
                                }}
                                title="Remove class"
                                className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-fill hover:text-destructive transition-colors"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className={`mt-0.5 text-[13px] font-semibold ${color.text}`}>
                            {entry.code}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="size-3.5" strokeWidth={1.9} />
                              {entry.room || 'Online'}
                            </span>
                            {entry.instructor && entry.instructor !== 'TBA' && (
                              <span className="flex items-center gap-1.5">
                                <User className="size-3.5" strokeWidth={1.9} />
                                {entry.instructor}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.article>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}
      </div>

      {/* Edit / Add Modal */}
      <ClassEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={selectedClass}
        onSave={handleSaveClass}
        onDelete={deleteClass}
      />

      {/* Quick Delete Alert Dialog */}
      <AlertDialog
        open={Boolean(quickDeleteClass)}
        onOpenChange={(open) => !open && setQuickDeleteClass(null)}
      >
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[18px] font-bold">
              Remove {quickDeleteClass?.code || quickDeleteClass?.subject || 'Class'}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[14px]">
              This will remove this class from your weekly schedule and remove any alarms tied to it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmQuickDelete}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Class
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
