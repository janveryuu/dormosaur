'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
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
  contextImage,
  contextImageAlt = '',
}: {
  title: string
  eyebrow?: string
  subtitle?: string
  backHref?: string
  trailing?: React.ReactNode
  headerGraphic?: React.ReactNode
  contextImage?: string
  contextImageAlt?: string
}) {
  const [collapsed, setCollapsed] = React.useState(false)
  // Use Motion's useScroll — desktop sticky title collapse
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setCollapsed(latest > 52)
  })

  const headerContent = (
    <div className="pt-2 pb-6 sm:pb-8">
      <div className="flex items-start justify-between gap-3 sm:gap-6">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="mb-2 text-[11px] font-bold tracking-[0.08em] text-primary uppercase sm:text-[12px]">
              {eyebrow}
            </p>
          )}
          <h1 className={cn('text-[2rem] font-extrabold leading-[1.02] tracking-[-0.045em] text-foreground text-balance sm:text-[2.45rem] lg:text-[3rem]', contextImage && 'display-title')}>
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-[62ch] text-[13.5px] leading-relaxed text-muted-foreground sm:text-[15px]">
              {subtitle}
            </p>
          )}
        </div>

        {(trailing || headerGraphic) && (
          <div className="flex shrink-0 items-center gap-2 self-start pt-1">
            {trailing && <div className="flex items-center gap-1.5">{trailing}</div>}
            {headerGraphic && <div className="shrink-0">{headerGraphic}</div>}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sticky Header Bar */}
      <div
        className={cn(
          'hidden lg:block sticky top-0 z-20 -mx-10 px-10 transition-[background-color,border-color,box-shadow,transform] duration-300',
          collapsed ? 'border-b border-line bg-background/92 backdrop-blur-md' : 'border-b border-transparent pointer-events-none',
        )}
      >
        <div className="flex h-14 items-center gap-2">
          {backHref && (
            <Link
              href={backHref}
              className="-ml-2 flex items-center gap-0.5 rounded-full py-1 pr-2 pl-1 text-[15px] font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring pointer-events-auto"
            >
              <ChevronLeft className="size-5" strokeWidth={2.2} />
              Back
            </Link>
          )}
          <AnimatePresence>
            {collapsed && (
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={LAYOUT_SPRING}
                className="truncate text-[15px] font-bold tracking-[-0.02em] pointer-events-auto"
              >
                {title}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {contextImage ? (
        <div className="campus-context-header -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10">
          <Image src={contextImage} alt={contextImageAlt} fill priority sizes="(max-width: 1024px) 100vw, 900px" />
          <div className="campus-context-content">{headerContent}</div>
        </div>
      ) : headerContent}
    </>
  )
}

/** Deprecated fake modal handle — returns null to eliminate artificial desktop-on-mobile cues */
export function PullAffordance() {
  return null
}
