import * as React from 'react'
import { cn } from '@/lib/utils'

export function ListGroup({
  title,
  footnote,
  children,
  className,
}: {
  title?: string
  footnote?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex flex-col gap-2', className)}>
      {title && (
        <h2 className="px-4 text-[13px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
          {title}
        </h2>
      )}
      <div className="overflow-hidden rounded-3xl bg-card shadow-ios">
        <div className="flex flex-col divide-y divide-separator">{children}</div>
      </div>
      {footnote && (
        <p className="px-4 text-[12.5px] leading-relaxed text-muted-foreground">{footnote}</p>
      )}
    </section>
  )
}

export function ListRow({
  icon,
  label,
  detail,
  trailing,
  className,
}: {
  icon?: React.ReactNode
  label: React.ReactNode
  detail?: React.ReactNode
  trailing?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-h-14 items-center gap-3 px-4 py-3', className)}>
      {icon && (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[16px] font-medium tracking-[-0.01em]">{label}</div>
        {detail && (
          <div className="mt-0.5 text-[13.5px] leading-relaxed text-muted-foreground">{detail}</div>
        )}
      </div>
      {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
    </div>
  )
}
