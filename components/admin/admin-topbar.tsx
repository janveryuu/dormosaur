'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface AdminTopbarProps {
  title: string
  description?: string
  actions?: ReactNode
  adminName?: string
  adminInitials?: string
}

export function AdminTopbar({
  title,
  description,
  actions,
  adminName = 'Janver Manlapaz',
  adminInitials = 'JM',
}: AdminTopbarProps) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-balance">{title}</h1>
        {description && (
          <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <Link
          href="/dashboard"
          className="hidden items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-[13px] font-semibold text-muted-foreground shadow-ios transition-colors hover:text-foreground sm:flex border border-border/40"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2.2} />
          Back to app
        </Link>
        <div className="flex items-center gap-2.5 rounded-full bg-card py-1.5 pr-4 pl-1.5 shadow-ios border border-border/40">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground shadow-xs">
            {adminInitials}
          </span>
          <div className="hidden leading-tight sm:block">
            <div className="text-[13px] font-bold tracking-[-0.01em]">{adminName}</div>
            <div className="text-[11px] text-emerald-600 font-semibold">Admin</div>
          </div>
        </div>
      </div>
    </header>
  )
}
