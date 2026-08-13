'use client'

import * as React from 'react'
import { Trees, Sparkles } from 'lucide-react'
import { formatTimeRange, type ClassEntry } from '@/lib/data'
import { groupClassesByDay } from '@/lib/template-helper'

interface TemplateProps {
  classes: ClassEntry[]
  name?: string
  school?: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function ForestWhimsyTemplate({
  classes,
  name = 'Janver Manlapaz',
  school = 'Batangas State University',
}: TemplateProps) {
  const grouped = groupClassesByDay(classes)

  return (
    <div className="relative flex h-full w-full flex-col bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-950 p-5 select-none overflow-hidden text-emerald-950 font-sans border-4 border-emerald-600 rounded-3xl">
      {/* Decorative Forest Elements */}
      <Trees className="absolute -bottom-4 -right-4 size-28 text-emerald-700/40 pointer-events-none" />
      <Sparkles className="absolute top-4 left-6 size-6 text-emerald-400/80 animate-pulse pointer-events-none" />

      {/* Header Lockup */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 z-10 bg-emerald-950/70 backdrop-blur-md rounded-2xl p-3.5 border border-emerald-700/60 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-xs">
            <Trees className="size-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
              FOREST WHIMSY 🌲
            </h1>
            <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-0.5">
              Enchanted Nature Edition
            </p>
          </div>
        </div>

        {/* Name and School Info Pills */}
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <div className="rounded-full bg-emerald-900/90 px-3 py-1 text-emerald-200 border border-emerald-700">
            <span className="text-emerald-400 font-extrabold mr-1">Name:</span> {name}
          </div>
          <div className="rounded-full bg-emerald-900/90 px-3 py-1 text-emerald-200 border border-emerald-700">
            <span className="text-emerald-400 font-extrabold mr-1">Class:</span> {school}
          </div>
        </div>
      </div>

      {/* 6 Dashed Day Cards Grid (3x2) */}
      <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-3 z-10 overflow-y-auto">
        {DAYS.map((dayName) => {
          const dayClasses = grouped[dayName as keyof typeof grouped] || []
          return (
            <div
              key={dayName}
              className="flex flex-col rounded-2xl bg-white/95 backdrop-blur-xs border-2 border-dashed border-emerald-400 p-2.5 shadow-sm overflow-hidden"
            >
              {/* Day Header Pill */}
              <div className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-center text-[10.5px] font-extrabold py-1 px-3 mb-2 shadow-xs">
                {dayName}
              </div>

              {/* Class List */}
              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-0.5">
                {dayClasses.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-[9px] text-emerald-400 font-bold italic">
                    Rest Day 🍃
                  </div>
                ) : (
                  dayClasses.map((c, i) => (
                    <div
                      key={i}
                      className="flex flex-col rounded-xl bg-emerald-50 border border-emerald-200 p-1.5 shadow-2xs"
                    >
                      <span className="text-[10px] font-extrabold text-emerald-950 leading-tight truncate">
                        {c.subject}
                      </span>
                      <span className="text-[8px] font-bold text-emerald-700 mt-0.5 truncate">
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
