'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  Palette,
  Plus,
  Trash2,
  User,
  X,
} from 'lucide-react'
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
import { PillButton } from '@/components/ios/pill-button'
import {
  subjectColorClass,
  weekDays,
  type ClassEntry,
  type SubjectColor,
} from '@/lib/data'

interface ClassEditModalProps {
  open: boolean
  onClose: () => void
  initialData?: ClassEntry | null
  onSave: (classData: ClassEntry) => void
  onDelete?: (id: string) => void
}

const colorOptions: { id: SubjectColor; name: string }[] = [
  { id: 1, name: 'Emerald' },
  { id: 2, name: 'Teal' },
  { id: 3, name: 'Amber' },
  { id: 4, name: 'Indigo' },
  { id: 5, name: 'Rose' },
]

export function ClassEditModal({
  open,
  onClose,
  initialData,
  onSave,
  onDelete,
}: ClassEditModalProps) {
  const isEditing = Boolean(initialData)

  const [subject, setSubject] = React.useState('')
  const [code, setCode] = React.useState('')
  const [instructor, setInstructor] = React.useState('')
  const [room, setRoom] = React.useState('')
  const [days, setDays] = React.useState<string[]>(['Mon'])
  const [start, setStart] = React.useState('08:00')
  const [end, setEnd] = React.useState('09:30')
  const [color, setColor] = React.useState<SubjectColor>(1)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)

  // Populate state whenever modal opens or initialData changes
  React.useEffect(() => {
    if (open) {
      setErrorMsg(null)
      setDeleteConfirmOpen(false)
      if (initialData) {
        setSubject(initialData.subject || '')
        setCode(initialData.code || '')
        setInstructor(initialData.instructor || '')
        setRoom(initialData.room || '')
        setDays(Array.isArray(initialData.days) && initialData.days.length > 0 ? initialData.days : ['Mon'])
        setStart(initialData.start || '08:00')
        setEnd(initialData.end || '09:30')
        setColor(initialData.color || 1)
      } else {
        setSubject('')
        setCode('')
        setInstructor('')
        setRoom('')
        setDays(['Mon'])
        setStart('08:00')
        setEnd('09:30')
        setColor(1)
      }
    }
  }, [open, initialData])

  if (!open) return null

  const toggleDay = (day: string) => {
    setDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort((a, b) => weekDays.indexOf(a) - weekDays.indexOf(b))
    )
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    // Validation
    const cleanSubject = subject.trim()
    const cleanCode = code.trim()

    if (!cleanSubject && !cleanCode) {
      setErrorMsg('Please enter a Subject name or Course code.')
      return
    }

    if (days.length === 0) {
      setErrorMsg('Please select at least one day of the week.')
      return
    }

    if (!start || !end) {
      setErrorMsg('Please specify both Start time and End time.')
      return
    }

    if (start >= end) {
      setErrorMsg('End time must be later than start time.')
      return
    }

    const payload: ClassEntry = {
      id: initialData?.id || `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      subject: cleanSubject || cleanCode,
      code: cleanCode || cleanSubject,
      instructor: instructor.trim() || 'TBA',
      room: room.trim() || 'Room TBA',
      days,
      start,
      end,
      color,
      confidence: 'high',
    }

    onSave(payload)
    onClose()
  }

  const handleDelete = () => {
    if (initialData?.id && onDelete) {
      onDelete(initialData.id)
      setDeleteConfirmOpen(false)
      onClose()
    }
  }

  const activeColorTheme = subjectColorClass[color] || subjectColorClass[1]

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-4xl border border-border bg-card shadow-2xl"
          >
            {/* Top Colored Accent Stripe */}
            <div className={`h-2 w-full ${activeColorTheme.bg}`} />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-separator px-6 py-4">
              <div>
                <h3 className="text-[19px] font-bold tracking-[-0.02em] text-foreground">
                  {isEditing ? 'Edit Class' : 'Add New Class'}
                </h3>
                <p className="text-[13px] text-muted-foreground">
                  {isEditing ? 'Update course schedule details' : 'Add a course to your weekly timetable'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-full bg-fill text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSave} className="max-h-[75vh] overflow-y-auto p-6 space-y-4 no-scrollbar">
              {/* Error Banner */}
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-2xl bg-destructive/10 border border-destructive/20 p-3.5 text-[13.5px] font-semibold text-destructive">
                  <AlertCircle className="size-4.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Course Title & Code */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CpE 413"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="w-full rounded-2xl bg-fill px-4 py-2.5 text-[15px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Embedded Systems"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="w-full rounded-2xl bg-fill px-4 py-2.5 text-[15px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
              </div>

              {/* Time Slots */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                    <Clock className="size-3.5" /> Start Time *
                  </label>
                  <input
                    type="time"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    required
                    className="w-full rounded-2xl bg-fill px-4 py-2.5 text-[15px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                    <Clock className="size-3.5" /> End Time *
                  </label>
                  <input
                    type="time"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    required
                    className="w-full rounded-2xl bg-fill px-4 py-2.5 text-[15px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
              </div>

              {/* Days Selector */}
              <div>
                <label className="mb-2 flex items-center justify-between text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" /> Schedule Days *
                  </span>
                  <span className="text-[11px] font-normal lowercase">
                    {days.length} selected
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {weekDays.map((day) => {
                    const active = days.includes(day)
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`size-10 rounded-2xl text-[13px] font-bold transition-all ${
                          active
                            ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                            : 'bg-fill text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        {day.slice(0, 2)}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Room & Instructor */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                    <MapPin className="size-3.5" /> Room / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RM202(CICS) or Online"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full rounded-2xl bg-fill px-4 py-2.5 text-[14.5px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                    <User className="size-3.5" /> Instructor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. Santos or TBA"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    className="w-full rounded-2xl bg-fill px-4 py-2.5 text-[14.5px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
              </div>

              {/* Color Tag Picker */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                  <Palette className="size-3.5" /> Color Tag
                </label>
                <div className="flex items-center gap-2.5">
                  {colorOptions.map((c) => {
                    const theme = subjectColorClass[c.id]
                    const isSelected = color === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setColor(c.id)}
                        className={`relative flex size-9 items-center justify-center rounded-2xl ${
                          theme.bg
                        } text-white transition-all ${
                          isSelected
                            ? 'ring-3 ring-offset-2 ring-primary scale-110 shadow-md'
                            : 'opacity-70 hover:opacity-100 hover:scale-105'
                        }`}
                      >
                        {isSelected && <span className="size-2 rounded-full bg-white" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-6 flex items-center justify-between border-t border-separator pt-4">
                {isEditing && onDelete ? (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="size-4" />
                    <span>Delete</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <PillButton type="button" variant="secondary" size="md" onClick={onClose}>
                    Cancel
                  </PillButton>
                  <PillButton type="submit" size="md">
                    {isEditing ? 'Save Changes' : 'Add Class'}
                  </PillButton>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[18px] font-bold">
              Remove {code || subject || 'Class'}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[14px]">
              This will remove this class from your weekly schedule and delete any alarms tied to it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
