'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Clock, Sparkles, Utensils, Calendar } from 'lucide-react'
import { useSchedule } from '@/components/schedule-provider'
import { analyzeTodaySchedule } from '@/lib/schedule-gap-analyzer'
import { recipes } from '@/lib/data'
import { RecipeCard } from './recipe-card'

export function ScheduleAwareTab() {
  const { classes } = useSchedule()
  const analysis = analyzeTodaySchedule(classes, 'Mon')
  const [maxMinutes, setMaxMinutes] = React.useState<number>(10)

  const scheduleFilteredRecipes = recipes.filter((r) => r.minutes <= maxMinutes)

  return (
    <div className="flex flex-col gap-5">
      {/* Live Schedule Gap Banner */}
      <div className="rounded-3xl border border-border/80 bg-gradient-to-r from-card via-card to-primary/10 p-5 shadow-ios">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="size-4" />
            </div>
            <span className="text-[12px] font-bold uppercase tracking-wider text-primary">
              Live Schedule Sync
            </span>
          </div>
          <span className="rounded-full bg-card border border-border px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
            Mon Schedule
          </span>
        </div>

        <h3 className="mt-3 text-[17px] font-bold text-foreground">
          {analysis.summaryHeadline}
        </h3>
        <p className="mt-1 text-[13.5px] text-muted-foreground leading-relaxed">
          Select a time window below to find recipes guaranteed to fit your real breaks today.
        </p>

        {/* Time Window Chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { mins: 5, label: '⚡ Under 5 mins (Ultra Fast)' },
            { mins: 10, label: '⏱️ Under 10 mins (Quick Break)' },
            { mins: 15, label: '🍲 Under 15 mins (Standard)' },
            { mins: 30, label: '🍳 Under 30 mins (Leisurely)' },
          ].map((item) => {
            const active = maxMinutes === item.mins
            return (
              <button
                key={item.mins}
                onClick={() => setMaxMinutes(item.mins)}
                className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]'
                    : 'bg-fill text-muted-foreground hover:text-foreground border border-border/40'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Recipe List */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          {scheduleFilteredRecipes.length} Recipe{scheduleFilteredRecipes.length === 1 ? '' : 's'} fitting ≤ {maxMinutes} mins
        </span>
      </div>

      {scheduleFilteredRecipes.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {scheduleFilteredRecipes.map((recipe, i) => (
            <RecipeCard key={recipe.slug} recipe={recipe} index={i} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-card p-10 text-center shadow-ios">
          <Utensils className="size-6 text-muted-foreground" />
          <p className="text-[15px] font-semibold">No recipes under {maxMinutes} minutes</p>
          <p className="text-[13px] text-muted-foreground">
            Try expanding your time window to 15 or 30 minutes!
          </p>
        </div>
      )}
    </div>
  )
}
