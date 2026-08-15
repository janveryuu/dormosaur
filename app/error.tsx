'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'
import { PillButton } from '@/components/ios/pill-button'

export default function RootErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error('[Root Error Boundary Caught]:', error)
  }, [error])

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-6 py-12 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-8 shadow-ios-lg"
      >
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl bg-destructive/10 text-destructive">
          <AlertCircle className="size-8" strokeWidth={2} />
        </div>

        <h2 className="text-[22px] font-bold tracking-tight text-foreground">
          Something went wrong
        </h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
          Dormosaur hit a temporary bump, but your semester data and settings are safely stored.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <PillButton size="lg" full onClick={() => reset()}>
            <RotateCcw className="size-4 mr-2" />
            Reload Screen
          </PillButton>

          <Link href="/dashboard" className="w-full">
            <PillButton variant="secondary" size="lg" full>
              <Home className="size-4 mr-2" />
              Go to Dashboard
            </PillButton>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
