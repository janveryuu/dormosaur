'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ImageIcon,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { ScreenHeader } from '@/components/ios/screen-header'
import { PillButton } from '@/components/ios/pill-button'
import { useSchedule, type DeadlineItem } from '@/components/schedule-provider'
import { createClient } from '@/lib/supabase/client'
import { setDeadlines } from '@/lib/db'
import type { SubjectColor } from '@/lib/data'
import { cn } from '@/lib/utils'

export default function ReviewDeadlinesPage() {
  const router = useRouter()
  const { classes, deadlines: existingDeadlines, setDeadlines: setContextDeadlines } = useSchedule()
  const [draftItems, setDraftItems] = React.useState<DeadlineItem[]>([])
  const [sourceImage, setSourceImage] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  // Read draft items from sessionStorage on mount
  React.useEffect(() => {
    try {
      const stored = sessionStorage.getItem('dormosaur_parsed_deadlines_draft') || sessionStorage.getItem('dormly_parsed_deadlines_draft')
      const img = sessionStorage.getItem('dormosaur_parsed_deadlines_image') || sessionStorage.getItem('dormly_parsed_deadlines_image')
      if (stored) {
        setDraftItems(JSON.parse(stored))
      } else {
        setDraftItems([])
      }
      if (img) setSourceImage(img)
    } catch (e) {
      console.error('Draft load error:', e)
    }
  }, [classes])

  // Field edit handler
  const updateItem = (id: string, field: keyof DeadlineItem, value: unknown) => {
    setDraftItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  // Delete item handler
  const removeItem = (id: string) => {
    setDraftItems((prev) => prev.filter((item) => item.id !== id))
  }

  // Add manual item handler
  const addManualItem = () => {
    const newItem: DeadlineItem = {
      id: `dl-manual-${Date.now()}`,
      title: 'New Deadline',
      code: classes[0]?.code || 'GEN 101',
      type: 'assignment',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      dueTime: '23:59',
      color: (((draftItems.length + 1) % 5) + 1) as SubjectColor,
      completed: false,
      source: 'manual',
      confidence: 'high',
    }
    setDraftItems((prev) => [...prev, newItem])
  }

  // Confirm and Save handler
  const handleConfirm = async () => {
    setSaving(true)
    try {
      // Combine with existing deadlines
      const merged = [...existingDeadlines, ...draftItems]
      setContextDeadlines(merged)

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await setDeadlines(supabase, user.id, merged)
      }

      sessionStorage.removeItem('dormosaur_parsed_deadlines_draft')
      sessionStorage.removeItem('dormly_parsed_deadlines_draft')
      sessionStorage.removeItem('dormosaur_parsed_deadlines_image')
      sessionStorage.removeItem('dormly_parsed_deadlines_image')

      router.push('/deadlines')
    } catch (err) {
      console.error('Confirm deadlines save error:', err)
      router.push('/deadlines')
    }
  }

  return (
    <>
      <ScreenHeader
        title="Review & confirm"
        backHref="/deadlines/import"
        eyebrow="Step 2 of 2"
        subtitle={`We extracted ${draftItems.length} deadlines. Review course matches, dates, and times before saving.`}
      />

      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 pb-28">

        {/* Source Image Thumbnail Preview (if imported via photo/camera) */}
        {sourceImage && (
          <div className="flex items-center gap-3.5 rounded-3xl bg-card p-4 shadow-ios border border-border/60">
            <img
              src={sourceImage}
              alt="Source photo thumbnail"
              className="size-16 rounded-2xl object-cover border border-border"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-[13px] font-bold text-foreground">
                <ImageIcon className="size-4 text-primary" />
                <span>Source Image Preview</span>
              </div>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Cross-check your parsed deadlines against the original photo if something looks uncertain.
              </p>
            </div>
          </div>
        )}

        {/* Header summary badge */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
            Parsed Deadline Entries ({draftItems.length})
          </h2>
          <button
            onClick={addManualItem}
            className="flex items-center gap-1 text-[13.5px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <Plus className="size-4" /> Add Entry
          </button>
        </div>

        {/* Parsed Items List */}
        <div className="flex flex-col gap-3.5">
          <AnimatePresence>
            {draftItems.map((item, index) => {
              const isLowConf = item.confidence === 'low'
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="relative flex flex-col gap-3.5 rounded-3xl bg-card p-5 shadow-ios border border-border/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Entry #{index + 1}
                        </span>
                        {isLowConf && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-700 dark:text-amber-300">
                            <AlertTriangle className="size-3" /> Low Confidence
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                        placeholder="Deadline title"
                        className="mt-1 w-full bg-transparent text-[17px] font-bold text-foreground outline-none border-b border-border/50 pb-0.5 focus:border-emerald-600"
                      />
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Course Code Dropdown / Selector */}
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Course Code
                      </label>
                      <select
                        value={item.code}
                        onChange={(e) => updateItem(item.id, 'code', e.target.value)}
                        className="w-full rounded-xl border border-border/80 bg-fill px-3 py-2 text-[13.5px] font-semibold text-foreground outline-none focus:border-emerald-600"
                      >
                        {classes.map((c) => (
                          <option key={c.id} value={c.code}>
                            {c.code} — {c.subject}
                          </option>
                        ))}
                        {!classes.some((c) => c.code === item.code) && (
                          <option value={item.code}>{item.code || 'Custom Course'}</option>
                        )}
                      </select>
                    </div>

                    {/* Deadline Type Dropdown */}
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Type
                      </label>
                      <select
                        value={item.type}
                        onChange={(e) => updateItem(item.id, 'type', e.target.value as DeadlineItem['type'])}
                        className="w-full rounded-xl border border-border/80 bg-fill px-3 py-2 text-[13.5px] font-semibold text-foreground outline-none focus:border-emerald-600 uppercase"
                      >
                        <option value="assignment">Assignment</option>
                        <option value="exam">Exam</option>
                        <option value="project">Project</option>
                        <option value="quiz">Quiz</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Due Date Input */}
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={item.dueDate}
                        onChange={(e) => updateItem(item.id, 'dueDate', e.target.value)}
                        className="w-full rounded-xl border border-border/80 bg-fill px-3 py-2 text-[13.5px] font-semibold text-foreground outline-none focus:border-emerald-600"
                      />
                    </div>

                    {/* Due Time Input */}
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Due Time
                      </label>
                      <input
                        type="time"
                        value={item.dueTime || '23:59'}
                        onChange={(e) => updateItem(item.id, 'dueTime', e.target.value)}
                        className="w-full rounded-xl border border-border/80 bg-fill px-3 py-2 text-[13.5px] font-semibold text-foreground outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {draftItems.length === 0 && (
            <div className="p-8 text-center bg-card rounded-3xl border border-dashed border-border/80">
              <p className="text-[14px] text-muted-foreground">No entries remaining.</p>
              <button
                onClick={addManualItem}
                className="mt-3 rounded-full bg-emerald-600 px-5 py-2 text-[13px] font-bold text-white"
              >
                + Add Manual Deadline
              </button>
            </div>
          )}
        </div>

        {/* Sticky Confirm Button */}
        <div className="fixed inset-x-0 bottom-0 z-40 bg-background/80 backdrop-blur-md p-4 border-t border-border">
          <div className="mx-auto max-w-xl">
            <PillButton
              size="lg"
              full
              onClick={handleConfirm}
              disabled={saving || draftItems.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[16px] py-4 shadow-ios-lg"
            >
              {saving ? (
                'Saving Deadlines to Cloud…'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Check className="size-5" strokeWidth={2.5} />
                  <span>Confirm & Save {draftItems.length} Deadlines</span>
                </span>
              )}
            </PillButton>
          </div>
        </div>
      </div>
    </>
  )
}
