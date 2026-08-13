'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Wand2, CornerDownLeft, Activity } from 'lucide-react'
import { useSchedule } from '@/components/schedule-provider'
import { AiEditConfirmModal, type ScheduleEditDiff } from './ai-edit-confirm-modal'

const quickEditPrompts = [
  { label: 'Move Chem to 3pm', prompt: 'Move General Chemistry Lab start time to 3:00 PM' },
  { label: 'Change Calculus Room', prompt: 'Change Calculus room to Sci Hall 210' },
  { label: 'Delete Friday Elective', prompt: 'Delete Psychology 101 from my schedule' },
]

export function AiEditBar() {
  const { classes, updateClass, deleteClass, addClasses } = useSchedule()
  const [prompt, setPrompt] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [diff, setDiff] = React.useState<ScheduleEditDiff | null>(null)
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null)

  const handleParseEdit = async (customPrompt?: string) => {
    const text = (customPrompt || prompt).trim()
    if (!text || loading) return

    setLoading(true)
    setStatusMessage(null)

    try {
      const res = await fetch('/api/schedule/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, classes }),
      })

      const data = await res.json()
      if (data.error) {
        setStatusMessage('Could not understand edit instruction. Try rephrasing!')
      } else {
        setDiff(data as ScheduleEditDiff)
        if (!customPrompt) setPrompt('')
      }
    } catch (err) {
      console.warn('AI edit notice:', err)
      setStatusMessage('Error parsing edit request.')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyConfirm = () => {
    if (!diff) return

    if (diff.action === 'delete') {
      deleteClass(diff.targetClassId)
      setStatusMessage(`Deleted ${diff.targetSubject} from schedule.`)
    } else if (diff.action === 'update') {
      if (diff.fieldChanged === 'room') {
        updateClass(diff.targetClassId, { room: diff.newValue })
      } else if (diff.fieldChanged === 'start') {
        updateClass(diff.targetClassId, { start: diff.newValue })
      } else if (diff.updatedClass) {
        updateClass(diff.targetClassId, diff.updatedClass)
      }
      setStatusMessage(`Updated ${diff.targetSubject}!`)
    } else if (diff.action === 'add' && diff.updatedClass) {
      addClasses([...classes, diff.updatedClass])
      setStatusMessage(`Added ${diff.targetSubject}!`)
    }

    setDiff(null)
    setTimeout(() => setStatusMessage(null), 3000)
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-2.5 rounded-3xl border border-border/70 bg-card p-4 shadow-ios">
        {/* Header Label */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="size-3.5" />
            </div>
            <span className="text-[12.5px] font-bold tracking-wide uppercase text-muted-foreground">
              Natural-Language Schedule Editor
            </span>
          </div>
          <span className="text-[11.5px] font-medium text-primary">Powered by Llama 3</span>
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleParseEdit()
          }}
          className="relative flex items-center rounded-2xl border border-border bg-fill px-3.5 py-2 transition-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring"
        >
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            placeholder='e.g. "Move Chem lab to 3pm" or "Change Calculus room to Sci Hall 210"'
            className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground/60 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || loading}
            className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform active:scale-90 disabled:opacity-40"
          >
            {loading ? <Activity className="size-4 animate-spin" /> : <CornerDownLeft className="size-4" />}
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
          <span className="text-[11px] font-semibold uppercase text-muted-foreground shrink-0">Try:</span>
          {quickEditPrompts.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={loading}
              onClick={() => handleParseEdit(item.prompt)}
              className="shrink-0 rounded-full border border-border bg-fill px-3 py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground active:scale-95 disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Status Alert Banner */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-1 rounded-xl bg-primary/10 px-3.5 py-2 text-[12.5px] font-medium text-primary"
            >
              ✨ {statusMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal */}
      <AiEditConfirmModal
        diff={diff}
        onConfirm={handleApplyConfirm}
        onCancel={() => setDiff(null)}
      />
    </>
  )
}
