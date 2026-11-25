'use client'

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import {
  BellRing, CalendarDays, CheckSquare, ChevronLeft, ChevronRight, FileText, Moon, Pause, Play,
  ScanLine, ShieldCheck, Smartphone, Sparkles, Timer, UtensilsCrossed, WifiOff, type LucideIcon,
} from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { FeatureBadgeIcon, type FeatureIconKey } from './feature-icons'
import styles from './showcase.module.css'
import { spring } from './shared'

// ─── "Plan your whole term": bespoke custom icons on smooth CSS rails ──────

const planFeatures: { icon: FeatureIconKey; title: string; detail: string }[] = [
  { icon: 'schedule', title: 'Schedule', detail: 'Classes, rooms & times' },
  { icon: 'tasks', title: 'Tasks', detail: 'Exams & due dates' },
  { icon: 'scanner', title: 'Scanner', detail: 'Photo in, week out' },
  { icon: 'alarms', title: 'Alarms', detail: '15–60 min heads-up' },
  { icon: 'kitchen', title: 'Kitchen', detail: '200 dorm meals' },
  { icon: 'copilot', title: 'Copilot', detail: 'Ask about your week' },
]

function PlanCard({ f }: { f: (typeof planFeatures)[number] }) {
  return (
    <div className="flex w-[240px] shrink-0 items-center gap-3 rounded-[20px] border border-[#4A3B00]/[0.09] bg-white/95 p-2.5 pr-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] [@media(hover:hover)]:hover:-translate-y-0.5">
      <FeatureBadgeIcon name={f.icon} size={46} />
      <div className="min-w-0">
        <p className="text-[15px] font-semibold leading-tight text-[#292515]">{f.title}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-[#6B5816]">{f.detail}</p>
      </div>
    </div>
  )
}

export function TermRails({ animate = true }: { animate?: boolean }) {
  const reduceMotion = useReducedMotion()
  const glide = animate && !reduceMotion
  const rows = [planFeatures, [...planFeatures.slice(3), ...planFeatures.slice(0, 3)]]

  if (!glide) {
    return (
      <div className="grid gap-2.5 sm:grid-cols-2">
        {planFeatures.map(f => (
          <div key={f.title} className="flex items-center gap-3 rounded-[20px] border border-[#4A3B00]/[0.09] bg-white/95 p-2.5 pr-3.5">
            <FeatureBadgeIcon name={f.icon} size={44} />
            <div className="min-w-0">
              <p className="text-[14.5px] font-semibold leading-tight text-[#292515]">{f.title}</p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-[#6B5816]">{f.detail}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`${styles.railsWrap} -mx-7 space-y-3 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] sm:-mx-8`}>
      <ul className="sr-only">{planFeatures.map(f => <li key={f.title}>{f.title}: {f.detail}</li>)}</ul>
      {rows.map((row, r) => (
        <div key={r} aria-hidden className="flex overflow-hidden py-1">
          {[0, 1].map(k => (
            <div key={k} className={r ? styles.termTrackRight : styles.termTrackLeft}>
              {row.map(f => <PlanCard key={f.title} f={f} />)}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Realistic phone showing Home Screen widgets ───────────────────────────

export function HomeScreenPhone() {
  const stageRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start end', 'center center'],
  })

  const rawRiseY = useTransform(scrollYProgress, [0, 1], [135, 0])
  const rawScale = useTransform(scrollYProgress, [0, 1], [0.94, 1])
  const rawScrollTilt = useTransform(scrollYProgress, [0, 1], [12, 0])

  const riseY = useSpring(rawRiseY, { stiffness: 120, damping: 24, mass: 0.9 })
  const riseScale = useSpring(rawScale, { stiffness: 120, damping: 24, mass: 0.9 })
  const scrollTilt = useSpring(rawScrollTilt, { stiffness: 120, damping: 24, mass: 0.9 })

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 120, damping: 18 })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), { stiffness: 120, damping: 18 })
  const glare = useTransform(mx, [-0.5, 0.5], ['-30%', '70%'])

  return (
    <div
      ref={stageRef}
      className="relative flex justify-center [perspective:1400px]"
      onMouseMove={e => {
        if (reduceMotion) return
        const r = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - r.left) / r.width - 0.5)
        my.set((e.clientY - r.top) / r.height - 0.5)
      }}
      onMouseLeave={() => { mx.set(0); my.set(0) }}
    >
      <motion.div
        style={
          reduceMotion
            ? undefined
            : { y: riseY, scale: riseScale, rotateX: scrollTilt, transformStyle: 'preserve-3d' }
        }
      >
        <motion.div
          style={reduceMotion ? undefined : { rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
          className="relative"
        >
          <span aria-hidden className="absolute -left-[3px] top-[110px] h-[26px] w-[4px] rounded-l-sm bg-gradient-to-r from-[#6b6e70] to-[#3b3d3f]" />
          <span aria-hidden className="absolute -left-[3px] top-[152px] h-[52px] w-[4px] rounded-l-sm bg-gradient-to-r from-[#6b6e70] to-[#3b3d3f]" />
          <span aria-hidden className="absolute -left-[3px] top-[214px] h-[52px] w-[4px] rounded-l-sm bg-gradient-to-r from-[#6b6e70] to-[#3b3d3f]" />
          <span aria-hidden className="absolute -right-[3px] top-[170px] h-[78px] w-[4px] rounded-r-sm bg-gradient-to-l from-[#6b6e70] to-[#3b3d3f]" />

          <div className="relative w-[300px] rounded-[58px] bg-[linear-gradient(145deg,#8d9093_0%,#4b4e51_22%,#2a2c2e_50%,#55585b_78%,#9a9da0_100%)] p-[3px] shadow-[0_60px_90px_-40px_rgba(18,58,122,0.55),0_30px_60px_-30px_rgba(0,0,0,0.6)]">
            <div className="rounded-[55px] bg-black p-[10px]">
              <div className="relative h-[565px] overflow-hidden rounded-[46px] bg-[#F6D9DF]">
                <Image
                  src="/landing/home-widgets.webp"
                  alt="Dormosaur widgets on a phone home screen: next class, classes left today, tomorrow, and this week"
                  fill
                  sizes="274px"
                  className="object-cover object-top"
                />
                <div aria-hidden className="absolute left-1/2 top-[11px] z-20 flex h-[30px] w-[100px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-3">
                  <span className="size-[9px] rounded-full bg-[#1b1f2a] ring-1 ring-[#2c3346]" />
                </div>
                <motion.div aria-hidden style={{ left: glare }} className="pointer-events-none absolute -top-1/4 z-30 h-[150%] w-[40%] rotate-[20deg] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

// ─── Feature cloud: Dual-capsule icon medallion + pill cluster ─────────────

type FeaturePill = {
  id: string
  icon: LucideIcon
  label: string
  bg: string
  fg: string
  spec: string
  line: string
}

const FEATURE_PILLS: FeaturePill[] = [
  // Row 1 (5)
  {
    id: 'schedule',
    icon: CalendarDays,
    label: 'Schedule',
    bg: '#0E7A4A',
    fg: '#FFFFFF',
    spec: 'Week & Day views',
    line: 'Every class, room number, and instructor color-coded in a calm weekly timetable.',
  },
  {
    id: 'scanner',
    icon: ScanLine,
    label: 'Scanner',
    bg: '#34C77B',
    fg: '#052414',
    spec: 'Photo · Screenshot · PDF',
    line: 'Snap your registration form or import a PDF. Dormosaur builds your week and lets you review first.',
  },
  {
    id: 'alarms',
    icon: BellRing,
    label: 'Alarms',
    bg: '#FF6363',
    fg: '#240505',
    spec: '15, 30 or 60 min lead',
    line: 'Automatic reminders before every class that fire locally even when dorm Wi-Fi drops.',
  },
  {
    id: 'tasks',
    icon: CheckSquare,
    label: 'Tasks',
    bg: '#1D64E8',
    fg: '#FFFFFF',
    spec: 'Syllabus scan ready',
    line: 'Exams, quizzes, lab reports, and projects sorted by due date with Open and Done tracking.',
  },
  {
    id: 'countdowns',
    icon: Timer,
    label: 'Countdowns',
    bg: '#FF87BA',
    fg: '#2B0818',
    spec: 'Live Up Next card',
    line: 'See at a glance how many minutes remain until your next class starts and which room to head to.',
  },
  // Row 2 (4)
  {
    id: 'widgets',
    icon: Smartphone,
    label: 'Widgets',
    bg: '#FACC15',
    fg: '#241C00',
    spec: 'Lock Screen wallpaper',
    line: 'Save a crisp timetable wallpaper sized for your Lock Screen today, with live widgets coming soon.',
  },
  {
    id: 'kitchen',
    icon: UtensilsCrossed,
    label: 'Kitchen',
    bg: '#FB923C',
    fg: '#261102',
    spec: '200 dorm recipes',
    line: 'Rice cooker, kettle, and microwave meals that turn missing ingredients into your grocery list.',
  },
  {
    id: 'copilot',
    icon: Sparkles,
    label: 'Copilot',
    bg: '#0275B8',
    fg: '#FFFFFF',
    spec: 'Ask Dormo chat',
    line: 'Ask when you have free breaks between classes, what is due this week, or what to cook tonight.',
  },
  {
    id: 'offline',
    icon: WifiOff,
    label: 'Offline',
    bg: '#0F766E',
    fg: '#FFFFFF',
    spec: 'Works without signal',
    line: 'Your timetable, tasks, recipes, and scheduled class alarms stay available with zero data.',
  },
  // Row 3 (3)
  {
    id: 'private',
    icon: ShieldCheck,
    label: 'Private',
    bg: '#1E40AF',
    fg: '#FFFFFF',
    spec: 'Zero ads or trackers',
    line: 'No ads, ever. Your schedule and deadlines stay tied to your account and are never sold.',
  },
  {
    id: 'pdf',
    icon: FileText,
    label: 'PDF import',
    bg: '#4338CA',
    fg: '#FFFFFF',
    spec: 'Up to 3 MB portal PDF',
    line: 'Drop your official school portal PDF straight in for the cleanest subject, day, and room extraction.',
  },
  {
    id: 'darkmode',
    icon: Moon,
    label: 'Dark mode',
    bg: '#12231B',
    fg: '#E9F7EE',
    spec: 'System · Light · Dark',
    line: 'Comfortable low-glare reading when checking early morning rooms or late-night deadlines.',
  },
]

/**
 * Interactive 3-row dual-capsule cluster ([Circle Icon] + [Label Pill]) with
 * keyboard navigation, pause/play control, and connected feature spotlight below.
 */
export function FeatureTiles({ animate = true }: { animate?: boolean }) {
  const [active, setActive] = useState(0)
  const [hoverPaused, setHoverPaused] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const reduceMotion = useReducedMotion()

  const running = animate && !reduceMotion && !hoverPaused && !userPaused

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      setActive(prev => (prev + 1) % FEATURE_PILLS.length)
    }, 3000)
    return () => window.clearInterval(timer)
  }, [running])

  const current = FEATURE_PILLS[active]
  const CurrentIcon = current.icon

  function stepBy(delta: number) {
    setActive(prev => (prev + delta + FEATURE_PILLS.length) % FEATURE_PILLS.length)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      stepBy(1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      stepBy(-1)
    }
  }

  return (
    <div
      className="mx-auto mt-12 max-w-[980px]"
      onMouseLeave={() => setHoverPaused(false)}
      onKeyDown={handleKeyDown}
    >
      <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3" role="group" aria-label="Dormosaur features">
        {FEATURE_PILLS.map((item, idx) => {
          const isOn = idx === active
          const Icon = item.icon
          const breakAfter = idx === 4 || idx === 8
          return (
            <span key={item.id} className="contents">
              <button
                type="button"
                aria-pressed={isOn}
                aria-label={`${item.label} — ${item.spec}`}
                onMouseEnter={() => { setHoverPaused(true); setActive(idx) }}
                onFocus={() => { setHoverPaused(true); setActive(idx) }}
                onBlur={() => setHoverPaused(false)}
                onClick={() => setActive(idx)}
                className={`group inline-flex min-h-[44px] cursor-pointer items-center gap-[3px] rounded-full p-[3px] transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97] ${
                  isOn
                    ? '-translate-y-0.5 scale-[1.03] opacity-100 ring-2 ring-[#0A1710]'
                    : 'opacity-85 ring-2 ring-transparent [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:opacity-100'
                }`}
              >
                <span
                  aria-hidden
                  style={{ backgroundColor: item.bg, color: item.fg }}
                  className="grid size-11 shrink-0 place-items-center rounded-full lg:size-12"
                >
                  <Icon className="size-[19px] lg:size-[21px]" strokeWidth={2.2} />
                </span>
                <span
                  style={{ backgroundColor: item.bg, color: item.fg }}
                  className="inline-flex h-11 items-center whitespace-nowrap rounded-full px-4 text-[14.5px] font-bold tracking-[-0.015em] lg:h-12 lg:px-5 lg:text-[16px]"
                >
                  {item.label}
                </span>
              </button>
              {breakAfter && <span aria-hidden className="hidden lg:block lg:h-0 lg:basis-full" />}
            </span>
          )
        })}
      </div>

      {/* Connected spotlight stage */}
      <div
        className="relative mx-auto mt-10 max-w-[660px] overflow-hidden rounded-[24px] border border-[#0A1710]/[0.08] bg-[#F4F7F4] p-5 text-left sm:p-6"
        aria-live="polite"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            initial={reduceMotion ? false : { opacity: 0, y: 5, filter: 'blur(2px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -5, filter: 'blur(2px)' }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                style={{ backgroundColor: current.bg, color: current.fg }}
                className="grid size-12 shrink-0 place-items-center rounded-full"
              >
                <CurrentIcon className="size-[22px]" strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-[19px] font-bold tracking-[-0.015em] text-[#0A1710]">{current.label}</h3>
                  <span className="rounded-full border border-[#0A1710]/[0.08] bg-white px-3 py-0.5 text-[12.5px] font-semibold text-[#173526]">
                    {current.spec}
                  </span>
                </div>
                <p className="mt-1.5 max-w-[50ch] text-pretty text-[15px] leading-[1.62] text-[#2F473A]">
                  {current.line}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-2 pt-1 sm:justify-end">
              <span className="mr-1 text-[13px] font-semibold tabular-nums text-[#3E574A]">
                {active + 1} / {FEATURE_PILLS.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => stepBy(-1)}
                  aria-label="Previous feature"
                  className="grid size-11 cursor-pointer place-items-center rounded-full border border-[#0A1710]/[0.1] bg-white text-[#0A1710] transition-colors hover:border-[#0A1710]/25 active:scale-[0.95]"
                >
                  <ChevronLeft className="size-4" strokeWidth={2.3} />
                </button>
                <button
                  type="button"
                  onClick={() => setUserPaused(p => !p)}
                  aria-label={userPaused ? 'Resume feature cycle' : 'Pause feature cycle'}
                  aria-pressed={userPaused}
                  className="grid size-11 cursor-pointer place-items-center rounded-full border border-[#0A1710]/[0.1] bg-white text-[#0A1710] transition-colors hover:border-[#0A1710]/25 active:scale-[0.95]"
                >
                  {userPaused || !animate || reduceMotion ? <Play className="size-3.5" strokeWidth={2.4} /> : <Pause className="size-3.5" strokeWidth={2.4} />}
                </button>
                <button
                  type="button"
                  onClick={() => stepBy(1)}
                  aria-label="Next feature"
                  className="grid size-11 cursor-pointer place-items-center rounded-full border border-[#0A1710]/[0.1] bg-white text-[#0A1710] transition-colors hover:border-[#0A1710]/25 active:scale-[0.95]"
                >
                  <ChevronRight className="size-4" strokeWidth={2.3} />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Subtle progress rail along the bottom edge */}
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-[#0A1710]/[0.06]">
          {running && (
            <motion.div
              key={`${active}-${userPaused}`}
              style={{ backgroundColor: current.bg }}
              className="h-full origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 3, ease: 'linear' }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
