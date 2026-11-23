'use client'

import { AnimatePresence, motion, useInView, useReducedMotionConfig } from 'framer-motion'
import { Check, RotateCcw } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Counter, Reveal, serif, spring } from './shared'

/** Race clock runs faster than real time so the point lands in under two seconds. */
const SPEED = 3
const lanes = [
  { label: 'Dormosaur', note: 'snap & done', finish: 5, win: true },
  { label: 'Typing every class', note: 'by hand', finish: 25 * 60 },
  { label: 'Building a spreadsheet', note: 'cell by cell', finish: 40 * 60 },
] as const

/** The "No. 1" claim, told by one idea: a stopwatch race Dormosaur wins before the others warm up. */
export function NumberOne() {
  return (
    <section id="number-one" className="px-4 py-16">
      <Reveal>
        <div className="relative mx-auto max-w-[1100px] overflow-hidden rounded-[44px] bg-[#04120B] text-white ring-1 ring-white/10">
          <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 size-[520px] rounded-full bg-[radial-gradient(circle,rgba(52,199,123,0.16),transparent_65%)]" />
          <div className="relative px-6 pt-14 sm:px-14 sm:pt-16">
            <h2 className="max-w-[820px] text-[46px] leading-[0.98] tracking-[-0.02em] sm:text-[78px]" style={serif}>
              The <em className="text-[#F5C542]">No.&nbsp;1</em> schedule tracker for <em className="text-[#7DF0B5]">dorm life</em>.
            </h2>
          </div>
          <Race />
        </div>
      </Reveal>
    </section>
  )
}

function fmt(sec: number) {
  if (sec < 60) return `0:${sec.toFixed(1).padStart(4, '0')}`
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function Race() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.5 })
  const reduce = useReducedMotionConfig()
  const [rawClock, setClock] = useState(0)
  const [run, setRun] = useState(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (!inView || reduce) return
    let raf = 0
    startRef.current = null
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t
      setClock(((t - startRef.current) / 1000) * SPEED)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduce, run])

  const replay = useCallback(() => {
    setClock(0)
    setRun(r => r + 1)
  }, [])

  // Reduced motion: skip the race and show the result.
  const clock = reduce && inView ? lanes[0].finish : rawClock
  const won = clock >= lanes[0].finish
  const shown = Math.min(clock, lanes[0].finish)

  return (
    <div ref={ref} className="relative grid gap-10 px-6 pb-10 pt-12 sm:px-14 sm:pb-14 md:grid-cols-[0.9fr_1.1fr] md:gap-x-14 md:gap-y-10">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/45">Time to set up a full term</p>
        <p className="mt-3 flex items-baseline gap-3 font-semibold tabular-nums tracking-[-0.05em]">
          <span className={`text-[88px] leading-none transition-colors duration-300 sm:text-[112px] ${won ? 'text-[#7DF0B5]' : 'text-white'}`}>{fmt(shown)}</span>
        </p>
        <div className="mt-4 flex h-8 items-center gap-3">
          <AnimatePresence mode="wait">
            {won ? (
              <motion.p key="won" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring} className="flex items-center gap-2 text-[15px] font-semibold text-[#7DF0B5]">
                <span className="grid size-6 place-items-center rounded-full bg-[#34C77B] text-[#04120B]"><Check className="size-3.5" strokeWidth={3.5} /></span>
                Your whole week, set.
              </motion.p>
            ) : (
              <motion.p key="go" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[15px] text-white/50">Scanning one photo…</motion.p>
            )}
          </AnimatePresence>
          {won && !reduce && (
            <button type="button" onClick={replay} className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/15 px-3 text-[13px] text-white/70 transition-colors hover:border-white/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7DF0B5]">
              <RotateCcw className="size-3.5" aria-hidden /> Replay
            </button>
          )}
        </div>
      </div>

      <ol className="space-y-7 md:col-start-2 md:row-span-2 md:row-start-1 md:self-center" aria-label="Setup time compared">
        {lanes.map(lane => {
          const t = Math.min(clock, lane.finish)
          const pct = (t / lane.finish) * 100
          const done = clock >= lane.finish
          const win = 'win' in lane && lane.win
          return (
            <li key={lane.label}>
              <div className={`mb-2.5 flex items-baseline justify-between gap-3 text-[15px] ${win ? 'pr-16' : ''}`}>
                <span className={win ? 'flex items-center gap-2 font-semibold text-white' : 'text-white/60'}>
                  {win && <span className="grid size-5 place-items-center rounded-full bg-[#F5C542] text-[10px] font-black text-[#3B2A00]">1</span>}
                  {lane.label}
                  <span className="ml-1 hidden text-[12px] font-normal text-white/35 sm:inline">{lane.note}</span>
                </span>
                <span className={`shrink-0 tabular-nums ${win ? 'text-[17px] font-bold text-[#7DF0B5]' : 'text-[13px] text-white/45'}`}>
                  {win ? (done ? '5 sec' : fmt(t)) : `${fmt(t)} of ~${Math.round(lane.finish / 60)} min`}
                </span>
              </div>
              <div className="relative h-3 rounded-full bg-white/[0.06]">
                <div
                  style={{ width: `${Math.max(pct, win ? 0 : 0.6)}%` }}
                  className={`h-full rounded-full ${win ? 'bg-gradient-to-r from-[#34C77B] to-[#7DF0B5] shadow-[0_0_20px_rgba(125,240,181,0.7)]' : 'bg-white/25'}`}
                />
                {!win && clock > 0 && <span aria-hidden className="absolute -top-[3px] size-[18px] animate-pulse rounded-full bg-white/10" style={{ left: `calc(${Math.max(pct, 0.6)}% - 9px)` }} />}
                {win && (
                  <AnimatePresence>
                    {done && (
                      <motion.div
                        initial={{ y: 30, scale: 0.4, opacity: 0 }}
                        animate={{ y: 0, scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 14 }}
                        className="absolute -right-2 bottom-1 origin-bottom"
                      >
                        <Image src="/dormo-jumping.png" alt="Dormo celebrating at the finish line" width={776} height={934} sizes="64px" className="h-auto w-[64px] drop-shadow-[0_10px_16px_rgba(0,0,0,0.5)]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </li>
          )
        })}
        <li aria-live="polite" className={`text-[13px] text-white/40 transition-opacity duration-500 ${won ? 'opacity-100' : 'opacity-0'}`}>The others are still typing. You&apos;re already done.</li>
      </ol>
      <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-6 md:col-start-1 md:row-start-2 md:self-start">
        {[{ n: 25, s: '+', l: 'dorm recipes' }, { n: 0, s: '', l: 'ads, ever' }, { n: 100, s: '%', l: 'offline alarms' }].map(x => (
          <div key={x.l}>
            <p className="text-[30px] font-bold tracking-tight"><Counter to={x.n} suffix={x.s} /></p>
            <p className="text-[13px] text-white/50">{x.l}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
