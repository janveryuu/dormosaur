'use client'
import { useSchedule } from '@/components/schedule-provider'
export function SyncStatus() {
  const { syncError, retrySync } = useSchedule()
  if (!syncError) return null
  return <div role="alert" className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
    <p>{syncError}</p><button type="button" className="mt-2 min-h-11 font-semibold underline" onClick={retrySync}>Retry</button>
  </div>
}
