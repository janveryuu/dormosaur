'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight, Clock, MapPin } from 'lucide-react'
import { formatTime, minutesOf, subjectColorClass, type ClassEntry } from '@/lib/data'

function useCountdown(target: string) {
  const [label, setLabel] = React.useState<string | null>(null)

  React.useEffect(() => {
    const tick = () => {
      const now = new Date()
      const nowMin = now.getHours() * 60 + now.getMinutes()
      let diff = minutesOf(target) - nowMin
      if (diff < 0) diff += 24 * 60
      const hours = Math.floor(diff / 60)
      const mins = diff % 60
      const secs = 59 - now.getSeconds()
      setLabel(
        hours > 0
          ? `${hours}h ${String(mins).padStart(2, '0')}m`
          : `${mins}m ${String(secs).padStart(2, '0')}s`,
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])

  return label
}

export function NextClassCard({ entry }: { entry: ClassEntry }) {
  const countdown = useCountdown(entry.start)
  const color = subjectColorClass[entry.color]

  return (
    <Link href="/schedule" className="block">
      <motion.article
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="relative overflow-hidden rounded-4xl bg-card p-6 shadow-ios-lg"
      >
        <span className={`absolute inset-x-0 top-0 h-1 ${color.bg}`} aria-hidden="true" />
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.06em] text-primary uppercase">
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-70" />
                <span className="relative size-2 rounded-full bg-primary" />
              </span>
              Up next
            </p>
            <h2 className="mt-2 text-[28px] leading-tight font-bold tracking-[-0.03em] text-balance">
              {entry.subject}
            </h2>
            <p className="mt-1 text-[14.5px] font-medium text-muted-foreground">
              {entry.code} · {entry.instructor}
            </p>
          </div>
          <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground" />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-fill px-3.5 py-2 text-[13.5px] font-medium">
            <Clock className="size-4 text-muted-foreground" strokeWidth={1.9} />
            {formatTime(entry.start)} – {formatTime(entry.end)}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-fill px-3.5 py-2 text-[13.5px] font-medium">
            <MapPin className="size-4 text-muted-foreground" strokeWidth={1.9} />
            {entry.room}
          </span>
        </div>

        <div className="mt-5 flex items-baseline gap-2 border-t border-separator pt-5">
          <span className="text-[13.5px] text-muted-foreground">Starts in</span>
          <span className="font-mono text-[26px] leading-none font-semibold tracking-[-0.02em] tabular-nums text-primary">
            {countdown ?? '—'}
          </span>
        </div>
      </motion.article>
    </Link>
  )
}
