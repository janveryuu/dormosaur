'use client'

import * as React from 'react'
import { BookOpen } from 'lucide-react'
import { formatTimeRange, type ClassEntry } from '@/lib/data'
import { groupClassesByDay } from '@/lib/template-helper'

interface TemplateProps {
  classes: ClassEntry[]
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function PinkNotebookTemplate({ classes }: TemplateProps) {
  const grouped = groupClassesByDay(classes)

  return (
    <div
      className="relative flex h-full w-full flex-col bg-pink-50 p-5 select-none overflow-hidden text-pink-950 font-sans border-4 border-pink-200 rounded-3xl"
      style={{
        backgroundImage: `radial-gradient(#f472b6 0.75px, transparent 0.75px)`,
        backgroundSize: '16px 16px',
      }}
    >
      {/* Title Header */}
      <div className="flex items-center justify-between mb-3 bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-pink-200 shadow-xs">
        <div className="flex items-center gap-2">
          <BookOpen className="size-6 text-pink-600" />
          <h1 className="text-xl sm:text-2xl font-black text-pink-700 tracking-tight">
            MY CLASS NOTEBOOK
          </h1>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-pink-500 bg-pink-100 px-3 py-1 rounded-full border border-pink-200">
          Weekly Planner
        </span>
      </div>

      {/* 6 Spiral Notebook Cards (3x2) */}
      <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-3.5 overflow-y-auto">
        {DAYS.map((dayName) => {
          const dayClasses = grouped[dayName as keyof typeof grouped] || []
          return (
            <div
              key={dayName}
              className="relative flex flex-col rounded-2xl bg-white border-2 border-pink-200 p-3 pt-5 shadow-sm overflow-hidden"
            >
              {/* Metallic Ring Binder Clips at Top */}
              <div className="absolute top-1 left-0 right-0 flex justify-center gap-4">
                {[1, 2, 3, 4].map((ring) => (
                  <div
                    key={ring}
                    className="size-2.5 rounded-full bg-zinc-800 border border-zinc-400 shadow-xs"
                  />
                ))}
              </div>

              {/* Day Header */}
              <div className="border-b-2 border-pink-200 pb-1 mb-2 text-center">
                <span className="text-[11px] font-black uppercase tracking-widest text-pink-700">
                  {dayName}
                </span>
              </div>

              {/* Class Items */}
              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-0.5">
                {dayClasses.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-[9px] text-pink-300 font-bold italic">
                    No Classes
                  </div>
                ) : (
                  dayClasses.map((c, i) => (
                    <div
                      key={i}
                      className="flex flex-col rounded-lg bg-pink-50/80 border border-pink-200 p-1.5"
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
