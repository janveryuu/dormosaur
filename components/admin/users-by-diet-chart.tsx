'use client'

import { Utensils } from 'lucide-react'

interface DietCount {
  diet: string
  count: number
}

export function UsersByDietChart({ counts }: { counts: DietCount[] }) {
  const total = counts.reduce((acc, curr) => acc + curr.count, 0) || 1

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <Utensils className="size-4 text-primary" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Dietary Preferences Distribution
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {counts.map((item) => {
          const pct = Math.round((item.count / total) * 100)
          return (
            <div key={item.diet} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[13px] font-semibold">
                <span className="font-extrabold text-foreground capitalize">{item.diet}</span>
                <span className="tabular-nums font-bold text-primary">
                  {item.count} student{item.count !== 1 ? 's' : ''} ({pct}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${Math.max(5, pct)}%` }}
                />
              </div>
            </div>
          )
        })}

        {counts.length === 0 && (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No dietary data logged yet.
          </div>
        )}
      </div>
    </div>
  )
}
