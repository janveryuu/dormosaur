'use client'

import * as React from 'react'
import { Waves, Shell } from 'lucide-react'
import { formatTimeRange, type ClassEntry } from '@/lib/data'
import { groupClassesByDay } from '@/lib/template-helper'

interface TemplateProps {
  classes: ClassEntry[]
}

const DAYS_ROW_1 = ['Monday', 'Tuesday', 'Wednesday', 'Thursday']
const DAYS_ROW_2 = ['Friday', 'Saturday', 'Sunday']

export function OceanPartyTemplate({ classes }: TemplateProps) {
  const grouped = groupClassesByDay(classes)

  return (
    <div className="relative flex h-full w-full flex-col bg-gradient-to-br from-indigo-100 via-blue-100 to-indigo-200 p-5 select-none overflow-hidden text-indigo-950 font-sans border-4 border-indigo-300 rounded-3xl">
      {/* Decorative Sea Icons */}
      <Waves className="absolute -top-4 -right-4 size-24 text-indigo-300/60 rotate-12 pointer-events-none" />
      <Shell className="absolute -bottom-6 -left-6 size-24 text-blue-300/60 -rotate-12 pointer-events-none" />

      {/* Header Lockup */}
      <div className="flex items-center justify-between mb-4 z-10 bg-white/80 backdrop-blur-md rounded-2xl p-3 border border-indigo-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xs">
            <Waves className="size-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-indigo-700 tracking-tight leading-none">
              OCEAN PARTY SCHEDULE 🌊
            </h1>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">
              Periwinkle Sea Edition
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full border border-indigo-200">
          Mon – Sun
        </span>
      </div>

      {/* 7 Day Cards Layout (Row 1: 4 cards, Row 2: 3 cards centered) */}
      <div className="flex-1 flex flex-col gap-3 z-10 overflow-y-auto">
        {/* Row 1 (Mon - Thu) */}
        <div className="flex-1 grid grid-cols-4 gap-3">
          {DAYS_ROW_1.map((dayName) => renderDayCard(dayName, grouped[dayName as keyof typeof grouped] || []))}
        </div>

        {/* Row 2 (Fri - Sun) */}
        <div className="flex-1 grid grid-cols-3 gap-3 mx-auto w-full max-w-[85%]">
          {DAYS_ROW_2.map((dayName) => renderDayCard(dayName, grouped[dayName as keyof typeof grouped] || []))}
        </div>
      </div>
    </div>
  )
}

function renderDayCard(dayName: string, dayClasses: ClassEntry[]) {
  return (
    <div
      key={dayName}
      className="flex flex-col rounded-2xl bg-white/90 backdrop-blur-xs border-2 border-indigo-200 p-2.5 shadow-xs overflow-hidden h-full"
    >
      <div className="rounded-full bg-indigo-600 text-white text-center text-[10.5px] font-extrabold py-1 px-3 mb-2 shadow-xs">
        {dayName}
      </div>

      <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-0.5">
        {dayClasses.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[9px] text-indigo-300 font-bold italic">
            Free Day 🐬
          </div>
        ) : (
          dayClasses.map((c, i) => (
            <div
              key={i}
              className="flex flex-col rounded-xl bg-indigo-50 border border-indigo-200 p-1.5 shadow-2xs"
            >
              <span className="text-[10px] font-extrabold text-indigo-900 leading-tight truncate">
                {c.subject}
              </span>
              <span className="text-[8px] font-bold text-indigo-600 mt-0.5 truncate">
                {formatTimeRange(c.start, c.end)} {c.room ? `• ${c.room}` : ''}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
