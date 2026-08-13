'use client'

import { Globe } from 'lucide-react'

interface CountryCount {
  country: string
  name: string
  count: number
}

export function UsersByCountryChart({ counts }: { counts: CountryCount[] }) {
  const total = counts.reduce((acc, curr) => acc + curr.count, 0) || 1

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <Globe className="size-4 text-primary" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Student Demographics by Country
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {counts.map((item) => {
          const pct = Math.round((item.count / total) * 100)
          return (
            <div key={item.country} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[13px] font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="font-extrabold text-foreground">{item.name}</span>
                  <span className="text-xs text-muted-foreground">({item.country})</span>
                </span>
                <span className="tabular-nums font-bold text-primary">
                  {item.count} student{item.count !== 1 ? 's' : ''} ({pct}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.max(5, pct)}%` }}
                />
              </div>
            </div>
          )
        })}

        {counts.length === 0 && (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No country demographics logged yet.
          </div>
        )}
      </div>
    </div>
  )
}
