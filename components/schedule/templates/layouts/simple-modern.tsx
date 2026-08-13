'use client'

import * as React from 'react'
import { formatTimeRange, type ClassEntry } from '@/lib/data'
import {
  groupClassesByDay,
  parseMinutesFromTimeString,
  getDynamicGridTimeRange,
} from '@/lib/template-helper'

interface SimpleModernTemplateProps {
  classes: ClassEntry[]
  name?: string
  school?: string
}

const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export function SimpleModernTemplate({
  classes,
  name = 'Janver Manlapaz',
  school = 'Batangas State University',
}: SimpleModernTemplateProps) {
  const grouped = groupClassesByDay(classes)
  const timeRange = getDynamicGridTimeRange(classes, ':')

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950 text-white font-sans selection:bg-white selection:text-black">
      {/* ── Header Banner ── */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-black tracking-tight uppercase text-white">
            Class Timetable
          </h1>
          <p className="text-[11px] font-medium text-zinc-400">
            {name} {school ? `• ${school}` : ''}
          </p>
        </div>
        <div className="rounded-full bg-zinc-800 border border-zinc-700 px-3 py-1 text-[11px] font-semibold text-zinc-300">
          Weekly Grid
        </div>
      </div>

      {/* ── Timetable Grid Header ── */}
      <div className="grid grid-cols-8 border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-bold text-zinc-400">
        <div className="flex items-center justify-center p-2 border-r border-zinc-800 text-zinc-500">
          TIME
        </div>
        {DAYS.map((day, idx) => (
          <div
            key={day}
            className={`p-2 text-center ${idx < DAYS.length - 1 ? 'border-r border-zinc-800' : ''}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* ── Timetable Grid Body ── */}
      <div className="flex-1 grid grid-cols-8 relative divide-x divide-zinc-800 min-h-0">
        {/* Left Time Column */}
        <div className="flex flex-col divide-y divide-zinc-800/60 bg-zinc-900/30 text-[9.5px] font-medium text-zinc-500">
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
            <div key={dayName} className="relative flex flex-col divide-y divide-zinc-800/40">
              {/* Background Row Guides */}
              {timeRange.hoursList.map((h, i) => (
                <div key={`guide-${dayName}-${h}-${i}`} className="flex-1 border-b border-zinc-800/40" />
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

                return (
                  <div
                    key={i}
                    className="absolute left-0.5 right-0.5 z-10 rounded-lg bg-zinc-800 border border-zinc-700 text-white p-1 flex flex-col justify-center text-center shadow-xs overflow-hidden"
                    style={{
                      top: `${topPct}%`,
                      height: `${heightPct}%`,
                    }}
                  >
                    <span className="text-[9.5px] font-extrabold leading-none truncate w-full">
                      {c.subject}
                    </span>
                    <span className="text-[7.5px] text-zinc-300 truncate w-full mt-0.5">
                      {formatTimeRange(c.start, c.end)} {c.room ? `• ${c.room}` : ''}
                    </span>
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
