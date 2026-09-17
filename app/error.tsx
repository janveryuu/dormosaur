'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { RotateCcw, Home, Sparkles } from 'lucide-react'
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
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 sm:px-6 py-12 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        className="w-full max-w-md sm:max-w-lg rounded-4xl border border-border/80 bg-card p-6 sm:p-8 shadow-ios-2xl"
      >
        <div className="mx-auto mb-5 relative size-32 sm:size-36 flex items-center justify-center">
          <Image
            src="/supportive-dormosaur.png"
            alt="Dormosaur"
            width={144}
            height={144}
            priority
            className="object-contain drop-shadow-lg"
          />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-3 py-1 text-[12px] font-bold text-emerald-600 dark:text-emerald-400 mb-2">
          <Sparkles className="size-3.5" />
          <span>Don&apos;t worry, your data is safe</span>
        </div>

        <h2 className="text-[22px] sm:text-[24px] font-bold tracking-tight text-foreground">
          Just a small semester bump
        </h2>
        <p className="mt-2 text-[14px] sm:text-[15px] leading-relaxed text-muted-foreground">
          Dormosaur hit a temporary hiccup loading this view. Your classes, alarms, and student settings are securely stored.
        </p>

        {error?.message && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border/70 bg-fill/80 p-3 text-left">
            <p className="text-[11.5px] font-mono text-muted-foreground break-all line-clamp-3">
              {error.message}
            </p>
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3">
          <PillButton size="lg" full onClick={() => reset()}>
            <RotateCcw className="size-4 mr-2" />
            Reload Screen
          </PillButton>

          <Link href="/dashboard" className="w-full">
            <PillButton variant="secondary" size="lg" full>
              <Home className="size-4 mr-2" />
              Return to Dashboard
            </PillButton>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
