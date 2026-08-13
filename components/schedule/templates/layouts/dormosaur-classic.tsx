'use client'

import * as React from 'react'
import { formatTimeRange, type ClassEntry } from '@/lib/data'
import {
  groupClassesByDay,
  getDynamicGridTimeRange,
  parseMinutesFromTimeString,
} from '@/lib/template-helper'
import { Sparkles } from 'lucide-react'

interface DormosaurClassicTemplateProps {
  classes: ClassEntry[]
  name?: string
  school?: string
}

const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

// Soft green & sage tonal palette (Brand Forest #1F6F50)
const CLASS_TONAL_COLORS = [
  'bg-[#1F6F50] text-[#FAFBF7] border-l-4 border-[#A3E635]',
  'bg-[#278260] text-[#FAFBF7] border-l-4 border-[#38D399]',
  'bg-[#18573E] text-[#FAFBF7] border-l-4 border-[#6EE7B7]',
  'bg-[#349570] text-[#FAFBF7] border-l-4 border-[#D9F99D]',
  'bg-[#134431] text-[#FAFBF7] border-l-4 border-[#86EFAC]',
]

export function DormosaurClassicTemplate({
  classes,
  name = 'Janver Manlapaz',
  school = 'Batangas State University',
}: DormosaurClassicTemplateProps) {
  const grouped = groupClassesByDay(classes)
  const timeRange = getDynamicGridTimeRange(classes, ':')

  return (
    <div className="flex h-full w-full flex-col bg-[#F7F8F5] text-[#1F6F50] font-sans selection:bg-[#1F6F50] selection:text-white">
      {/* ── Deep Forest Green Header Banner ── */}
      <div className="bg-[#1F6F50] px-6 py-4 text-[#FAFBF7] shadow-md flex items-center justify-between border-b-2 border-[#165A40]">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-white/10 border border-white/20 shadow-xs">
            <Sparkles className="size-5 text-[#A3E635]" />
          </div>
          <div>
            <h1 className="text-[19px] font-black tracking-tight uppercase leading-none">
              Class Schedule
            </h1>
            <p className="mt-1 text-[11.5px] font-medium text-[#D9F99D]/90 tracking-wide">
              {name} {school ? `• ${school}` : ''}
            </p>
          </div>
        </div>

        {/* Mascot Brand Badge */}
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 border border-white/15 backdrop-blur-xs">
          <img
            src="/dormosaur-hi.png"
            alt="Dormosaur"
            className="size-6 object-contain"
          />
          <span className="text-[12px] font-bold tracking-wider uppercase text-white">
            Dormosaur
          </span>
        </div>
      </div>

      {/* ── Timetable Grid Header ── */}
      <div className="grid grid-cols-8 border-b border-[#1F6F50]/15 bg-[#E8EFEA] text-[11px] font-bold tracking-wider text-[#1F6F50]">
        <div className="flex items-center justify-center p-2 border-r border-[#1F6F50]/15 text-[#1F6F50]/70">
          TIME
        </div>
        {DAYS.map((day, idx) => (
          <div
            key={day}
            className={`p-2 text-center ${idx < DAYS.length - 1 ? 'border-r border-[#1F6F50]/15' : ''}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* ── Timetable Grid Body ── */}
      <div className="flex-1 grid grid-cols-8 relative divide-x divide-[#1F6F50]/15 min-h-0 bg-[#F7F8F5]">
        {/* Left Time Column */}
        <div className="flex flex-col divide-y divide-[#1F6F50]/10 bg-[#E8EFEA]/60 text-[9.5px] font-bold text-[#1F6F50]/80">
          {timeRange.hoursList.map((h, i) => (
            <div key={`time-${h}-${i}`} className="flex-1 flex items-center justify-center px-1">
              {h}
            </div>
          ))}
        </div>

        {/* 7 Day Columns */}
        {FULL_DAYS.map((dayName) => {
          const dayClasses = grouped[dayName as keyof typeof grouped] || []
          return (
            <div key={dayName} className="relative flex flex-col divide-y divide-[#1F6F50]/10 bg-transparent">
              {/* Background Row Guides */}
              {timeRange.hoursList.map((h, i) => (
                <div key={`guide-${dayName}-${h}-${i}`} className="flex-1 border-b border-[#1F6F50]/10" />
              ))}

              {/* Overlaid Class Cards */}
              {dayClasses.map((c, i) => {
                const startMins = parseMinutesFromTimeString(c.start)
                let endMins = parseMinutesFromTimeString(c.end)
                if (!endMins || endMins <= startMins) endMins = startMins + 60

                const topPct = Math.max(
                  0,
                  Math.min(100, ((startMins - timeRange.startMins) / timeRange.totalMins) * 100),
                )
                const heightPct = Math.max(
                  6,
                  Math.min(
                    100 - topPct,
                    ((endMins - startMins) / timeRange.totalMins) * 100,
                  ),
                )

                const colorClass = CLASS_TONAL_COLORS[i % CLASS_TONAL_COLORS.length]

                return (
                  <div
                    key={c.id ? `${c.id}-${i}` : i}
                    style={{ top: `${topPct}%`, height: `${heightPct}%` }}
                    className={`absolute inset-x-1 overflow-hidden rounded-xl ${colorClass} p-2 shadow-xs transition-all hover:z-20 hover:scale-[1.02] flex flex-col justify-between`}
                  >
                    <div>
                      <p className="font-extrabold text-[11px] leading-tight truncate">
                        {c.subject}
                      </p>
                      <p className="text-[9.5px] opacity-90 truncate font-semibold">
                        {c.code} {c.room ? `• ${c.room}` : ''}
                      </p>
                    </div>
                    <p className="text-[9px] font-bold opacity-80 mt-0.5">
                      {formatTimeRange(c.start, c.end)}
                    </p>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
