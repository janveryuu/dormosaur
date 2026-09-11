'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useReducedMotion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LAYOUT_SPRING } from '@/lib/springs'

export function ScreenHeader({
  title,
  eyebrow,
  subtitle,
  backHref,
  trailing,
  headerGraphic,
}: {
  title: string
  eyebrow?: string
  subtitle?: string
  backHref?: string
  trailing?: React.ReactNode
  headerGraphic?: React.ReactNode
}) {
  const [collapsed, setCollapsed] = React.useState(false)
  const reduce = useReducedMotion()

  // Use Motion's useScroll instead of window.addEventListener — no jank, no cleanup needed
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setCollapsed(latest > 52)
  })

  return (
    <>
      <div
        className={cn(
          'sticky top-0 z-30 -mx-5 px-5 transition-all duration-300 lg:-mx-8 lg:px-8',
          collapsed ? 'ios-glass border-b border-separator' : 'border-b border-transparent',
        )}
      >
        <div className="flex h-14 items-center gap-2">
          {backHref && (
            <Link
              href={backHref}
              className="-ml-2 flex items-center gap-0.5 rounded-full py-1 pr-2 pl-1 text-[16px] font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ChevronLeft className="size-5" strokeWidth={2.2} />
              Back
            </Link>
          )}
          <AnimatePresence>
            {collapsed && (
              <motion.span
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: 8 }}
                transition={LAYOUT_SPRING}
                className="truncate text-[17px] font-semibold tracking-[-0.02em]"
              >
                {title}
              </motion.span>
            )}
          </AnimatePresence>
          <div className="ml-auto flex items-center gap-2">{trailing}</div>
        </div>
      </div>

      <div className="pt-1 pb-6 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          {eyebrow && (
            <p className="mb-1 text-[12px] font-semibold tracking-[0.08em] text-primary uppercase">
              {eyebrow}
            </p>
          )}
          <h1 className="ios-large-title text-balance">{title}</h1>
          {subtitle && (
            <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {headerGraphic && (
          <div className="shrink-0 self-center">
            {headerGraphic}
          </div>
        )}
      </div>
    </>
  )
}

export function PullAffordance() {
  return (
    <div className="flex justify-center pt-1 pb-3" aria-hidden="true">
      <div className="h-1 w-9 rounded-full bg-separator" />
    </div>
  )
}
