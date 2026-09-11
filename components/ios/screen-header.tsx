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

  // Use Motion's useScroll — desktop sticky title collapse
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setCollapsed(latest > 52)
  })

  return (
    <>
      {/* Desktop Sticky Header Bar */}
      <div
        className={cn(
          'hidden lg:block sticky top-0 z-20 -mx-8 px-8 transition-all duration-300',
          collapsed ? 'ios-glass border-b border-separator' : 'border-b border-transparent',
        )}
      >
        <div className="flex h-14 items-center gap-2">
          {backHref && (
            <Link
              href={backHref}
              className="-ml-2 flex items-center gap-0.5 rounded-full py-1 pr-2 pl-1 text-[15px] font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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

      {/* Main Page Title & Intro Area */}
      <div className="pt-2 pb-5 sm:pb-6">
        <div className="flex items-start justify-between gap-3 sm:gap-6">
          <div className="flex-1 min-w-0">
            {eyebrow && (
              <p className="mb-1 text-[11px] sm:text-[12px] font-semibold tracking-wider text-primary uppercase">
                {eyebrow}
              </p>
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground text-balance leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 max-w-xl text-[13.5px] sm:text-[15px] leading-relaxed text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>

          {/* Right actions or graphic */}
          <div className="flex items-center gap-2 shrink-0 self-start pt-1">
            {trailing && <div className="flex items-center gap-1.5">{trailing}</div>}
            {headerGraphic && (
              <div className="hidden sm:block shrink-0">
                {headerGraphic}
              </div>
            )}
          </div>
        </div>

        {/* On mobile, if header graphic exists, show a refined compact version below if needed */}
        {headerGraphic && (
          <div className="sm:hidden mt-2 flex justify-end">
            <div className="max-h-16 max-w-20 overflow-hidden">
              {headerGraphic}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

/** Deprecated fake modal handle — returns null to eliminate artificial desktop-on-mobile cues */
export function PullAffordance() {
  return null
}
