'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Search, Sparkles, Building2, CheckCircle2 } from 'lucide-react'

interface ScanProgressProps {
  isScanning: boolean
  isCompleted?: boolean
  error?: string | null
  className?: string
}

const PHASES = [
  {
    icon: Camera,
    text: 'Optimizing schedule image & enhancing contrast...',
    detail: 'Sharpening text for AI recognition',
    targetProgress: 22,
    durationMs: 2500,
  },
  {
    icon: Search,
    text: 'Detecting days, course codes & time slots...',
    detail: 'Reading timetable grid & course blocks',
    targetProgress: 52,
    durationMs: 3800,
  },
  {
    icon: Building2,
    text: 'Mapping room locations & instructors...',
    detail: 'Linking classrooms & schedules',
    targetProgress: 78,
    durationMs: 4200,
  },
  {
    icon: Sparkles,
    text: 'Finalizing your weekly semester plan...',
    detail: 'Color-coding courses & generating timetable',
    targetProgress: 94,
    durationMs: 6000,
  },
]

export function ScheduleScanProgress({
  isScanning,
  isCompleted = false,
  error = null,
  className = '',
}: ScanProgressProps) {
  const [phaseIndex, setPhaseIndex] = React.useState(0)
  const [progress, setProgress] = React.useState(10)

  React.useEffect(() => {
    if (!isScanning) {
      if (isCompleted) {
        setProgress(100)
      } else {
        setPhaseIndex(0)
        setProgress(10)
      }
      return
    }

    setPhaseIndex(0)
    setProgress(15)

    const timer1 = setTimeout(() => {
      setPhaseIndex(1)
      setProgress(45)
    }, 2400)

    const timer2 = setTimeout(() => {
      setPhaseIndex(2)
      setProgress(72)
    }, 6200)

    const timer3 = setTimeout(() => {
      setPhaseIndex(3)
      setProgress(90)
    }, 10400)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [isScanning, isCompleted])

  if (!isScanning && !error && !isCompleted) return null

  const currentPhase = PHASES[Math.min(phaseIndex, PHASES.length - 1)]
  const Icon = isCompleted ? CheckCircle2 : currentPhase.icon

  return (
    <div className={`flex flex-col gap-3 rounded-3xl border border-primary/20 bg-card p-4.5 shadow-ios transition-all ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {isScanning ? (
              <>
                <span className="absolute inline-flex size-full animate-ping rounded-2xl bg-primary/20 opacity-75" />
                <Icon className="relative size-5 animate-pulse" strokeWidth={2.2} />
              </>
            ) : isCompleted ? (
              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.2} />
            ) : null}
          </div>
          <div>
            <AnimatePresence mode="wait">
              <motion.p
                key={isCompleted ? 'done' : phaseIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="text-[14px] font-bold text-foreground"
              >
                {isCompleted ? 'Schedule parsed successfully!' : currentPhase.text}
              </motion.p>
            </AnimatePresence>
            <p className="text-[12px] text-muted-foreground">
              {isCompleted ? 'All classes ready for review' : currentPhase.detail}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-fill px-2.5 py-1 text-[11px] font-bold text-muted-foreground font-mono">
          {isCompleted ? '100%' : `${progress}%`}
        </span>
      </div>

      {/* Animated Gradient Progress Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-fill">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-emerald-500 to-[#1F6F50]"
          initial={{ width: '10%' }}
          animate={{ width: isCompleted ? '100%' : `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Upfront Expectation Note */}
      {!isCompleted && isScanning && (
        <p className="text-[11.5px] text-muted-foreground/80 text-center">
          AI is analyzing your entire semester timetable (~10–15s for full schedules)...
        </p>
      )}
    </div>
  )
}
