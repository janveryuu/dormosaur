'use client'

import { motion, useMotionValue, useTransform } from 'framer-motion'
import { Star } from 'lucide-react'
import Image from 'next/image'
import { Counter, Reveal, ease, serif, spring } from './shared'

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.85'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E")`

/** The "No. 1 schedule tracker" highlight: spotlight, gold type, podium and a setup-time race. */
export function NumberOne() {
  const mx = useMotionValue(50)
  const my = useMotionValue(30)
  const spot = useTransform([mx, my], ([x, y]) => `radial-gradient(560px circle at ${x}% ${y}%, rgba(125,240,181,0.15), transparent 60%)`)

  return (
    <section id="number-one" className="px-4 py-16">
      <Reveal>
        <div
          onMouseMove={e => {
            const r = e.currentTarget.getBoundingClientRect()
            mx.set(((e.clientX - r.left) / r.width) * 100)
            my.set(((e.clientY - r.top) / r.height) * 100)
          }}
          className="relative mx-auto max-w-[1100px] overflow-hidden rounded-[44px] bg-[#04120B] text-white ring-1 ring-white/10"
        >
          <motion.div aria-hidden style={{ background: spot }} className="pointer-events-none absolute inset-0" />
          <div aria-hidden className="pointer-events-none absolute -right-8 -top-28 select-none text-[380px] font-black leading-none tracking-[-0.08em] text-transparent [-webkit-text-stroke:1.5px_rgba(125,240,181,0.13)] sm:text-[540px]">01</div>
          <div aria-hidden style={{ backgroundImage: GRAIN }} className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay" />

          <div className="relative px-6 pt-14 sm:px-14 sm:pt-16">
            <h2 className="max-w-[800px] text-[46px] leading-[0.98] tracking-[-0.02em] sm:text-[78px]" style={serif}>
              The{' '}
              <span className="relative inline-block">
                <motion.em
                  className="bg-[linear-gradient(110deg,#B8860B_0%,#FDE68A_25%,#FFF7D6_35%,#F5C542_50%,#B8860B_75%,#FDE68A_100%)] bg-[length:250%_100%] bg-clip-text pr-2 text-transparent"
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%'] }}
                  transition={{ duration: 4, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                >
                  No.&nbsp;1
                </motion.em>
                <Sparkle className="-right-3 -top-1" delay={0} />
                <Sparkle className="-left-3 bottom-3" delay={1.1} small />
              </span>{' '}
              schedule tracker for <em className="text-[#7DF0B5]">dorm life</em>.
            </h2>
          </div>

          <div className="relative mt-12 grid gap-5 px-6 pb-6 sm:px-14 md:grid-cols-[1fr_1.05fr] md:pb-12">
            <Podium />
            <Race />
          </div>

          <div className="relative -mx-4 mb-10 mt-2 -rotate-[1.6deg] bg-[#7DF0B5] py-3 text-[#04120B] shadow-[0_10px_40px_-10px_rgba(125,240,181,0.6)]">
            <div className="flex overflow-hidden">
              {[0, 1].map(k => (
                <motion.div key={k} aria-hidden={k === 1} className="flex shrink-0 items-center gap-8 pr-8 text-[14px] font-bold uppercase tracking-[0.14em]"
                  animate={{ x: ['0%', '-100%'] }} transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}>
                  {['5-second scan', '25+ dorm recipes', 'Zero ads', 'Works offline', 'Alarms before every class', 'Deadlines that find you'].map(t => (
                    <span key={t} className="flex items-center gap-8 whitespace-nowrap">{t}<Star className="size-4 fill-current" /></span>
                  ))}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

function Sparkle({ className, delay, small }: { className: string; delay: number; small?: boolean }) {
  return (
    <motion.svg aria-hidden viewBox="0 0 24 24" className={`absolute ${small ? 'size-4' : 'size-6'} text-[#FDE68A] ${className}`}
      animate={{ scale: [0, 1, 0], rotate: [0, 90, 180], opacity: [0, 1, 0] }} transition={{ duration: 2.2, repeat: Infinity, delay, repeatDelay: 0.8 }}>
      <path fill="currentColor" d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z" />
    </motion.svg>
  )
}

/** Dormosaur takes gold over the old ways of tracking a schedule. */
function Podium() {
  const places = [
    { rank: 2, label: 'Typing it in', sub: 'by hand', h: 118, tone: 'from-white/[0.12] to-white/[0.03]', text: 'text-white/75' },
    { rank: 1, label: 'Dormosaur', sub: 'snap & done', h: 186, tone: 'from-[#4ADE80] via-[#22B566] to-[#0E7A4A]', text: 'text-[#04120B]' },
    { rank: 3, label: 'Paper planner', sub: 'gets lost', h: 80, tone: 'from-white/[0.09] to-white/[0.02]', text: 'text-white/60' },
  ]
  return (
    <div className="relative flex h-[390px] items-end justify-center gap-3 overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent px-4 pt-6">
      <motion.div aria-hidden className="absolute left-1/2 top-4 size-60 -translate-x-1/2 rounded-full bg-[conic-gradient(from_0deg,rgba(245,197,66,0),rgba(245,197,66,0.5),rgba(125,240,181,0.4),rgba(245,197,66,0))] blur-2xl"
        animate={{ rotate: 360 }} transition={{ duration: 14, repeat: Infinity, ease: 'linear' }} />
      {places.map((p, i) => (
        <div key={p.rank} className="relative flex w-1/3 max-w-[150px] flex-col items-center">
          {p.rank === 1 && (
            <motion.div initial={{ y: 40, opacity: 0, scale: 0.7 }} whileInView={{ y: 0, opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ ...spring, delay: 0.9 }} className="relative mb-1">
              <motion.div aria-hidden className="absolute -top-6 left-1/2 -translate-x-1/2 text-[#F5C542]" animate={{ y: [0, -5, 0], rotate: [-6, 6, -6] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                <svg viewBox="0 0 32 24" className="h-7 w-9 drop-shadow-[0_4px_12px_rgba(245,197,66,0.7)]"><path fill="currentColor" d="M2 6l7 6 7-11 7 11 7-6-3 16H5z" /></svg>
              </motion.div>
              <Image src="/dormo-jumping.png" alt="Dormo, the Dormosaur mascot, celebrating first place" width={776} height={934} sizes="118px" className="h-auto w-[118px] drop-shadow-[0_18px_24px_rgba(0,0,0,0.5)]" />
            </motion.div>
          )}
          <motion.div
            initial={{ height: 0 }} whileInView={{ height: p.h }} viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 90, damping: 16, delay: 0.25 + i * 0.12 }}
            className={`relative w-full overflow-hidden rounded-t-[22px] bg-gradient-to-b ${p.tone} ${p.rank === 1 ? 'shadow-[0_-20px_60px_-10px_rgba(52,199,123,0.55)]' : 'border border-b-0 border-white/10'}`}
          >
            <div className={`flex h-full flex-col items-center pt-4 ${p.text}`}>
              <span className="text-[40px] font-black leading-none tracking-tight">{p.rank}</span>
              <span className="mt-1 text-center text-[13px] font-bold leading-tight">{p.label}</span>
              <span className="text-[11px] opacity-70">{p.sub}</span>
            </div>
            {p.rank === 1 && (
              <motion.span aria-hidden className="absolute inset-y-0 w-10 -skew-x-12 bg-white/35" initial={{ x: -60 }} animate={{ x: 220 }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.5 }} />
            )}
          </motion.div>
        </div>
      ))}
    </div>
  )
}

/** Time to set up a full term: a race Dormosaur wins before the others leave the start. */
function Race() {
  const rows = [
    { l: 'Dormosaur', t: '5 sec', w: 6, win: true },
    { l: 'Typing every class', t: '~25 min', w: 72 },
    { l: 'Building a spreadsheet', t: '~40 min', w: 100 },
  ]
  return (
    <div className="flex flex-col justify-between gap-6 rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 sm:p-8">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/45">Time to set up a full term</p>
        <div className="mt-6 space-y-5">
          {rows.map((r, i) => (
            <div key={r.l}>
              <div className="mb-2 flex items-baseline justify-between text-[15px]">
                <span className={r.win ? 'flex items-center gap-2 font-semibold text-white' : 'text-white/60'}>
                  {r.win && <span className="grid size-5 place-items-center rounded-full bg-[#F5C542] text-[10px] font-black text-[#3B2A00]">1</span>}
                  {r.l}
                </span>
                <span className={`tabular-nums ${r.win ? 'text-[24px] font-bold text-[#7DF0B5]' : 'text-white/50'}`}>{r.t}</span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }} whileInView={{ width: `${r.w}%` }} viewport={{ once: true }}
                  transition={{ duration: r.win ? 0.45 : 2.6, ease: r.win ? ease : 'linear', delay: 0.4 + i * 0.05 }}
                  className={`h-full rounded-full ${r.win ? 'bg-gradient-to-r from-[#34C77B] to-[#7DF0B5] shadow-[0_0_20px_rgba(125,240,181,0.9)]' : 'bg-white/25'}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
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
