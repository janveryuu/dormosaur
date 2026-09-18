'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { RotateCcw, LayoutDashboard, Calendar } from 'lucide-react'
import { PillButton } from '@/components/ios/pill-button'
import { DormosaurMascot } from '@/components/brand/dormosaur-mascot'

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
    <div className="flex min-h-[65vh] w-full flex-col items-center justify-center px-4 sm:px-6 py-10 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        className="w-full max-w-md sm:max-w-lg rounded-4xl border border-border/80 bg-card p-6 sm:p-8 shadow-ios-2xl"
      >
        <div className="mx-auto mb-5 relative size-32 sm:size-36 flex items-center justify-center">
          <DormosaurMascot
            variant="thinking"
            alt="Dormosaur thinking through a timetable hiccup"
            width={144}
            height={144}
            priority
            className="object-contain drop-shadow-lg"
          />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-3 py-1 text-[12px] font-bold text-emerald-600 dark:text-emerald-400 mb-2">
          <Calendar className="size-3.5" />
          <span>Classes safely saved</span>
        </div>

        <h2 className="text-[20px] sm:text-[22px] font-bold tracking-tight text-foreground">
          Schedule view had a hiccup
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          We encountered a display issue rendering the timetable grid. Your registered classes and alarm sync are unaffected.
        </p>

        {error?.message && (
          <div className="my-4 overflow-hidden rounded-2xl border border-border/70 bg-fill/80 p-3 text-left">
            <p className="text-[11.5px] font-mono text-muted-foreground break-all line-clamp-3">
              {error.message}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <PillButton size="lg" full onClick={() => reset()}>
            <RotateCcw className="size-4 mr-2" />
            Reload Timetable
          </PillButton>

          <Link href="/dashboard" className="w-full">
            <PillButton variant="secondary" size="lg" full>
              <LayoutDashboard className="size-4 mr-2" />
              Go to Dashboard
            </PillButton>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
