import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-3xl bg-card p-5 shadow-ios border border-border/40',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold tracking-[-0.01em] text-muted-foreground">
          {label}
        </span>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-xs">
          <Icon className="size-[17px]" strokeWidth={2.2} />
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] font-black tracking-[-0.02em] tabular-nums text-foreground">
          {value}
        </span>
      </div>
      {trend && (
        <span className="inline-flex w-fit items-center rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11.5px] font-bold text-emerald-600 dark:text-emerald-400">
          {trend}
        </span>
      )}
    </div>
  )
}
