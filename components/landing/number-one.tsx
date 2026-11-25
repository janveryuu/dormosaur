'use client'

import { AnimatePresence, motion, useInView, useReducedMotionConfig } from 'framer-motion'
import { CalendarDays, Check, FileSpreadsheet, RotateCcw } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Counter, serif } from './shared'

type RankId = 'dormosaur' | 'manual' | 'spreadsheet'

type RankedItem = {
  id: RankId
  rank: 1 | 2 | 3
  placeLabel: string
  name: string
  subtitle: string
  timeLabel: string
  progressPct: number
  takeaway: string
}

const RANKINGS: RankedItem[] = [
  {
    id: 'dormosaur',
    rank: 1,
    placeLabel: '1st place',
    name: 'Dormosaur',
    subtitle: 'Snap one photo & done',
    timeLabel: '5 sec',
    progressPct: 100,
    takeaway: 'Finishes your full weekly timetable, rooms, and offline alarms in 5 seconds — before manual apps get past Monday.',
  },
  {
    id: 'manual',
    rank: 2,
    placeLabel: '2nd place',
    name: 'Manual calendar apps',
    subtitle: 'Typing every class by hand',
    timeLabel: '25 min',
    progressPct: 22,
    takeaway: 'Still entering subjects, repeat days, and room numbers one by one — then setting separate morning alarms in another app.',
  },
  {
    id: 'spreadsheet',
    rank: 3,
    placeLabel: '3rd place',
    name: 'Spreadsheets & notes',
    subtitle: 'Formatting cell by cell',
    timeLabel: '40 min',
    progressPct: 12,
    takeaway: 'Still merging time blocks and fixing column widths — with zero class alarms, countdowns, or deadline tracking.',
  },
]

const METRICS = [
  { to: 200, suffix: '', label: 'Dorm-budget recipes' },
  { to: 0, suffix: '', label: 'Ads or trackers, ever' },
  { to: 100, suffix: '%', label: 'Offline class alarms' },
] as const

const RACE_DURATION_MS = 1350

/**
 * Clean 1st / 2nd / 3rd finish-line ranking board.
 * Dormosaur reaches 100% in 5 sec with Dormo celebrating at 1st place while 2nd and 3rd trail behind.
 */
export function NumberOne() {
  const boardRef = useRef<HTMLDivElement>(null)
  const inView = useInView(boardRef, { once: true, amount: 0.35 })
  const reduce = useReducedMotionConfig()

  const [selected, setSelected] = useState<RankId>('dormosaur')
  const [progress, setProgress] = useState(0)
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setProgress(1)
      return
    }
    let raf = 0
    let start: number | null = null
    setProgress(0)
    const tick = (now: number) => {
      if (start === null) start = now
      const t = Math.min(1, (now - start) / RACE_DURATION_MS)
      // Smooth ease-out cubic so Dormosaur snaps cleanly to 1st place.
      const eased = 1 - Math.pow(1 - t, 3)
      setProgress(eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduce, runId])

  const replay = useCallback(() => {
    setSelected('dormosaur')
    setRunId(r => r + 1)
  }, [])

  const effectiveProgress = reduce && inView ? 1 : progress
  const finished = effectiveProgress >= 0.995
  const elapsedSec = effectiveProgress * 5
  const activeItem = RANKINGS.find(r => r.id === selected) ?? RANKINGS[0]

  return (
    <section id="number-one" className="scroll-mt-24 border-b border-[#0A1710]/[0.07] bg-[#F4F7F4] px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-[1100px]">
        <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-12">
          {/* Left column: clear headline + live race clock + replay */}
          <div>
            <h2 className="text-balance text-[42px] leading-[1.01] tracking-[-0.025em] text-[#0A1710] sm:text-[62px]" style={serif}>
              The No.&nbsp;1 schedule tracker for <em className="text-[#0E7A4A]">dorm life.</em>
            </h2>
            <p className="mt-5 max-w-[42ch] text-pretty text-[16px] leading-[1.65] text-[#354B3E] sm:text-[17px]">
              Snap one photo and finish your whole term before other tools even get past Monday.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <div className="rounded-[20px] border border-[#0A1710]/[0.07] bg-white px-5 py-3.5 shadow-[0_12px_28px_-20px_rgba(10,23,16,0.22)]">
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-[#4C6456]">
                  Full-term setup
                </p>
                <p className="mt-0.5 text-[34px] font-bold leading-none tabular-nums tracking-[-0.04em] text-[#0E7A4A] sm:text-[40px]">
                  {finished ? '5.0 sec' : `${elapsedSec.toFixed(1)} sec`}
                </p>
              </div>

              {!reduce && (
                <button
                  type="button"
                  onClick={replay}
                  className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-[#0A1710]/[0.12] bg-white px-4 py-2 text-[14px] font-semibold text-[#0A1710] transition-colors hover:border-[#0E7A4A]/40 hover:text-[#0E7A4A] active:scale-[0.97]"
                >
                  <RotateCcw className="size-4" aria-hidden />
                  Replay race
                </button>
              )}
            </div>
          </div>

          {/* Right column: 1st / 2nd / 3rd ranked podium board */}
          <div
            ref={boardRef}
            className="rounded-[28px] border border-[#0A1710]/[0.08] bg-white p-5 shadow-[0_24px_52px_-28px_rgba(10,23,16,0.2)] sm:p-7"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#0A1710]/[0.07] pb-4">
              <p className="text-[13px] font-semibold text-[#3B5244]">Setup speed ranking</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F6EE] px-3 py-1 text-[12.5px] font-semibold text-[#0B5E39]">
                <Check className="size-3.5" strokeWidth={2.8} aria-hidden />
                {finished ? 'Dormosaur finishes 1st' : 'Racing…'}
              </span>
            </div>

            <ol className="mt-4 space-y-3" aria-label="Schedule setup ranking">
              {RANKINGS.map(item => {
                const isFirst = item.rank === 1
                const isSelected = item.id === selected
                const currentBarWidth = item.progressPct * effectiveProgress

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(item.id)}
                      aria-pressed={isSelected}
                      className={`group relative w-full cursor-pointer rounded-[20px] p-4 text-left transition-all duration-200 active:scale-[0.99] ${
                        isFirst
                          ? isSelected
                            ? 'border-2 border-[#0E7A4A] bg-[#EEF9F3] shadow-[0_14px_30px_-22px_rgba(14,122,74,0.55)]'
                            : 'border border-[#0E7A4A]/35 bg-[#F2FAF5] hover:border-[#0E7A4A]/60'
                          : isSelected
                            ? 'border border-[#0A1710]/20 bg-[#F4F7F5]'
                            : 'border border-[#0A1710]/[0.06] bg-[#F8FAF8] hover:border-[#0A1710]/15'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        {/* Rank medal */}
                        <span
                          className={`grid size-8 shrink-0 place-items-center rounded-full text-[13.5px] font-bold tabular-nums ${
                            isFirst
                              ? 'bg-[#0E7A4A] text-white'
                              : 'bg-[#E5ECE7] text-[#354B3E]'
                          }`}
                        >
                          {item.rank}
                        </span>

                        {/* App / tool visual icon */}
                        {isFirst ? (
                          <Image
                            src="/dormosaur-logo.png"
                            alt="Dormosaur"
                            width={40}
                            height={40}
                            className="size-10 shrink-0 rounded-[12px] shadow-sm"
                          />
                        ) : (
                          <span
                            aria-hidden
                            className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-white text-[#52695C] ring-1 ring-[#0A1710]/[0.07]"
                          >
                            {item.id === 'manual' ? (
                              <CalendarDays className="size-5" strokeWidth={1.9} />
                            ) : (
                              <FileSpreadsheet className="size-5" strokeWidth={1.9} />
                            )}
                          </span>
                        )}

                        {/* Name + subtitle */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`truncate text-[15.5px] leading-tight ${isFirst ? 'font-bold text-[#0A1710]' : 'font-semibold text-[#2B3E33]'}`}>
                              {item.name}
                            </span>
                            {isFirst && (
                              <span className="hidden rounded-full bg-[#0E7A4A]/12 px-2 py-0.5 text-[11px] font-bold text-[#0B5E39] sm:inline-block">
                                1st
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-[13px] text-[#4C6355]">{item.subtitle}</p>
                        </div>

                        {/* Time readout */}
                        <div className="shrink-0 text-right">
                          <p className={`text-[16px] font-bold leading-tight tabular-nums ${isFirst ? 'text-[#0E7A4A]' : 'text-[#395043]'}`}>
                            {item.timeLabel}
                          </p>
                          <p className={`text-[11.5px] font-medium ${isFirst ? 'text-[#0B5E39]' : 'text-[#607568]'}`}>
                            {isFirst ? (finished ? 'Done' : 'Scanning') : 'Still typing'}
                          </p>
                        </div>
                      </div>

                      {/* Progress track */}
                      <div className={`relative mt-3.5 ${isFirst ? 'pr-12' : ''}`}>
                        <div className={`h-2.5 w-full overflow-hidden rounded-full ${isFirst ? 'bg-[#D5ECDF]' : 'bg-[#E6EDE8]'}`}>
                          <div
                            style={{ width: `${Math.max(currentBarWidth, isFirst ? 3 : 2)}%` }}
                            className={`h-full rounded-full ${
                              isFirst ? 'bg-[#0E7A4A]' : 'bg-[#9EB1A5]'
                            }`}
                          />
                        </div>

                        {/* Dormo celebrating at 1st place finish line */}
                        {isFirst && (
                          <AnimatePresence>
                            {finished && (
                              <motion.div
                                initial={reduce ? false : { opacity: 0, y: 12, scale: 0.7 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                                className="pointer-events-none absolute -top-6 right-0"
                              >
                                <Image
                                  src="/dormo-jumping.png"
                                  alt="Dormo celebrating in 1st place"
                                  width={776}
                                  height={934}
                                  sizes="44px"
                                  className="h-auto w-[44px] drop-shadow-[0_6px_10px_rgba(10,23,16,0.22)]"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ol>

            {/* Concise single takeaway for whichever rank is selected */}
            <div className="mt-4 rounded-[16px] bg-[#F4F7F4] px-4 py-3" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={activeItem.id}
                  initial={reduce ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="text-pretty text-[13.5px] leading-[1.55] text-[#2F4639]"
                >
                  <strong className="font-semibold text-[#0A1710]">{activeItem.placeLabel} · {activeItem.name}:</strong>{' '}
                  {activeItem.takeaway}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 border-t border-[#0A1710]/[0.08] pt-8 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[#0A1710]/[0.08]">
          {METRICS.map((m, idx) => (
            <div key={m.label} className={idx > 0 ? 'sm:pl-8' : ''}>
              <p className="text-[36px] font-bold leading-none tracking-[-0.03em] text-[#0A1710] sm:text-[42px]">
                <Counter to={m.to} suffix={m.suffix} />
              </p>
              <p className="mt-1.5 text-[14px] font-medium text-[#3B5144]">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
