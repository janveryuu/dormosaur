'use client'

import * as React from 'react'
import { formatTimeRange, type ClassEntry } from '@/lib/data'

interface DayCardClassListProps {
  classList?: ClassEntry[]
  cardBg?: string
  textColor?: string
  subColor?: string
  borderColor?: string
}

export function DayCardClassList({
  classList = [],
  cardBg = 'bg-white/80',
  textColor = 'text-zinc-900',
  subColor = 'text-zinc-600',
  borderColor = 'border-zinc-200',
}: DayCardClassListProps) {
  if (!classList || classList.length === 0) {
    return (
      <div className="text-[9px] text-zinc-400 italic py-2 text-center">No classes scheduled</div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 w-full h-auto">
      {classList.map((c, i) => (
        <div
          key={i}
          className={`flex flex-col rounded-xl p-1.5 ${cardBg} border ${borderColor} shadow-2xs transition-all`}
        >
          <span className={`font-extrabold text-[10px] sm:text-[10.5px] ${textColor} leading-tight truncate w-full`}>
            {c.subject}
          </span>
          <span className={`font-semibold text-[8px] sm:text-[8.5px] ${subColor} mt-0.5 truncate w-full`}>
            {formatTimeRange(c.start, c.end)} {c.room ? `• ${c.room}` : ''}
          </span>
        </div>
      ))}
    </div>
  )
}
