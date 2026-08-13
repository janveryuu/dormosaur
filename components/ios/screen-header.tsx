'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  React.useEffect(() => {
    const onScroll = () => setCollapsed(window.scrollY > 52)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
              className="-ml-2 flex items-center gap-0.5 rounded-full py-1 pr-2 pl-1 text-[16px] font-medium text-primary"
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
                transition={{ type: 'spring', stiffness: 460, damping: 34 }}
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
            <p className="mb-1 text-[13px] font-semibold tracking-[0.06em] text-primary uppercase">
              {eyebrow}
            </p>
          )}
          <h1 className="ios-large-title text-balance">{title}</h1>
          {subtitle && (
            <p className="mt-2 max-w-lg text-[16px] leading-relaxed text-muted-foreground">
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
