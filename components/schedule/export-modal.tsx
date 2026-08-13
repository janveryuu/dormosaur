'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Download, ExternalLink, X } from 'lucide-react'
import { downloadIcsFile, getGoogleCalendarUrl } from '@/lib/ical'
import { PillButton } from '@/components/ios/pill-button'
import { useSchedule } from '@/components/schedule-provider'

export function ExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { classes } = useSchedule()

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="ios-glass relative z-10 w-full max-w-md overflow-hidden rounded-4xl border border-border p-6 shadow-ios-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Calendar className="size-5" strokeWidth={2} />
                </span>
                <h3 className="text-[19px] font-semibold tracking-[-0.02em]">Export Schedule</h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-full bg-fill text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
              Export your {classes.length} classes to Apple Calendar, Outlook, or Google Calendar.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <PillButton
                size="lg"
                full
                onClick={() => {
                  downloadIcsFile(classes)
                  onClose()
                }}
              >
                <Download className="size-4.5" strokeWidth={2.2} />
                Download .ics iCal File
              </PillButton>

              <div className="mt-2">
                <p className="mb-2 px-1 text-[12px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                  Add to Google Calendar
                </p>
                <div className="flex max-h-44 flex-col gap-1.5 overflow-y-auto pr-1">
                  {classes.map((cls) => (
                    <a
                      key={cls.id}
                      href={getGoogleCalendarUrl(cls)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-2xl bg-fill p-3 text-[14px] font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <span className="truncate">
                        {cls.code} · {cls.subject}
                      </span>
                      <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
