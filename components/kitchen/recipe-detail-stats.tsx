'use client'

import * as React from 'react'
import { Clock, Users, Banknote, Flame } from 'lucide-react'
import { useSchedule } from '@/components/schedule-provider'
import { formatRecipeCost } from '@/lib/currency'

interface RecipeDetailStatsProps {
  minutes: number
  servings: number
  costUSD?: number
  costString?: string
  difficulty: string
}

export function RecipeDetailStats({
  minutes,
  servings,
  costUSD,
  costString,
  difficulty,
}: RecipeDetailStatsProps) {
  const { profile } = useSchedule()
  const displayCost = costUSD !== undefined
    ? formatRecipeCost(costUSD, profile?.country)
    : (costString || '$1.00')

  const stats = [
    { icon: Clock, label: 'Time', value: `${minutes} min` },
    { icon: Users, label: 'Serves', value: String(servings) },
    { icon: Banknote, label: 'Cost', value: displayCost },
    { icon: Flame, label: 'Level', value: difficulty },
  ]

  return (
    <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1 rounded-2xl bg-card p-4 shadow-ios border border-border/50">
          <dt className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground">
            <stat.icon className="size-3.5" strokeWidth={2.2} />
            {stat.label}
          </dt>
          <dd className="text-[17px] font-bold tracking-[-0.02em] text-foreground">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}
