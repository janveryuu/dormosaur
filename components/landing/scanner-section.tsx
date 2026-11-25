'use client'

import { AnimatePresence, motion, useInView, useReducedMotionConfig } from 'framer-motion'
import { Camera, Check, FileText, ListChecks, RotateCcw, ScanLine, type LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Reveal } from './shared'

type SourceId = 'screenshot' | 'pdf' | 'photo' | 'text'
type StagePhase = 'source' | 'scanning' | 'result'

type SourceMode = {
  id: SourceId
  label: string
  hint: string
  fileName: string
  icon: LucideIcon
}

const SOURCE_MODES: SourceMode[] = [
  { id: 'screenshot', label: 'Screenshot', hint: 'Student portal table', fileName: 'portal-schedule.png', icon: ScanLine },
  { id: 'pdf', label: 'PDF or image', hint: 'Registration form PDF', fileName: 'COR_1stSem.pdf', icon: FileText },
  { id: 'photo', label: 'Take a photo', hint: 'Printed enrollment slip', fileName: 'enrollment-slip.jpg', icon: Camera },
  { id: 'text', label: 'Paste text', hint: 'Copied class list', fileName: 'pasted-schedule.txt', icon: ListChecks },
]

type ParsedClass = {
  code: string
  title: string
  schedule: string
  room: string
  bg: string
  badgeBg: string
  ink: string
}

const PARSED_CLASSES: ParsedClass[] = [
  { code: 'FILI 102', title: 'Filipino sa Iba’t-ibang Disiplina', schedule: 'Tue · 8:00 AM', room: 'RM 202 (CICS)', bg: '#FDECF1', badgeBg: '#F6CEDB', ink: '#7A193B' },
  { code: 'CPE 414', title: 'Microprocessor Systems', schedule: 'Wed · 8:00 AM', room: 'RM 202 (CICS)', bg: '#E7F6EE', badgeBg: '#C4EBD6', ink: '#0A5735' },
  { code: 'CPE 415', title: 'Introduction to HDL', schedule: 'Tue · 10:00 AM', room: 'COMPLAB 3', bg: '#EBF2FF', badgeBg: '#CEE0FF', ink: '#16468A' },
  { code: 'CPE 410', title: 'Logic Circuits & Design', schedule: 'Thu · 8:00 AM', room: 'ONLINE', bg: '#FFF4E0', badgeBg: '#FDE0AE', ink: '#7C4305' },
  { code: 'ENGG 416', title: 'Engineering Management', schedule: 'Fri · 7:30 AM', room: 'ONLINE', bg: '#EFF5F2', badgeBg: '#D4E6DC', ink: '#173E2D' },
]

/**
 * Interactive 4-mode schedule scanner showcase.
 * Lets visitors click any input format, watch a crisp scan sweep, or toggle Source vs. Result freely.
 */
export function ScannerSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.35 })
  const reduce = useReducedMotionConfig()

  const [mode, setMode] = useState<SourceId>('screenshot')
  const [phase, setPhase] = useState<StagePhase>('result')
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false)
  const timerRef = useRef<number | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const runScan = useCallback(() => {
    clearTimer()
    if (reduce) {
      setPhase('result')
      return
    }
    setPhase('scanning')
    timerRef.current = window.setTimeout(() => {
      setPhase('result')
      timerRef.current = null
    }, 950)
  }, [clearTimer, reduce])

  useEffect(() => {
    if (!inView || hasAutoPlayed) return
    setHasAutoPlayed(true)
    if (!reduce) runScan()
  }, [inView, hasAutoPlayed, reduce, runScan])

  useEffect(() => clearTimer, [clearTimer])

  const activeMode = SOURCE_MODES.find(m => m.id === mode) ?? SOURCE_MODES[0]

  function selectMode(nextId: SourceId) {
    setMode(nextId)
    runScan()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, idx: number) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = e.key === 'ArrowRight' ? (idx + 1) % SOURCE_MODES.length : (idx - 1 + SOURCE_MODES.length) % SOURCE_MODES.length
    const nextId = SOURCE_MODES[next].id
    selectMode(nextId)
    document.getElementById(`scanner-mode-${nextId}`)?.focus()
  }

  const showingResult = phase === 'result'

  return (
    <section id="scanner" ref={sectionRef} className="scroll-mt-24 px-4 py-20">
      <div className="mx-auto grid max-w-[1100px] items-center gap-12 lg:grid-cols-[0.96fr_1.04fr] lg:gap-14">
        <div>
          <Reveal>
            <h2 className="text-balance text-[40px] font-bold leading-[1.04] tracking-[-0.035em] text-[#0A1710] sm:text-[54px]">
              Scan your schedule.<br />
              <span className="text-[#0E7A4A]">See your week.</span>
            </h2>
            <p className="mt-5 max-w-[46ch] text-pretty text-[16.5px] leading-[1.65] text-[#354B3E] sm:text-[17px]">
              Use a registration form, portal screenshot, PDF, or pasted class list. Pick a format below to see the original and the weekly timetable it produces.
            </p>
          </Reveal>

          <div
            role="tablist"
            aria-label="Schedule input formats"
            className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2"
          >
            {SOURCE_MODES.map((m, idx) => {
              const Icon = m.icon
              const isSelected = m.id === mode
              return (
                <button
                  key={m.id}
                  id={`scanner-mode-${m.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls="scanner-stage-panel"
                  onClick={() => selectMode(m.id)}
                  onKeyDown={e => handleKeyDown(e, idx)}
                  className={`group flex min-h-[64px] cursor-pointer items-center gap-3.5 rounded-[20px] px-4 py-3 text-left transition-all duration-200 active:scale-[0.98] ${
                    isSelected
                      ? 'bg-[#0E7A4A] text-white shadow-[0_14px_28px_-16px_rgba(14,122,74,0.85)]'
                      : 'border border-[#0A1710]/[0.07] bg-[#F4F7F4] text-[#0A1710] hover:border-[#0E7A4A]/30 hover:bg-[#ECF3EE]'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`grid size-10 shrink-0 place-items-center rounded-[12px] transition-colors ${
                      isSelected ? 'bg-white/16 text-white' : 'bg-white text-[#0E7A4A] shadow-[0_1px_3px_rgba(10,23,16,0.06)]'
                    }`}
                  >
                    <Icon className="size-5" strokeWidth={2.1} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold leading-tight">{m.label}</span>
                    <span className={`mt-0.5 block truncate text-[12.5px] ${isSelected ? 'text-white/80' : 'text-[#4C6255]'}`}>
                      {m.hint}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Interactive Scanner Stage */}
        <div
          id="scanner-stage-panel"
          role="tabpanel"
          aria-labelledby={`scanner-mode-${activeMode.id}`}
          className="relative mx-auto w-full max-w-[490px] overflow-hidden rounded-[32px] border border-[#0A1710]/[0.08] bg-[#0B1E14] p-4 text-white shadow-[0_32px_64px_-28px_rgba(7,24,15,0.62)] sm:p-5"
        >
          {/* Stage top controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.09] pb-3.5">
            <div className="flex min-w-0 items-center gap-2 text-[12.5px] font-medium text-white/75">
              <activeMode.icon className="size-4 shrink-0 text-[#6BE3A4]" aria-hidden />
              <span className="truncate font-mono">{activeMode.fileName}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="inline-flex rounded-full bg-white/[0.08] p-0.5 text-[12px] font-semibold">
                <button
                  type="button"
                  onClick={() => { clearTimer(); setPhase('source') }}
                  aria-pressed={phase === 'source'}
                  className={`min-h-[30px] cursor-pointer rounded-full px-3 transition-colors ${
                    phase === 'source' ? 'bg-white text-[#0A1710]' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Source
                </button>
                <button
                  type="button"
                  onClick={() => { clearTimer(); setPhase('result') }}
                  aria-pressed={phase === 'result'}
                  className={`min-h-[30px] cursor-pointer rounded-full px-3 transition-colors ${
                    phase === 'result' ? 'bg-[#34C77B] text-[#062012]' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Result
                </button>
              </div>

              <button
                type="button"
                onClick={runScan}
                aria-label="Replay scan animation"
                title="Replay scan"
                className="grid size-[34px] cursor-pointer place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white/80 transition-colors hover:bg-white/[0.14] hover:text-white active:scale-95"
              >
                <RotateCcw className={`size-3.5 ${phase === 'scanning' ? 'animate-spin' : ''}`} aria-hidden />
              </button>
            </div>
          </div>

          {/* Main visual frame */}
          <div className="relative mt-4 min-h-[404px] overflow-hidden rounded-[22px] bg-[#07150E] p-3.5 sm:p-4">
            <AnimatePresence mode="wait" initial={false}>
              {showingResult ? (
                <motion.div
                  key="result"
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-2.5"
                >
                  {PARSED_CLASSES.map((c, idx) => (
                    <motion.div
                      key={c.code}
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.26, delay: reduce ? 0 : idx * 0.045, ease: [0.22, 1, 0.36, 1] }}
                      style={{ backgroundColor: c.bg, color: c.ink }}
                      className="flex items-center gap-3 rounded-[16px] px-3.5 py-2.5"
                    >
                      <span
                        style={{ backgroundColor: c.badgeBg, color: c.ink }}
                        className="shrink-0 rounded-[10px] px-2.5 py-1 font-mono text-[11.5px] font-bold tracking-tight"
                      >
                        {c.code}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-bold leading-snug">{c.title}</p>
                        <p className="mt-0.5 truncate text-[12px] opacity-80">
                          {c.schedule} · {c.room}
                        </p>
                      </div>
                      <span
                        aria-hidden
                        style={{ backgroundColor: c.ink }}
                        className="grid size-6 shrink-0 place-items-center rounded-full text-white"
                      >
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key={`source-${mode}`}
                  initial={reduce ? false : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="relative h-[372px] overflow-hidden rounded-[16px]"
                >
                  <SourcePreview mode={mode} />

                  {/* Crisp corner viewfinders */}
                  {['left-2.5 top-2.5 border-l-2 border-t-2', 'right-2.5 top-2.5 border-r-2 border-t-2', 'bottom-2.5 left-2.5 border-b-2 border-l-2', 'bottom-2.5 right-2.5 border-b-2 border-r-2'].map(k => (
                    <span key={k} aria-hidden className={`pointer-events-none absolute size-5 rounded-sm border-[#6BE3A4]/85 ${k}`} />
                  ))}

                  {/* Purposeful scan line sweep */}
                  {phase === 'scanning' && !reduce && (
                    <motion.div
                      aria-hidden
                      initial={{ y: -48 }}
                      animate={{ y: 380 }}
                      transition={{ duration: 0.9, ease: [0.35, 0, 0.25, 1] }}
                      className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-transparent via-[#34C77B]/20 to-[#6BE3A4]/55"
                    >
                      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[#9FF6C6]" />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom live status bar */}
          <div className="mt-3.5 flex items-center justify-between gap-3 px-1 text-[13px]" aria-live="polite">
            <p className="font-medium text-[#8DF0BA]">
              {phase === 'scanning'
                ? 'Reading subjects, rooms, and times…'
                : phase === 'source'
                  ? `Viewing raw ${activeMode.label.toLowerCase()} input`
                  : '5 classes found · Rooms & alarms ready'}
            </p>
            {phase === 'source' && (
              <button
                type="button"
                onClick={runScan}
                className="shrink-0 cursor-pointer rounded-full bg-[#34C77B] px-3.5 py-1 text-[12px] font-bold text-[#052012] transition-colors hover:bg-[#53D892] active:scale-95"
              >
                Scan now
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function SourcePreview({ mode }: { mode: SourceId }) {
  if (mode === 'text') {
    return (
      <div className="flex h-full flex-col justify-between bg-[#10241A] p-4 font-mono text-[12px] leading-6 text-[#D8EBDF]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#7BDCA8]">Clipboard paste</p>
          <div className="mt-3 space-y-1.5 text-[11.5px]">
            <p>FILI 102  TUE 8:00-10:00AM  RM 202 (CICS)</p>
            <p>CPE 414   WED 8:00-10:00AM  RM 202 (CICS)</p>
            <p>CPE 415   TUE 10:00-12:00PM COMPLAB 3</p>
            <p>CPE 410   THU 8:00-10:00AM  ONLINE</p>
            <p>ENGG 416  FRI 7:30-9:30AM   ONLINE</p>
          </div>
        </div>
        <p className="border-t border-white/10 pt-2.5 text-[11px] text-white/50">
          5 lines pasted · Ready to parse into weekly blocks
        </p>
      </div>
    )
  }

  if (mode === 'pdf') {
    return (
      <div className="flex h-full flex-col justify-between bg-[#F9F9F6] p-4 text-[#16251D]">
        <div>
          <div className="flex items-center justify-between border-b border-black/10 pb-2.5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#0E7A4A]">Certificate of Registration</p>
              <p className="text-[10.5px] text-black/55">1st Semester · Official Portal Export</p>
            </div>
            <span className="rounded bg-[#E7F5ED] px-2 py-0.5 font-mono text-[10px] font-bold text-[#0E7A4A]">PDF · 412 KB</span>
          </div>
          <div className="mt-3 space-y-2 font-mono text-[10.5px]">
            <div className="grid grid-cols-[64px_1fr_78px] gap-2 border-b border-black/10 pb-1 font-bold text-black/50">
              <span>CODE</span><span>SCHEDULE</span><span>ROOM</span>
            </div>
            {[
              ['FILI 102', 'TUE 08:00-10:00', 'RM 202'],
              ['CPE 414', 'WED 08:00-10:00', 'RM 202'],
              ['CPE 415', 'TUE 10:00-12:00', 'COMPLAB 3'],
              ['CPE 410', 'THU 08:00-10:00', 'ONLINE'],
              ['ENGG 416', 'FRI 07:30-09:30', 'ONLINE'],
            ].map(([code, sched, room]) => (
              <div key={code} className="grid grid-cols-[64px_1fr_78px] gap-2 border-b border-black/[0.06] pb-1.5 text-black/80">
                <span className="font-bold">{code}</span>
                <span>{sched}</span>
                <span className="truncate">{room}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="font-mono text-[10px] text-black/45">Total units: 19 · Sample registration form</p>
      </div>
    )
  }

  if (mode === 'photo') {
    return (
      <div className="flex h-full items-center justify-center bg-[#182920] p-4">
        <div className="relative w-full -rotate-1 rounded-[14px] bg-[#F6F1E4] p-4 font-mono text-[11px] leading-[1.6] text-[#2B261C] shadow-lg">
          <p className="font-bold">STUDENT REG FORM: 1ST SEM</p>
          <div className="mt-2 space-y-1">
            <p>FILI102  TUE 0800-1000 RM202 CICS</p>
            <p>CPE414   WED 0800-1000 RM202 CICS</p>
            <p className="line-through opacity-50">CPE415 TTH 9:00-10:30 LAB 2</p>
            <p>CPE415   TUE 1000-1200 COMPLAB 3</p>
            <p>CPE410   THU 0800-1000 ONLINE</p>
            <p>ENGG416  FRI 0730-0930 ONLINE</p>
          </div>
          <p className="mt-3 text-[10px] text-black/45">units: 19 · OR#: 00213</p>
          <span className="absolute bottom-4 right-4 rotate-6 rounded border-2 border-[#B91C1C]/60 px-2 py-0.5 text-[10px] font-bold text-[#B91C1C]/75">
            ENROLLED
          </span>
        </div>
      </div>
    )
  }

  // Default: portal screenshot
  return (
    <div className="flex h-full flex-col justify-between bg-[#F7F9F7] p-4 text-[#16251D]">
      <div>
        <div className="flex items-center justify-between border-b border-black/10 pb-2.5">
          <span className="text-[12px] font-bold text-[#0A1710]">Student Portal · My Enrolled Classes</span>
          <span className="rounded-full bg-[#E6F4EC] px-2 py-0.5 text-[10px] font-semibold text-[#0E7A4A]">1st Sem</span>
        </div>
        <div className="mt-3 space-y-2 text-[11px]">
          {[
            ['FILI 102', 'Filipino sa Iba’t-ibang Disiplina', 'Tue 8:00 AM · RM 202 (CICS)'],
            ['CPE 414', 'Microprocessor Systems', 'Wed 8:00 AM · RM 202 (CICS)'],
            ['CPE 415', 'Introduction to HDL', 'Tue 10:00 AM · COMPLAB 3'],
            ['CPE 410', 'Logic Circuits & Design', 'Thu 8:00 AM · ONLINE'],
            ['ENGG 416', 'Engineering Management', 'Fri 7:30 AM · ONLINE'],
          ].map(([code, name, meta]) => (
            <div key={code} className="rounded-[10px] border border-black/[0.07] bg-white px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-bold text-[#0E7A4A]">{code}</span>
                <span className="truncate text-[10.5px] text-black/55">{meta}</span>
              </div>
              <p className="mt-0.5 truncate text-[11.5px] font-medium text-[#16251D]">{name}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[10.5px] text-black/45">Screenshot captured from campus portal</p>
    </div>
  )
}
