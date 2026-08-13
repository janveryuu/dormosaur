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
        <h2 className="px-4 text-[13px] font-bold tracking-[0.04em] text-muted-foreground uppercase">
          {title}
        </h2>
      )}
      <div className="overflow-hidden rounded-3xl bg-card shadow-ios border border-border/40">
        <div className="flex flex-col divide-y divide-border/40">{children}</div>
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
  onClick,
  className,
}: {
  icon?: React.ReactNode
  label: React.ReactNode
  detail?: React.ReactNode
  trailing?: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
  className?: string
}) {
  const interactiveProps = onClick
    ? {
        onClick,
        role: 'button' as const,
        tabIndex: 0,
        onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick(e as unknown as React.MouseEvent<HTMLDivElement>)
          }
        },
      }
    : {}

  return (
    <div
      {...interactiveProps}
      className={cn(
        'flex min-h-14 items-center gap-3 px-4 py-3 transition-colors',
        onClick && 'cursor-pointer hover:bg-accent/50 active:bg-accent/70',
        className,
      )}
    >
      {icon && (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold tracking-[-0.01em]">{label}</div>
        {detail && (
          <div className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{detail}</div>
        )}
      </div>
      {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
    </div>
  )
}
