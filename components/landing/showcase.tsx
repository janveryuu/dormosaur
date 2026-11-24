'use client'

import {
  BellRingingIcon, CalendarDotsIcon, ChatCircleDotsIcon, CookingPotIcon, DeviceMobileIcon, FilePdfIcon,
  ListChecksIcon, MoonStarsIcon, ScanIcon, ShieldCheckIcon, SparkleIcon, TimerIcon, WifiSlashIcon,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { spring } from './shared'

// ─── App-icon tile: gradient squircle, top sheen, soft colored shadow ───────

export function AppIcon({ icon: Icon, from, to, size = 44 }: { icon: PhosphorIcon; from: string; to: string; size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, background: `linear-gradient(145deg, ${from}, ${to})`, boxShadow: `0 8px 18px -8px ${to}, inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 6px rgba(0,0,0,0.12)` }}
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-[30%]"
    >
      <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
      <Icon weight="fill" color="#fff" style={{ width: size * 0.52, height: size * 0.52 }} className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]" />
    </span>
  )
}

// ─── "Plan your whole term": two rails gliding in opposite directions ──────

const planFeatures: { icon: PhosphorIcon; title: string; detail: string; from: string; to: string }[] = [
  { icon: CalendarDotsIcon, title: 'Schedule', detail: 'Every class, room and time', from: '#60A5FA', to: '#2563EB' },
  { icon: ListChecksIcon, title: 'Tasks', detail: 'Due dates and exams', from: '#A78BFA', to: '#7C3AED' },
  { icon: ScanIcon, title: 'Scanner', detail: 'Photo in, week out', from: '#4ADE80', to: '#0E7A4A' },
  { icon: BellRingingIcon, title: 'Alarms', detail: 'A heads-up before class', from: '#FB923C', to: '#EA580C' },
  { icon: CookingPotIcon, title: 'Kitchen', detail: 'Cheap dorm meals', from: '#FBBF24', to: '#D97706' },
  { icon: ChatCircleDotsIcon, title: 'Copilot', detail: 'Ask about your week', from: '#F472B6', to: '#DB2777' },
]

function PlanCard({ f }: { f: (typeof planFeatures)[number] }) {
  return (
    <div className="flex w-[218px] shrink-0 items-center gap-3 rounded-[20px] bg-white/85 p-3 pr-4 shadow-[0_10px_24px_-18px_rgba(74,59,0,0.6)] ring-1 ring-[#4A3B00]/[0.06] backdrop-blur">
      <AppIcon icon={f.icon} from={f.from} to={f.to} />
      <div className="min-w-0">
        <p className="text-[15px] font-semibold leading-tight text-[#292515]">{f.title}</p>
        <p className="mt-0.5 truncate text-[12.5px] text-[#6B5C2E]">{f.detail}</p>
      </div>
    </div>
  )
}

export function TermRails() {
  const rows = [planFeatures, [...planFeatures.slice(3), ...planFeatures.slice(0, 3)]]
  return (
    <div className="group/rails -mx-7 space-y-3 [mask-image:linear-gradient(to_right,transparent,black_9%,black_91%,transparent)] sm:-mx-8">
      <ul className="sr-only">{planFeatures.map(f => <li key={f.title}>{f.title}: {f.detail}</li>)}</ul>
      {rows.map((row, r) => (
        <div key={r} aria-hidden className="flex overflow-hidden py-1">
          {[0, 1].map(k => (
            <motion.div key={k} className="flex shrink-0 gap-3 pr-3"
              animate={{ x: r ? ['-100%', '0%'] : ['0%', '-100%'] }} transition={{ duration: 26 + r * 4, repeat: Infinity, ease: 'linear' }}>
              {row.map(f => <PlanCard key={f.title} f={f} />)}
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Realistic phone showing Home Screen widgets ───────────────────────────

export function HomeScreenPhone() {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 120, damping: 18 })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), { stiffness: 120, damping: 18 })
  const glare = useTransform(mx, [-0.5, 0.5], ['-30%', '70%'])

  return (
    <div
      className="relative flex justify-center [perspective:1400px]"
      onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5) }}
      onMouseLeave={() => { mx.set(0); my.set(0) }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0, rotateX: 18 }} whileInView={{ y: 0, opacity: 1, rotateX: 0 }} viewport={{ once: true }} transition={{ ...spring, delay: 0.1 }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        className="relative"
      >
        {/* side buttons */}
        <span aria-hidden className="absolute -left-[3px] top-[110px] h-[26px] w-[4px] rounded-l-sm bg-gradient-to-r from-[#6b6e70] to-[#3b3d3f]" />
        <span aria-hidden className="absolute -left-[3px] top-[152px] h-[52px] w-[4px] rounded-l-sm bg-gradient-to-r from-[#6b6e70] to-[#3b3d3f]" />
        <span aria-hidden className="absolute -left-[3px] top-[214px] h-[52px] w-[4px] rounded-l-sm bg-gradient-to-r from-[#6b6e70] to-[#3b3d3f]" />
        <span aria-hidden className="absolute -right-[3px] top-[170px] h-[78px] w-[4px] rounded-r-sm bg-gradient-to-l from-[#6b6e70] to-[#3b3d3f]" />

        {/* titanium frame */}
        <div className="relative w-[300px] rounded-[58px] bg-[linear-gradient(145deg,#8d9093_0%,#4b4e51_22%,#2a2c2e_50%,#55585b_78%,#9a9da0_100%)] p-[3px] shadow-[0_60px_90px_-40px_rgba(18,58,122,0.55),0_30px_60px_-30px_rgba(0,0,0,0.6)]">
          <div className="rounded-[55px] bg-black p-[10px]">
            {/* screen */}
            <div className="relative h-[565px] overflow-hidden rounded-[46px] bg-[#F6D9DF]">
              <Image
                src="/landing/home-widgets.webp"
                alt="Dormosaur widgets on a phone home screen: next class, classes left today, tomorrow, and this week"
                fill
                sizes="274px"
                className="object-cover object-top"
              />
              {/* dynamic island */}
              <div aria-hidden className="absolute left-1/2 top-[11px] z-20 flex h-[30px] w-[100px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-3">
                <span className="size-[9px] rounded-full bg-[#1b1f2a] ring-1 ring-[#2c3346]" />
              </div>
              {/* glass glare that follows tilt */}
              <motion.div aria-hidden style={{ left: glare }} className="pointer-events-none absolute -top-1/4 z-30 h-[150%] w-[40%] rotate-[20deg] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Feature tiles (replaces the pill cloud) ───────────────────────────────

const tiles: { icon: PhosphorIcon; label: string; from: string; to: string; line: string }[] = [
  { icon: CalendarDotsIcon, label: 'Schedule', from: '#60A5FA', to: '#2563EB', line: 'Every class, room and instructor in one clean week view.' },
  { icon: ScanIcon, label: 'Scanner', from: '#4ADE80', to: '#0E7A4A', line: 'Snap your registration form. Dormosaur builds the week for you.' },
  { icon: BellRingingIcon, label: 'Alarms', from: '#FB923C', to: '#EA580C', line: 'A heads-up 15, 30 or 60 minutes before every class.' },
  { icon: ListChecksIcon, label: 'Tasks', from: '#A78BFA', to: '#7C3AED', line: 'Exams, quizzes and projects, sorted by what is due first.' },
  { icon: TimerIcon, label: 'Countdowns', from: '#FB7185', to: '#E11D48', line: 'See exactly how long until your next class starts.' },
  { icon: DeviceMobileIcon, label: 'Widgets', from: '#38BDF8', to: '#0284C7', line: 'Your schedule as a wallpaper on your home and lock screen.' },
  { icon: CookingPotIcon, label: 'Kitchen', from: '#FBBF24', to: '#D97706', line: '25+ cheap recipes for a rice cooker, kettle or microwave.' },
  { icon: SparkleIcon, label: 'Copilot', from: '#F472B6', to: '#DB2777', line: 'Ask when you are free this week, or what to cook tonight.' },
  { icon: WifiSlashIcon, label: 'Offline', from: '#34D399', to: '#059669', line: 'Alarms and your schedule keep working with no signal.' },
  { icon: ShieldCheckIcon, label: 'Private', from: '#94A3B8', to: '#475569', line: 'No ads, ever. Your schedule stays yours.' },
  { icon: FilePdfIcon, label: 'PDF import', from: '#C084FC', to: '#9333EA', line: 'Got your schedule as a PDF? Drop it in, same result.' },
  { icon: MoonStarsIcon, label: 'Dark mode', from: '#64748B', to: '#0F172A', line: 'Easy on the eyes for late-night study sessions.' },
]

/**
 * Spotlight grid: one icon at a time lifts, glows and explains itself.
 * Auto-advances every 2.4s; hovering or focusing a tile takes over and pauses the cycle.
 */
export function FeatureTiles({ animate = true }: { animate?: boolean }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduceMotion = useReducedMotion()
  const running = animate && !reduceMotion && !paused
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setActive(a => (a + 1) % tiles.length), 2400)
    return () => clearInterval(t)
  }, [running])
  const current = tiles[active]

  return (
    <div className="mx-auto mt-12 max-w-[880px]" onMouseLeave={() => setPaused(false)}>
      <ul className="grid grid-cols-3 gap-x-4 gap-y-7 sm:grid-cols-4 md:grid-cols-6">
        {tiles.map((t, i) => {
          const on = i === active
          return (
            <motion.li key={t.label}
              initial={{ opacity: 0, y: 24, scale: 0.8 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }}
              transition={{ ...spring, delay: (i % 6) * 0.05 + Math.floor(i / 6) * 0.12 }}
              className="flex justify-center">
              <button type="button" aria-pressed={on} aria-label={`${t.label}: ${t.line}`}
                onMouseEnter={() => { setPaused(true); setActive(i) }} onFocus={() => { setPaused(true); setActive(i) }} onClick={() => setActive(i)}
                className="group flex flex-col items-center gap-2.5 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#0E7A4A]/50">
                <motion.span className="relative" animate={{ y: on ? -10 : 0, scale: on ? 1.14 : 1, rotate: on ? (i % 2 ? 4 : -4) : 0 }} transition={spring}>
                  {on && (
                    <motion.span layoutId="tile-glow" aria-hidden transition={spring}
                      style={{ background: `radial-gradient(closest-side, ${t.from}88, transparent)` }}
                      className="absolute -inset-5 -z-10 rounded-full blur-md" />
                  )}
                  <AppIcon icon={t.icon} from={t.from} to={t.to} size={68} />
                </motion.span>
                <span className={`text-[14px] font-semibold tracking-tight transition-colors ${on ? 'text-[#0A1710]' : 'text-[#1C2A21]/55'}`}>{t.label}</span>
              </button>
            </motion.li>
          )
        })}
      </ul>

      {/* caption for the spotlit feature, with a progress line while auto-playing */}
      <div className="mx-auto mt-10 flex min-h-[64px] max-w-[520px] flex-col items-center gap-3 text-center" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.p key={current.label} initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.35 }} className="text-[17px] text-[#1C2A21]">
            <span style={{ color: current.to }} className="font-semibold">{current.label}.</span> {current.line}
          </motion.p>
        </AnimatePresence>
        <div className="h-[3px] w-24 overflow-hidden rounded-full bg-black/[0.07]">
          {running && <motion.div key={active} style={{ background: current.to }} className="h-full rounded-full" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 2.4, ease: 'linear' }} />}
        </div>
      </div>
    </div>
  )
}
