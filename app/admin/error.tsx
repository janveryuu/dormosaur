'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { AlertTriangle, LayoutGrid, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.warn('[Admin Error Boundary]', { digest: error?.digest || 'unknown' })
  }, [error])

  return (
    <div className="mx-auto my-12 max-w-lg rounded-4xl border border-border/50 bg-card p-8 text-center shadow-ios">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" />
      </div>
      <h2 className="text-xl font-bold tracking-tight">Something failed to load</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        This admin view ran into a temporary error. Retry loading the data or return to Overview.
      </p>
      {process.env.NODE_ENV !== 'production' && error?.message && (
        <pre className="mt-4 max-h-32 overflow-auto rounded-2xl bg-muted p-3 text-left font-mono text-xs text-muted-foreground">
          {error.message}
        </pre>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={() => reset()} className="rounded-full">
          <RotateCcw className="mr-1.5 size-4" />
          Try again
        </Button>
        <Link
          href="/admin"
          className="inline-flex h-9 items-center justify-center rounded-full border border-input bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LayoutGrid className="mr-1.5 size-4" />
          Admin Overview
        </Link>
      </div>
    </div>
  )
}
