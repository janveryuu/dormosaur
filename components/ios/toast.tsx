'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastMessage = {
  id?: string
  type: 'success' | 'error' | 'info'
  title: string
  message?: string
}

export function IosToast({
  toast,
  onClose,
}: {
  toast: ToastMessage | null
  onClose: () => void
}) {
  React.useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => {
      onClose()
    }, 4000)
    return () => clearTimeout(timer)
  }, [toast, onClose])

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="fixed top-5 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 pointer-events-auto"
        >
          <div
            className={cn(
              'flex items-start gap-3.5 rounded-3xl p-4 shadow-ios-lg backdrop-blur-2xl border transition-all',
              toast.type === 'success'
                ? 'bg-accent/95 border-primary/30 text-foreground'
                : toast.type === 'error'
                ? 'bg-destructive/10 border-destructive/25 text-destructive'
                : 'bg-card/95 border-border/50 text-foreground',
            )}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' ? (
                <span className="flex size-7.5 items-center justify-center rounded-2xl bg-primary text-white shadow-ios">
                  <CheckCircle2 className="size-4.5" strokeWidth={2.2} />
                </span>
              ) : toast.type === 'error' ? (
                <span className="flex size-7.5 items-center justify-center rounded-2xl bg-destructive text-white shadow-ios">
                  <AlertCircle className="size-4.5" strokeWidth={2.2} />
                </span>
              ) : (
                <span className="flex size-7.5 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                  <Sparkles className="size-4.5" strokeWidth={2} />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[14.5px] font-bold tracking-tight">{toast.title}</p>
              {toast.message && (
                <p className="mt-0.5 text-[13px] leading-snug opacity-90">{toast.message}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-0.5 rounded-full p-1 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
