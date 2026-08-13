'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, WandSparkles } from 'lucide-react'
import { ScreenHeader } from '@/components/ios/screen-header'
import { PillButton } from '@/components/ios/pill-button'
import { ActivityIndicator } from '@/components/ios/activity-indicator'
import { rawScheduleSample } from '@/lib/data'

const stages = [
  'Reading your text',
  'Detecting course codes',
  'Matching days and times',
  'Assigning colours',
]

export default function ImportSchedulePage() {
  const router = useRouter()
  const [raw, setRaw] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [stage, setStage] = React.useState(0)

  React.useEffect(() => {
    if (!loading) return
    const id = setInterval(() => {
      setStage((s) => Math.min(s + 1, stages.length - 1))
    }, 420)
    const done = setTimeout(() => router.push('/schedule/review'), 1900)
    return () => {
      clearInterval(id)
      clearTimeout(done)
    }
  }, [loading, router])

  return (
    <>
      <ScreenHeader
        title="Import schedule"
        backHref="/schedule"
        eyebrow="Step 1 of 2"
        subtitle="Paste it exactly as you received it. Line breaks, abbreviations and typos are fine."
      />

      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <div className="rounded-4xl bg-card p-5 shadow-ios-lg">
          <label htmlFor="raw-schedule" className="block px-1 pb-2">
            <span className="text-[13px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
              Raw schedule
            </span>
          </label>
          <textarea
            id="raw-schedule"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={9}
            disabled={loading}
            placeholder={rawScheduleSample}
            className="w-full resize-none rounded-3xl bg-fill p-4 font-mono text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground/55 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          />

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              onClick={() => setRaw(rawScheduleSample)}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-full px-1 text-[14.5px] font-medium text-primary disabled:opacity-50"
            >
              <WandSparkles className="size-4" strokeWidth={2} />
              Use sample
            </button>
            <span className="text-[13px] text-muted-foreground tabular-nums">
              {raw.trim() ? `${raw.trim().split(/\n+/).length} lines` : 'Empty'}
            </span>
          </div>
        </div>

        <PillButton
          size="lg"
          full
          onClick={() => setLoading(true)}
          disabled={loading || raw.trim().length < 5}
        >
          {loading ? (
            <>
              <ActivityIndicator />
              Organizing
            </>
          ) : (
            <>
              <Sparkles className="size-4.5" strokeWidth={2.1} />
              Organize My Schedule
            </>
          )}
        </PillButton>

        <AnimatePresence>
          {loading && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-3xl bg-card p-5 shadow-ios"
            >
              {stages.map((label, i) => (
                <li
                  key={label}
                  className="flex items-center gap-3 py-1.5 text-[14.5px] font-medium"
                >
                  <span
                    className={
                      i <= stage
                        ? 'size-2 rounded-full bg-primary'
                        : 'size-2 rounded-full bg-separator'
                    }
                  />
                  <span className={i <= stage ? 'text-foreground' : 'text-muted-foreground'}>
                    {label}
                  </span>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        <p className="px-4 text-center text-[13px] leading-relaxed text-muted-foreground">
          Nothing leaves your device in this demo. Parsed results are yours to edit before anything
          is saved.
        </p>
      </div>
    </>
  )
}
