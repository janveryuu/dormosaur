'use client'

import * as React from 'react'
import { Bell, CalendarDays } from 'lucide-react'

const highlights = [
  'Sync every syllabus into one calendar',
  'Get alarms that actually wake you up',
  'Find recipes you can cook with a microwave and a kettle',
]

export function BrandPanel() {
  return (
    <div className="relative hidden h-full flex-col justify-between gap-6 overflow-hidden bg-fill/50 px-10 py-10 lg:flex border-r border-border/60">
      {/* Dot-grid texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 text-primary opacity-[0.08] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:22px_22px]"
      />

      {/* Dormosaur Logo Branding */}
      <div className="relative z-10 flex items-center gap-2.5">
        <img
          src="/android-chrome-192x192.png"
          alt="Dormosaur"
          className="size-10 rounded-2xl object-cover shadow-ios-md"
        />
        <span className="text-xl font-bold tracking-tight text-foreground">
          Dormosaur
        </span>
      </div>

      {/* Main Illustration & Highlights */}
      <div className="relative z-10 flex flex-1 flex-col justify-center gap-8 max-w-md mx-auto">
        <div className="relative mx-auto flex items-center justify-center">
          <div className="flex size-40 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-primary/20 shadow-ios-lg">
            <CalendarDays
              className="size-16 text-primary"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>
          <div className="absolute -right-1 -top-1 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-ios-md ring-4 ring-background">
            <Bell
              className="size-5"
              strokeWidth={2}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 text-center">
          <h2 className="text-2xl font-extrabold leading-tight text-balance text-foreground tracking-tight">
            One app. Every dorm-life headache, handled.
          </h2>
          <ul className="mx-auto flex flex-col items-start gap-2.5 text-[14.5px] font-medium text-muted-foreground">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="inline-flex size-2 shrink-0 rounded-full bg-primary shadow-xs"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Social Proof Footer Banner (Step 4 Requirement: 5,000+ students) */}
      <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-border/60 bg-card/90 p-4 backdrop-blur-md shadow-ios-sm">
        <div className="flex -space-x-2">
          {['M', 'J', 'R'].map((initial) => (
            <span
              key={initial}
              className="flex size-8.5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground ring-2 ring-card shadow-xs"
            >
              {initial}
            </span>
          ))}
        </div>
        <p className="text-[13.5px] text-muted-foreground">
          Joined by <span className="font-bold text-foreground">5,000+</span>{' '}
          students this semester
        </p>
      </div>
    </div>
  )
}
