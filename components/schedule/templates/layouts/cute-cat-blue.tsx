'use client'

import * as React from 'react'
import { Cat, Heart } from 'lucide-react'
import { formatTimeRange, type ClassEntry } from '@/lib/data'
import { groupClassesByDay } from '@/lib/template-helper'

interface TemplateProps {
  classes: ClassEntry[]
  name?: string
  school?: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function CuteCatBlueTemplate({
  classes,
  name = 'Janver Manlapaz',
  school = 'Batangas State University',
}: TemplateProps) {
  const grouped = groupClassesByDay(classes)
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="relative flex h-full w-full flex-col bg-gradient-to-br from-sky-100 via-blue-50 to-sky-200 p-5 select-none overflow-hidden text-sky-950 font-sans border-4 border-sky-300 rounded-3xl">
      {/* Decorative Cat Elements */}
      <Cat className="absolute -bottom-4 -left-4 size-24 text-sky-300/60 rotate-12 pointer-events-none" />
      <Heart className="absolute top-4 right-6 size-6 text-sky-400/80 fill-sky-300 pointer-events-none" />

      {/* Header Lockup */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 z-10 bg-white/80 backdrop-blur-md rounded-2xl p-3 border border-sky-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-xs">
            <Cat className="size-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-sky-700 tracking-tight leading-none">
              CLASS SCHEDULE 🐾
            </h1>
            <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mt-0.5">
              Cute Cat Edition
            </p>
          </div>
        </div>

        {/* Date and Class Fields */}
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <div className="rounded-full bg-sky-100 px-3 py-1 text-sky-800 border border-sky-300">
            <span className="text-sky-600 font-extrabold mr-1">Date:</span> {todayStr}
          </div>
          <div className="rounded-full bg-blue-100 px-3 py-1 text-blue-900 border border-blue-300">
            <span className="text-blue-600 font-extrabold mr-1">Class:</span> {school}
          </div>
        </div>
      </div>

      {/* 6 Day Cards Grid (3x2) */}
      <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-3 z-10 overflow-y-auto">
        {DAYS.map((dayName) => {
          const dayClasses = grouped[dayName as keyof typeof grouped] || []
          return (
            <div
              key={dayName}
              className="flex flex-col rounded-2xl bg-white/90 backdrop-blur-xs border-2 border-sky-200 p-2.5 shadow-xs overflow-hidden"
            >
              {/* Day Pill */}
              <div className="rounded-full bg-sky-500 text-white text-center text-[10.5px] font-extrabold py-1 px-3 mb-2 shadow-xs">
                {dayName}
              </div>

              {/* Class List */}
              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-0.5">
                {dayClasses.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-[9px] text-sky-300 font-bold italic">
                    Nap Time 💤
                  </div>
                ) : (
                  dayClasses.map((c, i) => (
                    <div
                      key={i}
                      className="flex flex-col rounded-xl bg-sky-50 border border-sky-200 p-1.5 shadow-2xs"
                    >
                      <span className="text-[10px] font-extrabold text-sky-900 leading-tight truncate">
                        {c.subject}
                      </span>
                      <span className="text-[8px] font-bold text-sky-600 mt-0.5 truncate">
                        {formatTimeRange(c.start, c.end)} {c.room ? `• ${c.room}` : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
