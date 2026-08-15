'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, RotateCcw, ArrowLeft, CalendarDays } from 'lucide-react'
import { PillButton } from '@/components/ios/pill-button'

export default function ScheduleErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error('[Schedule Error Boundary Caught]:', error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center px-6 py-12 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-6 shadow-ios-lg"
      >
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertCircle className="size-7" strokeWidth={2} />
        </div>

        <h2 className="text-[20px] font-bold tracking-tight text-foreground">
          Schedule Processing Notice
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          We encountered an issue displaying this schedule view. Your existing schedule and saved data are completely safe.
        </p>

        {error?.message && (
          <div className="my-4 rounded-xl bg-fill p-3 text-left font-mono text-[12px] text-muted-foreground overflow-x-auto max-h-24">
            {error.message}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <PillButton size="lg" full onClick={() => reset()}>
            <RotateCcw className="size-4 mr-2" />
            Try Again
          </PillButton>

          <Link href="/schedule" className="w-full">
            <PillButton variant="secondary" size="lg" full>
              <CalendarDays className="size-4 mr-2" />
              Back to Schedule
            </PillButton>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
