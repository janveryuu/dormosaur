'use client'

import * as React from 'react'
import { Sparkles, Flower2 } from 'lucide-react'
import { formatTimeRange, type ClassEntry } from '@/lib/data'
import { groupClassesByDay } from '@/lib/template-helper'

interface TemplateProps {
  classes: ClassEntry[]
  name?: string
  school?: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function UltraPinkTemplate({
  classes,
  name = 'Janver Manlapaz',
  school = 'Batangas State University',
}: TemplateProps) {
  const grouped = groupClassesByDay(classes)

  return (
    <div className="relative flex h-full w-full flex-col bg-gradient-to-br from-pink-100 via-rose-50 to-pink-200 p-5 select-none overflow-hidden text-pink-950 font-sans border-4 border-pink-300 rounded-3xl">
      {/* Background Decorative SVG Flowers */}
      <Flower2 className="absolute -top-4 -left-4 size-20 text-pink-300/60 rotate-12 pointer-events-none" />
      <Flower2 className="absolute -bottom-6 -right-6 size-24 text-rose-300/60 -rotate-45 pointer-events-none" />
      <Sparkles className="absolute top-6 right-8 size-8 text-pink-400/80 animate-pulse pointer-events-none" />

      {/* Header Lockup */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 z-10 bg-white/70 backdrop-blur-md rounded-2xl p-3.5 border border-pink-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-pink-500 text-white shadow-xs">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-pink-600 tracking-tight leading-none">
              WEEKLY SCHEDULE
            </h1>
            <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mt-0.5">
              Bubblegum Edition
            </p>
          </div>
        </div>

        {/* Name and School / Class Info Pills */}
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <div className="rounded-full bg-pink-200/80 px-3 py-1 text-pink-800 border border-pink-300">
            <span className="text-pink-500 font-extrabold mr-1">Name:</span> {name}
          </div>
          <div className="rounded-full bg-rose-200/80 px-3 py-1 text-rose-900 border border-rose-300">
            <span className="text-rose-600 font-extrabold mr-1">Class:</span> {school}
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
              className="flex flex-col rounded-2xl bg-white/80 backdrop-blur-xs border-2 border-pink-200 p-2.5 shadow-xs overflow-hidden"
            >
              {/* Day Header Pill */}
              <div className="rounded-full bg-gradient-to-r from-pink-500 to-rose-400 text-white text-center text-[10.5px] font-extrabold py-1 px-3 mb-2 shadow-xs">
                {dayName}
              </div>

              {/* Class List */}
              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-0.5">
                {dayClasses.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-[9px] text-pink-300 font-bold italic">
                    Free Day 🎉
                  </div>
                ) : (
                  dayClasses.map((c, i) => (
                    <div
                      key={i}
                      className="flex flex-col rounded-xl bg-pink-50/90 border border-pink-200 p-1.5 shadow-2xs"
                    >
                      <span className="text-[10px] font-extrabold text-pink-900 leading-tight truncate">
                        {c.subject}
                      </span>
                      <span className="text-[8px] font-bold text-pink-600 mt-0.5 truncate">
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
