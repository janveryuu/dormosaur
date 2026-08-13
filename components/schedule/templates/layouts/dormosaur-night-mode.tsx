'use client'

import * as React from 'react'
import { formatTimeRange, type ClassEntry } from '@/lib/data'
import {
  groupClassesByDay,
  getDynamicGridTimeRange,
  parseMinutesFromTimeString,
} from '@/lib/template-helper'
import { Moon } from 'lucide-react'

interface DormosaurNightModeTemplateProps {
  classes: ClassEntry[]
  name?: string
  school?: string
}

const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

// Soft mint & neon emerald dark mode class cards
const NIGHT_CLASS_COLORS = [
  'bg-[#193A2D] text-[#FAFBF7] border-l-4 border-[#38D399]',
  'bg-[#1F4536] text-[#FAFBF7] border-l-4 border-[#6EE7B7]',
  'bg-[#163428] text-[#FAFBF7] border-l-4 border-[#A3E635]',
  'bg-[#23503E] text-[#FAFBF7] border-l-4 border-[#34D399]',
  'bg-[#132A20] text-[#FAFBF7] border-l-4 border-[#4ADE80]',
]

export function DormosaurNightModeTemplate({
  classes,
  name = 'Janver Manlapaz',
  school = 'Batangas State University',
}: DormosaurNightModeTemplateProps) {
  const grouped = groupClassesByDay(classes)
  const timeRange = getDynamicGridTimeRange(classes, ':')

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-br from-[#0F1714] via-[#162820] to-[#0A100E] text-[#FAFBF7] font-sans selection:bg-[#38D399] selection:text-[#0F1714]">
      {/* ── Low-Opacity Silhouette Watermark Mascot in Background Corner ── */}
      <div className="pointer-events-none absolute bottom-2 right-2 z-0 opacity-10 blur-[0.5px]">
        <img
          src="/dormosaur-hi.png"
          alt="Dormosaur Watermark"
          className="size-64 object-contain grayscale brightness-200"
        />
      </div>

      {/* ── Header Banner ── */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 bg-[#0F1714]/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#38D399]/15 border border-[#38D399]/30 text-[#38D399]">
            <Moon className="size-4.5" />
          </div>
          <div>
            <h1 className="text-[18px] font-black uppercase tracking-wider text-[#FAFBF7] leading-none">
              Dormosaur Night
            </h1>
            <p className="mt-1 text-[11px] font-medium text-[#38D399] tracking-wide">
              {name} {school ? `• ${school}` : ''}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-[#38D399]/10 px-3 py-1 text-[11px] font-bold text-[#38D399] border border-[#38D399]/20">
          Dark Mode Wallpaper
        </span>
      </div>

      {/* ── Timetable Header ── */}
      <div className="relative z-10 grid grid-cols-8 border-b border-white/10 bg-[#12241D]/90 text-[10.5px] font-bold tracking-widest text-[#38D399]">
        <div className="flex items-center justify-center p-2 border-r border-white/10 text-white/40">
          TIME
        </div>
        {DAYS.map((day, idx) => (
          <div
            key={day}
            className={`p-2 text-center ${idx < DAYS.length - 1 ? 'border-r border-white/10' : ''}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* ── Timetable Grid Body ── */}
      <div className="relative z-10 flex-1 grid grid-cols-8 divide-x divide-white/10 min-h-0 bg-transparent">
        {/* Left Time Column */}
        <div className="flex flex-col divide-y divide-white/5 bg-[#0D1914]/80 text-[9px] font-bold text-white/50">
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
            <div key={dayName} className="relative flex flex-col divide-y divide-white/5 bg-transparent">
              {/* Background Row Guides */}
              {timeRange.hoursList.map((h, i) => (
                <div key={`guide-${dayName}-${h}-${i}`} className="flex-1 border-b border-white/5" />
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

                const colorClass = NIGHT_CLASS_COLORS[i % NIGHT_CLASS_COLORS.length]

                return (
                  <div
                    key={c.id ? `${c.id}-${i}` : i}
                    style={{ top: `${topPct}%`, height: `${heightPct}%` }}
                    className={`absolute inset-x-1 overflow-hidden rounded-xl ${colorClass} p-2 shadow-lg transition-all hover:z-20 hover:scale-[1.02] flex flex-col justify-between`}
                  >
                    <div>
                      <p className="font-black text-[11px] leading-tight truncate text-white">
                        {c.subject}
                      </p>
                      <p className="text-[9.5px] text-[#38D399] truncate font-semibold">
                        {c.code} {c.room ? `• ${c.room}` : ''}
                      </p>
                    </div>
                    <p className="text-[9px] font-bold text-white/70 mt-0.5">
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
