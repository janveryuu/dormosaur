'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, AlertTriangle, Trash2, Sparkles, X, Clock, MapPin } from 'lucide-react'
import type { ClassEntry } from '@/lib/data'

export type ScheduleEditDiff = {
  action: 'update' | 'delete' | 'add'
  targetClassId: string
  targetSubject: string
  targetCode: string
  fieldChanged: string
  oldValue: string
  newValue: string
  confirmationText: string
  updatedClass: ClassEntry
}

interface Props {
  diff: ScheduleEditDiff | null
  onConfirm: () => void
  onCancel: () => void
}

export function AiEditConfirmModal({ diff, onConfirm, onCancel }: Props) {
  if (!diff) return null

  const isDelete = diff.action === 'delete'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl"
        >
          {/* Header Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`flex size-8 items-center justify-center rounded-xl ${isDelete ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-primary/15 text-primary'}`}>
                {isDelete ? <Trash2 className="size-4" /> : <Sparkles className="size-4" />}
              </div>
              <span className="text-[12px] font-bold tracking-wider uppercase text-muted-foreground">
                {isDelete ? 'Confirm Deletion' : 'AI Edit Preview'}
              </span>
            </div>
            <button
              onClick={onCancel}
              className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Question / Headline */}
          <h3 className="mt-4 text-[18px] font-bold tracking-tight text-foreground leading-snug">
            {diff.confirmationText}
          </h3>

          {/* Class details banner */}
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-border/60 bg-fill p-3.5">
            <div>
              <p className="text-[14px] font-semibold text-foreground">{diff.targetSubject}</p>
              <p className="text-[12px] text-muted-foreground">{diff.targetCode}</p>
            </div>
            <span className="rounded-full bg-card px-2.5 py-1 text-[11px] font-bold text-primary shadow-sm">
              {diff.fieldChanged.toUpperCase()}
            </span>
          </div>

          {/* Diff Box */}
          {!isDelete && (
            <div className="mt-3 grid grid-cols-2 items-center gap-2 rounded-2xl border border-border/40 bg-card p-3.5 text-center shadow-inner">
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-semibold uppercase text-muted-foreground">Current</span>
                <span className="mt-1 text-[13.5px] font-medium text-muted-foreground line-through">
                  {diff.oldValue || 'None'}
                </span>
              </div>
              <div className="flex flex-col items-center border-l border-border/40 pl-2">
                <span className="text-[11px] font-semibold uppercase text-primary">New Value</span>
                <span className="mt-1 text-[14px] font-bold text-foreground">
                  {diff.newValue}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-full border border-border bg-card py-3 text-[14.5px] font-semibold text-foreground hover:bg-secondary active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 flex items-center justify-center gap-2 rounded-full py-3 text-[14.5px] font-semibold text-white shadow-ios active:scale-95 transition-all ${
                isDelete
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                  : 'bg-primary hover:bg-[#1a6148] shadow-primary/30'
              }`}
            >
              <Check className="size-4" strokeWidth={2.5} />
              {isDelete ? 'Confirm Delete' : 'Confirm & Apply'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
