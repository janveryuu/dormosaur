'use client'

import * as React from 'react'
import { Bell } from 'lucide-react'

const highlights = [
  'Sync every syllabus into one calendar',
  'Get alarms that actually wake you up',
  'Find recipes you can cook with a microwave and a kettle',
]

export function BrandPanel() {
  return (
    <div className="auth-brand-panel relative hidden h-full flex-col justify-between gap-6 overflow-hidden px-10 py-10 lg:flex">
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
          width={48}
          height={48}
          className="size-12 rounded-2xl object-contain shadow-ios-md"
        />
        <span className="text-xl font-bold tracking-tight text-primary-foreground">
          Dormosaur
        </span>
      </div>

      {/* Main Illustration & Highlights */}
      <div className="relative z-10 flex flex-1 flex-col justify-center gap-8 max-w-md mx-auto">
        <div className="relative mx-auto flex items-center justify-center">
          <div className="auth-brand-mascot">
            <img src="/supportive-dormosaur.png" alt="Dormosaur with a backpack" width={320} height={320} />
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
          <p className="route-label">Your campus companion</p>
          <h2 className="auth-brand-title text-2xl font-extrabold leading-tight text-balance tracking-tight">
            One route map for the semester scramble.
          </h2>
          <ul className="mx-auto flex flex-col items-start gap-2.5 text-[14.5px] font-medium text-primary-foreground/72">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="inline-flex size-2 shrink-0 bg-highlight shadow-xs"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Social Proof Footer Banner (Step 4 Requirement: 5,000+ students) */}
      <div className="auth-brand-proof relative z-10 flex items-center gap-3 p-4 backdrop-blur-md">
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
        <p className="text-[13.5px] text-primary-foreground/72">
          Joined by <span className="font-bold text-primary-foreground">5,000+</span>{' '}
          students this semester
        </p>
      </div>
    </div>
  )
}
