'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Bell, X } from 'lucide-react'

export function NotificationBanner({
  open,
  title,
  body,
  time = 'now',
  onClose,
  inline = false,
}: {
  open: boolean
  title: string
  body: string
  time?: string
  onClose?: () => void
  inline?: boolean
}) {
  const card = (
    <motion.div
      initial={{ y: -80, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -80, opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className="ios-glass flex w-full items-start gap-3 rounded-3xl border border-border p-4 shadow-ios-lg"
      role="status"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Bell className="size-4.5" strokeWidth={2.1} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-[15px] font-semibold tracking-[-0.01em]">{title}</p>
          <span className="ml-auto shrink-0 text-[12px] text-muted-foreground">{time}</span>
        </div>
        <p className="mt-0.5 text-[14px] leading-relaxed text-muted-foreground">{body}</p>
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
