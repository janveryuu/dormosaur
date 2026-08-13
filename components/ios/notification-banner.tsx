'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Sparkles, X } from 'lucide-react'

import { springBouncy } from '@/lib/motion-presets'

export function NotificationBanner({
  open,
  title,
  body,
  time = 'now',
  aiNudge,
  onClose,
  inline = false,
}: {
  open: boolean
  title: string
  body: string
  time?: string
  aiNudge?: string
  onClose?: () => void
  inline?: boolean
}) {
  const card = (
    <motion.div
      initial={{ y: -80, opacity: 0, scale: 0.94 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -60, opacity: 0, scale: 0.96 }}
      transition={springBouncy}
      className="ios-glass flex w-full items-start gap-3 rounded-3xl border border-border p-4 shadow-ios-lg backdrop-blur-xl"
      role="status"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        {aiNudge ? <Sparkles className="size-4.5" strokeWidth={2.1} /> : <Bell className="size-4.5" strokeWidth={2.1} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-[15px] font-semibold tracking-[-0.01em]">{title}</p>
          {aiNudge && (
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              AI Nudge
            </span>
          )}
          <span className="ml-auto shrink-0 text-[12px] text-muted-foreground">{time}</span>
        </div>
        <p className="mt-0.5 text-[13.5px] leading-relaxed text-foreground font-medium">
          {aiNudge || body}
        </p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss notification"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </motion.div>
  )

  if (inline) return <AnimatePresence>{open && card}</AnimatePresence>

  return (
    <AnimatePresence>
      {open && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center p-3">
          <div className="pointer-events-auto w-full max-w-md">{card}</div>
        </div>
      )}
    </AnimatePresence>
  )
}
