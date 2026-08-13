'use client'

import * as React from 'react'
import type { ClassEntry } from '@/lib/data'
import { groupClassesByDay } from '@/lib/template-helper'
import { DayCardClassList } from '../day-card-class-list'
import { Compass } from 'lucide-react'

interface DormosaurAdventureTemplateProps {
  classes: ClassEntry[]
  name?: string
  school?: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function DormosaurAdventureTemplate({
  classes,
  name = 'Janver Manlapaz',
  school = 'Batangas State University',
}: DormosaurAdventureTemplateProps) {
  const grouped = groupClassesByDay(classes)

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-br from-[#1F6F50] via-[#278260] to-[#3B9D77] p-5 text-white font-sans selection:bg-white selection:text-[#1F6F50]">
      {/* ── Background Abstract Leaf / Topographic Accent Blobs ── */}
      <div className="pointer-events-none absolute -top-16 -right-16 size-72 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 size-80 rounded-full bg-[#134431]/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 size-48 rounded-full bg-[#A3E635]/10 blur-xl" />

      {/* ── Header Banner ── */}
      <div className="relative z-10 mb-4 flex items-center justify-between rounded-2xl bg-[#134431]/40 p-4 border border-white/15 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-3">
          <img
            src="/dormosaur-hi.png"
            alt="Dormosaur Mascot"
            className="size-12 object-contain drop-shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-black tracking-tight text-[#FAFBF7]">
                Dormosaur Adventure
              </span>
              <Compass className="size-4 text-[#A3E635]" />
            </div>
            <p className="text-[12px] font-medium text-[#D9F99D]/90">
              {name} {school ? `• ${school}` : ''}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white border border-white/20">
          <span>Weekly Journey</span>
        </div>
      </div>

      {/* ── Day Cards Grid ── */}
      <div className="relative z-10 flex-1 grid grid-cols-2 gap-2.5 sm:gap-3.5 sm:grid-cols-4 lg:grid-cols-7 min-h-[240px] sm:min-h-0 overflow-y-auto">
        {DAYS.map((dayName) => {
          const dayClasses = grouped[dayName as keyof typeof grouped] || []
          return (
            <div
              key={dayName}
              className="flex min-h-[90px] flex-col overflow-hidden rounded-2xl bg-[#F7F8F5] p-2.5 sm:p-3 text-[#1F6F50] shadow-md border border-white/40 transition-all hover:shadow-lg"
            >
              {/* Day Header Pill */}
              <div className="mb-2 flex items-center justify-between rounded-xl bg-[#1F6F50] px-2.5 py-1.5 text-white">
                <span className="text-[11.5px] font-black uppercase tracking-wider">
                  {dayName.slice(0, 3)}
                </span>
                <span className="text-[10px] font-semibold text-[#D9F99D]">
                  {dayClasses.length}
                </span>
              </div>

              {/* Day Class List */}
              <div className="flex-1 overflow-y-auto">
                <DayCardClassList
                  classList={dayClasses}
                  themeColors={{
                    cardBg: 'bg-[#E8EFEA]/80 border-l-3 border-[#1F6F50]',
                    titleColor: 'text-[#1F6F50]',
                    subtitleColor: 'text-[#278260]',
                    timeColor: 'text-[#1F6F50]/80 font-bold',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
