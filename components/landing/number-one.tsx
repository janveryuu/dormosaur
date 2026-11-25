'use client'

import { AnimatePresence, motion, useInView, useReducedMotionConfig } from 'framer-motion'
import { Check, Clock } from 'lucide-react'
import { useRef, useState, type KeyboardEvent } from 'react'
import { Counter, serif } from './shared'

type MethodId = 'dormosaur' | 'manual' | 'spreadsheet'

type MethodData = {
  id: MethodId
  rank: 1 | 2 | 3
  label: string
  tabLabel: string
  note: string
  timeText: string
  minutes: number
  barPercent: number
  summary: string
  steps: { title: string; detail: string }[]
}

const METHODS: MethodData[] = [
  {
    id: 'dormosaur',
    rank: 1,
    label: 'Dormosaur',
    tabLabel: 'Dormosaur',
    note: 'Snap & done',
    timeText: '5 sec',
    minutes: 0.08,
    barPercent: 8,
    summary: 'One photo, portal screenshot, or PDF becomes your full week with offline class alarms armed.',
    steps: [
      { title: 'Drop a photo, screenshot, or PDF', detail: 'Reads messy registration tables, room numbers, and multi-day codes.' },
      { title: 'Review every class before saving', detail: 'Flags unclear slots so you confirm the whole term in seconds.' },
      { title: 'Class alarms arm automatically', detail: 'Every saved subject gets a local offline reminder on Android.' },
    ],
  },
  {
    id: 'manual',
    rank: 2,
    label: 'Typing by hand',
    tabLabel: 'Typing by hand',
    note: 'Class by class',
    timeText: '25 min',
    minutes: 25,
    barPercent: 64,
    summary: 'Entering each subject, room, repeat rule, and phone alarm manually takes most of a study break.',
    steps: [
      { title: 'Key in every subject one by one', detail: 'Course codes, titles, rooms, and instructors typed on a phone keyboard.' },
      { title: 'Configure repeat days carefully', detail: 'Easy to mistype MWF vs. TTh schedules or skip lab time blocks.' },
      { title: 'Set separate morning alarms', detail: 'Built in another clock app with no awareness of schedule edits.' },
    ],
  },
  {
    id: 'spreadsheet',
    rank: 3,
    label: 'Building a spreadsheet',
    tabLabel: 'Spreadsheet',
    note: 'Cell by cell',
    timeText: '40 min',
    minutes: 40,
    barPercent: 100,
    summary: 'Formatting grids, merging cells, and screenshotting sheets still leaves you without reminders.',
    steps: [
      { title: 'Draw columns and merge time blocks', detail: 'Fiddly cell sizing for 90-minute labs and overlapping hours.' },
      { title: 'Pinch-to-zoom between hallways', detail: 'Static screenshots blur and quickly fall behind room changes.' },
      { title: 'Zero deadline or alarm sync', detail: 'No 15-minute class heads-up and no link to exams or tasks.' },
    ],
  },
]

const METRICS = [
  { to: 200, suffix: '', label: 'Dorm-budget recipes' },
  { to: 0, suffix: '', label: 'Ads or trackers, ever' },
  { to: 100, suffix: '%', label: 'Offline class alarms' },
] as const

/**
 * Editorial ranked comparison of term setup time.
 * Synchronizes the left segmented control with the 1-2-3 ranked leaderboard on the right.
 */
export function NumberOne() {
  const [selected, setSelected] = useState<MethodId>('dormosaur')
  const reduce = useReducedMotionConfig()
  const cardRef = useRef<HTMLDivElement>(null)
  const inView = useInView(cardRef, { once: true, amount: 0.3 })
  const active = METHODS.find(m => m.id === selected) ?? METHODS[0]
  const isDormosaur = active.id === 'dormosaur'

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, idx: number) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = e.key === 'ArrowRight' ? (idx + 1) % METHODS.length : (idx - 1 + METHODS.length) % METHODS.length
    const nextId = METHODS[next].id
    setSelected(nextId)
    document.getElementById(`setup-tab-${nextId}`)?.focus()
  }

  return (
    <section id="number-one" className="scroll-mt-24 border-b border-[#0A1710]/[0.07] bg-[#F4F7F4] px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-[1100px]">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-12">
          <div>
            <h2 className="text-balance text-[42px] leading-[1.01] tracking-[-0.025em] text-[#0A1710] sm:text-[62px]" style={serif}>
              The No.&nbsp;1 schedule tracker for <em className="text-[#0E7A4A]">dorm life.</em>
            </h2>
            <p className="mt-5 max-w-[44ch] text-pretty text-[16px] leading-[1.65] text-[#354B3E] sm:text-[17px]">
              See how Dormosaur ranks against manual entry and spreadsheets from first scan to a working week.
            </p>

            <div
              role="tablist"
              aria-label="Compare schedule setup methods"
              className="mt-7 inline-flex flex-wrap gap-1.5 rounded-[20px] bg-[#E3EBE5] p-1.5"
            >
              {METHODS.map((m, idx) => {
                const isSelected = m.id === selected
                return (
                  <button
                    key={m.id}
                    id={`setup-tab-${m.id}`}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    aria-controls="setup-comparison-panel"
                    onClick={() => setSelected(m.id)}
                    onKeyDown={e => handleKeyDown(e, idx)}
                    className={`relative min-h-[44px] cursor-pointer rounded-[14px] px-4 py-2 text-[14px] font-semibold transition-colors active:scale-[0.98] ${
                      isSelected ? 'text-[#0A1710]' : 'text-[#314A3C] hover:text-[#0A1710]'
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="setup-method-pill"
                        transition={reduce ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0 rounded-[14px] bg-white shadow-[0_2px_8px_-2px_rgba(10,23,16,0.14)]"
                      />
                    )}
                    <span className="relative z-10">{m.tabLabel}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div
            ref={cardRef}
            id="setup-comparison-panel"
            role="tabpanel"
            aria-labelledby={`setup-tab-${active.id}`}
            className="rounded-[24px] border border-[#0A1710]/[0.07] bg-white p-6 shadow-[0_20px_48px_-26px_rgba(10,23,16,0.18)] sm:p-8"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.id}
                initial={reduce ? false : { opacity: 0, y: 6, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={reduce ? undefined : { opacity: 0, y: -6, filter: 'blur(2px)' }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-[#425B4D]">
                      Rank #{active.rank} · {active.label}
                    </p>
                    <p className={`mt-0.5 text-[42px] font-bold leading-none tabular-nums tracking-[-0.04em] sm:text-[52px] ${isDormosaur ? 'text-[#0E7A4A]' : 'text-[#1D2D24]'}`}>
                      {active.timeText}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${
                      isDormosaur ? 'bg-[#E7F6EE] text-[#0B5E39]' : 'bg-[#EEF2EF] text-[#354B3E]'
                    }`}
                  >
                    {isDormosaur ? <Check className="size-4" strokeWidth={2.6} aria-hidden /> : <Clock className="size-4" strokeWidth={2.2} aria-hidden />}
                    {isDormosaur ? 'Fastest term setup' : `${active.minutes} minutes manual effort`}
                  </span>
                </div>

                <p className="mt-3 text-pretty text-[15px] leading-[1.6] text-[#384F42]">{active.summary}</p>
              </motion.div>
            </AnimatePresence>

            {/* Ranked 1-2-3 leaderboard comparison */}
            <ol className="mt-6 space-y-2 border-y border-[#0A1710]/[0.07] py-5" aria-label="Setup time ranking">
              {METHODS.map((m, i) => {
                const isCurrent = m.id === selected
                const isFirst = m.rank === 1
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(m.id)}
                      aria-pressed={isCurrent}
                      className={`group flex w-full cursor-pointer items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition-colors active:scale-[0.99] ${
                        isCurrent
                          ? isFirst
                            ? 'bg-[#EEF8F2] ring-1 ring-[#0E7A4A]/20'
                            : 'bg-[#F3F6F4] ring-1 ring-[#0A1710]/10'
                          : 'hover:bg-[#F7FAF8]'
                      }`}
                    >
                      <span
                        className={`grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-bold tabular-nums transition-colors ${
                          isFirst
                            ? 'bg-[#0E7A4A] text-white'
                            : isCurrent
                              ? 'bg-[#1D2D24] text-white'
                              : 'bg-[#E8EFEA] text-[#354B3E]'
                        }`}
                      >
                        {m.rank}
                      </span>

                      <div className="w-[144px] shrink-0 sm:w-[162px]">
                        <p className={`truncate text-[14px] leading-tight ${isCurrent || isFirst ? 'font-semibold text-[#0A1710]' : 'font-medium text-[#3F5648]'}`}>
                          {m.label}
                        </p>
                        <p className="mt-0.5 text-[12px] text-[#556C5F]">{m.note}</p>
                      </div>

                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#E8EFEA]">
                        <motion.div
                          initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
                          animate={inView || reduce ? { scaleX: 1 } : { scaleX: 0 }}
                          transition={reduce ? { duration: 0 } : { duration: 0.55, delay: 0.08 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                          style={{ width: `${m.barPercent}%`, transformOrigin: 'left center' }}
                          className={`h-full rounded-full transition-colors duration-300 ${
                            isFirst
                              ? 'bg-[#0E7A4A]'
                              : isCurrent
                                ? 'bg-[#4E685A]'
                                : 'bg-[#A6B8AE]'
                          }`}
                        />
                      </div>

                      <span className={`w-[54px] shrink-0 text-right text-[13.5px] font-bold tabular-nums ${isFirst ? 'text-[#0E7A4A]' : 'text-[#31473A]'}`}>
                        {m.timeText}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>

            <AnimatePresence mode="wait" initial={false}>
              <motion.ol
                key={active.id}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 divide-y divide-[#0A1710]/[0.06]"
              >
                {active.steps.map((step, i) => (
                  <li key={step.title} className="flex items-start gap-3 py-3 first:pt-1 last:pb-0">
                    <span
                      className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-bold tabular-nums ${
                        isDormosaur ? 'bg-[#E7F6EE] text-[#0E7A4A]' : 'bg-[#EEF2EF] text-[#354B3E]'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14.5px] font-semibold leading-snug text-[#0A1710]">{step.title}</p>
                      <p className="mt-0.5 text-pretty text-[13.5px] leading-[1.55] text-[#455C4E]">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </motion.ol>
            </AnimatePresence>
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
