'use client'

import * as React from 'react'
import { Leaf } from 'lucide-react'
import { formatTimeRange, type ClassEntry } from '@/lib/data'
import {
  groupClassesByDay,
  parseMinutesFromTimeString,
  getDynamicGridTimeRange,
} from '@/lib/template-helper'

interface TemplateProps {
  classes: ClassEntry[]
  name?: string
  school?: string
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function SageGreenTemplate({
  classes,
  name = 'Janver Manlapaz',
  school = 'Batangas State University',
}: TemplateProps) {
  const grouped = groupClassesByDay(classes)
  const timeRange = getDynamicGridTimeRange(classes, '.')

  return (
    <div className="relative flex h-full w-full flex-col bg-[#f4f6ee] p-5 select-none overflow-hidden text-[#3a4a25] font-sans border-4 border-[#b5c99a] rounded-3xl shadow-lg">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-4 mb-4 bg-[#e3ead3]/80 backdrop-blur-md rounded-2xl p-3.5 border border-[#b5c99a] shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#65a30d] text-white shadow-xs">
            <Leaf className="size-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#3a4a25] tracking-tight leading-none">
              CLASS SCHEDULE 🌿
            </h1>
            <p className="text-[10px] font-bold text-[#65a30d] uppercase tracking-widest mt-0.5">
              Sage & Terracotta Edition
            </p>
          </div>
        </div>

        {/* Name and School Box */}
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <div className="rounded-full bg-[#fefae0] px-3 py-1 text-[#3a4a25] border border-[#b5c99a] shadow-xs">
            <span className="text-[#65a30d] font-extrabold mr-1">Name:</span> {name}
          </div>
          <div className="rounded-full bg-[#fefae0] px-3 py-1 text-[#3a4a25] border border-[#b5c99a] shadow-xs">
            <span className="text-[#65a30d] font-extrabold mr-1">Class:</span> {school}
          </div>
        </div>
      </div>

      {/* Grid Timetable Table */}
      <div className="flex-1 flex flex-col border-2 border-[#3a4a25]/30 rounded-2xl overflow-hidden bg-white shadow-xs">
        {/* Table Header Row */}
        <div className="grid grid-cols-8 border-b-2 border-[#3a4a25]/30 bg-[#3a4a25] text-white text-[11px] font-extrabold py-2 text-center shrink-0">
          <div className="border-r border-[#3a4a25]/40">Time</div>
          {DAYS.map((day, idx) => (
            <div key={day} className={idx < DAYS.length - 1 ? 'border-r border-[#3a4a25]/40' : ''}>
              {day}
            </div>
          ))}
        </div>

        {/* Table Body Grid */}
        <div className="flex-1 grid grid-cols-8 relative divide-x divide-[#3a4a25]/20 min-h-0">
          {/* Time Column */}
          <div className="flex flex-col divide-y divide-[#3a4a25]/10 bg-[#e3ead3]/40 text-[9.5px] font-bold text-[#3a4a25]">
            {timeRange.hoursList.map((h, i) => (
              <div key={`time-${h}-${i}`} className="flex-1 flex items-center justify-center px-1">
                {h}
              </div>
            ))}
          </div>

          {/* 6 Day Columns */}
          {FULL_DAYS.map((dayName) => {
            const dayClasses = grouped[dayName as keyof typeof grouped] || []
            return (
              <div key={dayName} className="relative flex flex-col divide-y divide-[#3a4a25]/10 bg-[#fefae0]/40">
                {/* Background Row Guides */}
                {timeRange.hoursList.map((h, i) => (
                  <div key={`guide-${dayName}-${h}-${i}`} className="flex-1 border-b border-[#3a4a25]/10" />
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
                      className="absolute left-0.5 right-0.5 z-10 rounded-lg bg-[#3a4a25] text-white p-1 flex flex-col justify-center text-center shadow-xs overflow-hidden"
                      style={{
                        top: `${topPct}%`,
                        height: `${heightPct}%`,
                      }}
                    >
                      <span className="text-[9.5px] font-extrabold leading-none truncate w-full">
                        {c.subject}
                      </span>
                      <span className="text-[7.5px] text-[#e3ead3] truncate w-full mt-0.5">
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
    </div>
  )
}
