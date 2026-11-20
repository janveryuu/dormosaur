'use client'

import { motion, useScroll, useSpring } from 'framer-motion'
import { Check, Download } from 'lucide-react'
import Image from 'next/image'
import { useRef, type ReactNode } from 'react'
import { Reveal, serif, spring } from './shared'

/** Three install steps, each with a live looping demo, joined by a path drawn on scroll. */
export function InstallSteps() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.7'] })
  const draw = useSpring(scrollYProgress, { stiffness: 80, damping: 24 })
  const steps: { n: string; t: string; b: string; demo: ReactNode }[] = [
    { n: '01', t: 'Download the APK', b: 'Tap the button on your Android phone. It is free.', demo: <DemoDownload /> },
    { n: '02', t: 'Allow the install', b: 'Open the file. If Android asks, allow installs from your browser.', demo: <DemoInstall /> },
    { n: '03', t: 'Scan your schedule', b: 'Sign in, snap your schedule, and your whole term is set.', demo: <DemoScan /> },
  ]
  return (
    <section id="install" ref={ref} className="relative scroll-mt-24 overflow-hidden px-4 py-24">
      <div aria-hidden className="absolute inset-x-0 top-1/2 -z-10 h-[560px] -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(52,199,123,0.13),transparent_65%)]" />
      <div className="mx-auto max-w-[1100px]">
        <Reveal>
          <h2 className="text-[44px] leading-[0.98] tracking-[-0.02em] sm:text-[68px]" style={serif}>
            Install Dormosaur<br /><em className="text-[#0E7A4A]">in three steps.</em>
          </h2>
        </Reveal>

        <div className="relative mt-16">
          <svg aria-hidden className="absolute left-[16%] top-[46px] hidden h-6 w-[68%] md:block" viewBox="0 0 100 6" preserveAspectRatio="none">
            <path d="M0 3 Q 25 0 50 3 T 100 3" fill="none" stroke="rgba(10,23,16,0.12)" strokeWidth="2" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
            <motion.path d="M0 3 Q 25 0 50 3 T 100 3" fill="none" stroke="#34C77B" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ pathLength: draw }} />
          </svg>

          <div className="grid gap-8 md:grid-cols-3 md:gap-6">
            {steps.map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}
                transition={{ ...spring, delay: i * 0.12 }} whileHover={{ y: -8 }} className="group relative">
                <div className="relative z-10 mx-auto grid size-[100px] place-items-center">
                  <motion.div aria-hidden className="absolute inset-0 rounded-full border border-dashed border-[#0E7A4A]/30" animate={{ rotate: 360 }} transition={{ duration: 18 + i * 4, repeat: Infinity, ease: 'linear' }} />
                  <div className="grid size-[74px] place-items-center rounded-full bg-white shadow-[0_20px_40px_-18px_rgba(14,122,74,0.6)] ring-1 ring-black/[0.04] transition-transform duration-500 group-hover:scale-110">
                    <span className="bg-gradient-to-br from-[#0E7A4A] to-[#34C77B] bg-clip-text text-[30px] font-black tracking-tight text-transparent">{s.n}</span>
                  </div>
                </div>
                <div className="relative -mt-9 overflow-hidden rounded-[32px] border border-black/[0.06] bg-white px-6 pb-7 pt-14 shadow-[0_30px_60px_-40px_rgba(10,23,16,0.35)] transition-shadow duration-500 group-hover:shadow-[0_40px_80px_-40px_rgba(14,122,74,0.55)]">
                  <div className="relative h-[150px] w-full overflow-hidden rounded-[22px] bg-[#F2F6F3]">{s.demo}</div>
                  <h3 className="mt-6 text-[22px] font-semibold tracking-tight">{s.t}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-black/55">{s.b}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Progress ring fills, then flips to a check. */
function DemoDownload() {
  const loop = { duration: 3.2, repeat: Infinity }
  return (
    <div className="grid h-full place-items-center">
      <div className="relative size-[92px]">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(14,122,74,0.12)" strokeWidth="8" />
          <motion.circle cx="50" cy="50" r="42" fill="none" stroke="#0E7A4A" strokeWidth="8" strokeLinecap="round"
            animate={{ pathLength: [0, 1, 1] }} transition={{ ...loop, times: [0, 0.7, 1], ease: 'easeInOut' }} />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <motion.span className="absolute" animate={{ opacity: [1, 1, 0, 0] }} transition={{ ...loop, times: [0, 0.68, 0.72, 1] }}><Download className="size-7 text-[#0E7A4A]" /></motion.span>
          <motion.span className="absolute grid size-11 place-items-center rounded-full bg-[#0E7A4A]" animate={{ opacity: [0, 0, 1, 1], scale: [0.5, 0.5, 1.1, 1] }} transition={{ ...loop, times: [0, 0.7, 0.8, 1] }}>
            <Check className="size-6 text-white" strokeWidth={3} />
          </motion.span>
        </div>
      </div>
      <span className="absolute bottom-3 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-black/60 shadow-sm">dormosaur.apk</span>
    </div>
  )
}

/** Android install sheet, with a finger tapping Install. */
function DemoInstall() {
  const loop = { duration: 2.6, repeat: Infinity }
  return (
    <div className="relative grid h-full place-items-center px-5">
      <div className="w-full max-w-[220px] rounded-2xl bg-white p-3.5 shadow-lg">
        <div className="flex items-center gap-2.5">
          <Image src="/dormosaur-logo.png" alt="" width={32} height={32} className="rounded-lg" />
          <div className="leading-tight"><p className="text-[13px] font-bold">Dormosaur</p><p className="text-[10px] text-black/50">Do you want to install this app?</p></div>
        </div>
        <div className="mt-3 flex justify-end gap-2 text-[12px] font-semibold">
          <span className="rounded-full px-3 py-1.5 text-black/45">Cancel</span>
          <motion.span className="relative overflow-hidden rounded-full bg-[#0E7A4A] px-3.5 py-1.5 text-white" animate={{ scale: [1, 1, 0.9, 1] }} transition={{ ...loop, times: [0, 0.5, 0.6, 0.7] }}>
            Install
            <motion.span aria-hidden className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50" animate={{ scale: [0, 0, 1.6], opacity: [0, 0.8, 0] }} transition={{ ...loop, times: [0, 0.55, 0.8] }} />
          </motion.span>
        </div>
      </div>
      <motion.div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 size-7 rounded-full border-2 border-black/30 bg-black/10"
        animate={{ x: [70, 58, 58, 70], y: [50, 22, 22, 50], opacity: [0, 1, 1, 0] }} transition={{ ...loop, times: [0, 0.45, 0.65, 0.85] }} />
    </div>
  )
}

/** Laser sweeps; grey rows turn into colored classes. */
function DemoScan() {
  const rows = [['#3B82F6', '#E6F0FF'], ['#16A36A', '#E3F6EC'], ['#E0457B', '#FDEAF3'], ['#F08A24', '#FFF1E2']]
  return (
    <div className="relative h-full bg-[#04110A] p-4">
      <div className="space-y-2">
        {rows.map(([bar, bg], i) => {
          const tr = { duration: 3, times: [0, 0.15 + i * 0.15, 0.2 + i * 0.15, 0.9, 1], repeat: Infinity }
          return (
            <motion.div key={bar} className="flex h-[22px] items-center gap-2 rounded-md px-2"
              animate={{ backgroundColor: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.08)', bg, bg, 'rgba(255,255,255,0.08)'] }} transition={tr}>
              <motion.span className="h-3 w-1 rounded-full" style={{ background: bar }} animate={{ opacity: [0, 0, 1, 1, 0] }} transition={tr} />
              <span className="h-1.5 rounded-full bg-black/25" style={{ width: `${40 + i * 9}%` }} />
            </motion.div>
          )
        })}
      </div>
      <motion.div aria-hidden className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent to-[#7DF0B5]/60"
        animate={{ top: ['-20%', '85%'] }} transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}>
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[#B7FFD8] shadow-[0_0_14px_3px_#3DD68C]" />
      </motion.div>
    </div>
  )
}
