'use client'

import {
  AnimatePresence, MotionConfig, motion, useReducedMotion, useScroll, useSpring, useTransform,
} from 'framer-motion'
import {
  Camera, Check, ChevronDown, Download, FileText, ListChecks, Pause, Play, ScanLine, type LucideIcon,
} from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { DownloadButton } from './download-button'
import { FinalCta } from './final-cta'
import { Hero } from './hero'
import { Intro } from './intro'
import { InstallSteps } from './install-steps'
import { NumberOne } from './number-one'
import { Schools } from './schools'
import { FeatureTiles, HomeScreenPhone, TermRails } from './showcase'
import { Testimonials } from './testimonials'
import { Reveal, ease, serif, spring } from './shared'


// ─── Root ──────────────────────────────────────────────────────────────────

export function Landing({ apkUrl, apkVersion }: { apkUrl: string; apkVersion: string }) {
  const [animations, setAnimations] = useState(true)
  const reduceMotion = useReducedMotion()
  const animate = animations && !reduceMotion
  const [introDone, setIntroDone] = useState(false)
  const handleIntroDone = useCallback(() => setIntroDone(true), [])
  return (
    <MotionConfig reducedMotion={animations ? 'user' : 'always'}>
      <div className="relative min-h-dvh overflow-x-clip bg-white text-[#0A1710] selection:bg-[#34C77B]/30" style={{ fontFamily: 'var(--font-geist), -apple-system, system-ui, sans-serif' }}>
        <Intro onDone={handleIntroDone} />
        <ScrollProgress />
        <Nav apkUrl={apkUrl} />
        <main>
          <Hero apkUrl={apkUrl} apkVersion={apkVersion} animate={animate} go={introDone} />
          <Schools animate={animations} />
          <NumberOne />
          <Bento />
          <Scanner />
          <FeatureCloud />
          <Testimonials />
          <InstallSteps />
          <Faq />
          <FinalCta apkUrl={apkUrl} apkVersion={apkVersion} />
        </main>
        <Footer apkUrl={apkUrl} />
        <AnimationToggle on={animations} onChange={setAnimations} />
      </div>
    </MotionConfig>
  )
}


function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const x = useSpring(scrollYProgress, { stiffness: 200, damping: 30 })
  return <motion.div aria-hidden style={{ scaleX: x }} className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-[#0E7A4A] via-[#34C77B] to-[#7DF0B5]" />
}

// ─── Nav: full-width, collapses into a floating glass pill on scroll ─────

function Nav({ apkUrl }: { apkUrl: string }) {
  const { scrollY } = useScroll()
  const [pill, setPill] = useState(false)
  useEffect(() => scrollY.on('change', v => setPill(v > 40)), [scrollY])
  const links = [['Features', '#features'], ['Scanner', '#scanner'], ['Reviews', '#reviews'], ['FAQ', '#faq']]
  return (
    <div className="fixed inset-x-0 top-3 z-50 flex justify-center px-4">
      <motion.nav
        layout
        transition={spring}
        className={`flex w-full items-center gap-6 rounded-full border transition-colors duration-300 ${
          pill ? 'max-w-[680px] border-black/[0.07] bg-white/75 py-2 pl-3 pr-2 shadow-[0_10px_40px_-12px_rgba(10,23,16,0.25)] backdrop-blur-xl' : 'max-w-[1100px] border-transparent bg-transparent py-3 pl-2 pr-2'
        }`}
        aria-label="Main"
      >
        <a href="#top" className="flex items-center gap-2 font-semibold tracking-tight">
          <Image src="/dormosaur-logo.png" alt="" width={32} height={32} className="rounded-[10px]" />
          Dormosaur
        </a>
        <div className="ml-auto hidden items-center gap-1 sm:flex">
          {links.map(([label, href]) => (
            <a key={href} href={href} className="rounded-full px-3 py-1.5 text-sm text-black/60 transition-colors hover:bg-black/[0.04] hover:text-black">{label}</a>
          ))}
        </div>
        <div className="ml-auto sm:ml-0"><DownloadButton apkUrl={apkUrl} size="sm" /></div>
      </motion.nav>
    </div>
  )
}

// ─── Bento ──────────────────────────────────────────────────────────────

function BentoCard({ bg, ink, title, body, children, className = '', delay = 0 }: { bg: string; ink: string; title: ReactNode; body?: string; children?: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease, delay }}
      whileHover={{ y: -6 }}
      style={{ background: bg }}
      className={`group relative flex flex-col overflow-hidden rounded-[36px] p-7 sm:p-8 ${className}`}
    >
      <h3 style={{ ...serif, color: ink }} className="text-[32px] leading-[1.05] tracking-tight sm:text-[38px]">{title}</h3>
      {body && <p style={{ color: ink }} className="mt-3 max-w-sm text-[15px] leading-relaxed opacity-75">{body}</p>}
      <div className="relative mt-6 flex-1">{children}</div>
    </motion.article>
  )
}

function Bento() {
  return (
    <section id="features" className="scroll-mt-24 px-4 py-16">
      <div className="mx-auto max-w-[1100px]">
        <Reveal className="mb-12 text-center">
          <h2 className="text-balance text-[40px] font-bold leading-tight tracking-[-0.035em] sm:text-[52px]">Know what&apos;s next.</h2>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2">
          <BentoCard bg="#FFF3B0" ink="#4A3B00" title="Plan your whole term" body="Classes, exams, assignments and meals — all lined up in one calm week view.">
            <TermRails />
          </BentoCard>
          <BentoCard bg="#D9E8FF" ink="#123A7A" title={<>Your schedule on<br />your Home Screen</>} body="See what's next, tomorrow's classes, and your whole week without opening the app." delay={0.08} className="md:row-span-2">
            <div className="pt-4"><HomeScreenPhone /></div>
          </BentoCard>
          <BentoCard bg="#FFD9EC" ink="#7A1745" title={<>Today&apos;s classes<br />and deadlines</>} delay={0.12}>
            <StackedNotes />
          </BentoCard>
          <BentoCard bg="#DCF5E7" ink="#0A4A2D" title="Alarms that never miss" body="Rings 15, 30 or 60 minutes before every class — even with no signal." className="md:col-span-2" delay={0.05}>
            <AlarmStrip />
          </BentoCard>
          <BentoCard bg="#FFE8D6" ink="#6B2F05" title="Eat well on a dorm budget" body="25+ rice-cooker, kettle and microwave recipes. Plan the week, auto-build the grocery list." delay={0.08}>
            <RecipeFan />
          </BentoCard>
          <BentoCard bg="#ECE6FF" ink="#3E1D8F" title="Reminders before it's due" body="Exams, quizzes and projects sorted by when. Tick them off with a satisfying pop." delay={0.14}>
            <Notification />
          </BentoCard>
        </div>
      </div>
    </section>
  )
}


function StackedNotes() {
  const notes = [
    { t: '8:30 AM', c: 'Calculus I', r: 'Sci 204', bg: '#FFE0CC', rot: -6 },
    { t: '10:15 AM', c: 'Chemistry', r: 'Lab B-12', bg: '#C9F2EC', rot: -3 },
    { t: '1:00 PM', c: 'Programming', r: 'Tech 118', bg: '#DCD3FF', rot: -5 },
  ]
  return (
    <div className="relative h-[230px]">
      {notes.map((n, i) => (
        <motion.div key={n.c} style={{ background: n.bg, rotate: n.rot, top: i * 56 }} initial={{ x: -40, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} transition={{ ...spring, delay: 0.15 + i * 0.1 }}
          whileHover={{ rotate: 0, x: 8 }} className="absolute left-0 flex w-[62%] gap-4 rounded-2xl px-4 py-3 shadow-[0_12px_30px_-14px_rgba(0,0,0,0.35)]">
          <span className="text-[13px] font-semibold">{n.t}</span><span className="text-[13px]"><b>{n.c}</b><br /><span className="opacity-60">{n.r}</span></span>
        </motion.div>
      ))}
      <motion.div initial={{ rotate: 14, scale: 0.8, opacity: 0 }} whileInView={{ rotate: 5, scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ ...spring, delay: 0.5 }}
        className="absolute right-0 top-2 w-[42%] rounded-2xl border-2 border-dashed border-[#E0457B]/40 bg-white p-4 text-[#B0124F] shadow-lg">
        <p className="text-xs font-semibold">Due this week</p>
        <p className="mt-2 text-[26px] font-bold leading-none">3 tasks</p>
        <p className="mt-1 text-[22px] font-bold leading-none">1 exam</p>
      </motion.div>
    </div>
  )
}

function AlarmStrip() {
  const items = [['7:45', 'MATH 101', 'in 45 min', true], ['9:45', 'CHEM 120', '30 min before', true], ['12:30', 'CS 150', '30 min before', true], ['2:30', 'PSY 110', 'off', false]] as const
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {items.map(([t, c, s, on], i) => (
        <motion.div key={c} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease, delay: 0.1 + i * 0.08 }}
          className="flex items-center justify-between rounded-3xl bg-white p-4 shadow-sm">
          <div>
            <p className={`text-[30px] font-light tabular-nums tracking-tight ${on ? '' : 'text-black/30'}`}>{t}</p>
            <p className="text-xs text-black/50">{c} · {s}</p>
          </div>
          <Toggle initial={on} />
        </motion.div>
      ))}
    </div>
  )
}

function Toggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial)
  return (
    <button type="button" role="switch" aria-checked={on} aria-label="Alarm" onClick={() => setOn(!on)}
      className={`relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors ${on ? 'bg-[#0E7A4A]' : 'bg-black/15'}`}>
      <motion.span layout transition={spring} className={`absolute top-[3px] size-6 rounded-full bg-white shadow ${on ? 'right-[3px]' : 'left-[3px]'}`} />
    </button>
  )
}

function RecipeFan() {
  const r = ['/recipes/chicken-tinola-soup.jpg', '/recipes/champorado-chocolate-rice.jpg', '/recipes/corned-beef-rice-bowl.jpg']
  return (
    <div className="relative flex h-[200px] items-end justify-center">
      {r.map((src, i) => (
        <motion.div key={src} initial={{ rotate: 0, y: 30, opacity: 0 }} whileInView={{ rotate: (i - 1) * 12, y: i === 1 ? -10 : 10, opacity: 1 }} viewport={{ once: true }} transition={{ ...spring, delay: 0.1 + i * 0.08 }}
          whileHover={{ y: -24, rotate: 0, zIndex: 10 }} style={{ zIndex: i === 1 ? 2 : 1 }} className="relative -mx-6 h-[180px] w-[140px] overflow-hidden rounded-3xl border-4 border-white bg-white shadow-xl">
          <Image src={src} alt="" fill sizes="140px" className="object-cover" />
        </motion.div>
      ))}
      <Image src="/chef-dormosaur.png" alt="" width={1055} height={1187} sizes="90px" className="absolute -bottom-2 right-0 h-auto w-[90px] drop-shadow-lg" />
    </div>
  )
}

function Notification() {
  return (
    <div className="relative pt-4">
      {[2, 1, 0].map(i => (
        <motion.div key={i} initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: i ? 0.5 / i : 1, y: i * 10 }} viewport={{ once: true }} transition={{ ...spring, delay: 0.2 + (2 - i) * 0.1 }}
          style={{ scale: 1 - i * 0.05, zIndex: 3 - i }} className={`${i ? 'absolute inset-x-0 top-4' : 'relative'} flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-lg`}>
          <Image src="/dormosaur-logo.png" alt="" width={40} height={40} className="rounded-xl" />
          <div className="min-w-0 flex-1">
            <div className="flex justify-between text-sm"><b>Exam on Friday</b><span className="text-xs text-black/40">now</span></div>
            <p className="truncate text-[13px] text-[#3E1D8F]/80">PSY 110 midterm at 9:00 AM · West Wing 22</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Scanner demo (main feature) ──────────────────────────────────────────

function Scanner() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const p = useTransform(scrollYProgress, [0.2, 0.55], [0, 1])
  const laser = useTransform(p, [0, 1], ['0%', '100%'])
  const messyOpacity = useTransform(p, [0.4, 0.85], [1, 0.15])
  const cleanOpacity = useTransform(p, [0.5, 1], [0, 1])
  const cleanY = useTransform(p, [0.5, 1], [30, 0])
  return (
    <section id="scanner" ref={ref} className="scroll-mt-24 px-4 py-20">
      <div className="mx-auto grid max-w-[1100px] items-center gap-14 md:grid-cols-2">
        <div>
          <Reveal>
            <h2 className="text-[40px] font-bold leading-[1.05] tracking-[-0.035em] sm:text-[54px]">Scan your schedule.<br /><span className="text-[#0E7A4A]">See your week.</span></h2>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-black/60">Registration forms, portal screenshots, blurry printouts, PDFs or pasted text. Dormosaur reads subjects, rooms, days and times, then lays out your week in seconds.</p>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {([[Camera, 'Take a photo'], [ScanLine, 'Screenshot'], [FileText, 'PDF or image'], [ListChecks, 'Paste text']] as [LucideIcon, string][]).map(([Icon, l], i) => (
              <Reveal key={l} delay={0.1 + i * 0.06}>
                <div className={`flex items-center gap-3 rounded-2xl p-4 ${i === 0 ? 'bg-[#0E7A4A] text-white' : 'bg-[#F4F6F4]'}`}>
                  <Icon className={`size-5 ${i === 0 ? '' : 'text-[#0E7A4A]'}`} /> <span className="font-semibold">{l}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="relative mx-auto h-[520px] w-full max-w-[420px]">
          <div className="absolute inset-0 overflow-hidden rounded-[36px] bg-[#04110A] p-6 shadow-[0_40px_80px_-30px_rgba(4,17,10,0.8)]">
            {/* messy input */}
            <motion.div style={{ opacity: messyOpacity }} className="absolute inset-6 rotate-[-2deg] rounded-xl bg-[#F7F3E8] p-4 font-mono text-[11px] leading-5 text-black/70">
              <p className="font-bold">STUDENT REG FORM — 1ST SEM</p>
              <p>MATH101  CALC I   MWF 0830-0950 SCI204</p>
              <p>CHEM120 GEN CHEM  MW  1015-1200 LAB B12</p>
              <p className="line-through">ENG 205  MOD LIT TTH 9-1020 HUM310</p>
              <p>ENG205  MOD LIT  TTH 0900-1020 HUM 310</p>
              <p>CS150   PROG     TTHF 1300-1440 TECH118</p>
              <p>PSY110  PSYCH    MFS 1500-1620 WW22</p>
              <p className="mt-3 text-black/40">units: 17 · adviser: ____ · OR#: 00213</p>
              <div className="absolute bottom-6 right-6 rotate-12 rounded border-2 border-red-500/60 px-2 py-1 text-xs font-bold text-red-500/70">ENROLLED</div>
            </motion.div>
            {/* clean output */}
            <motion.div style={{ opacity: cleanOpacity, y: cleanY }} className="absolute inset-6 space-y-2.5">
              {[['MATH 101', 'Mon Wed Fri · 8:30 AM', '#E6F0FF', '#3B82F6'], ['CHEM 120', 'Mon Wed · 10:15 AM', '#E3F6EC', '#16A36A'], ['ENG 205', 'Tue Thu · 9:00 AM', '#FDEAF3', '#E0457B'], ['CS 150', 'Tue Thu Fri · 1:00 PM', '#FFF1E2', '#F08A24'], ['PSY 110', 'Mon Fri Sat · 3:00 PM', '#EFEAFE', '#8B5CF6']].map(([c, d, bg, bar]) => (
                <div key={c} style={{ background: bg }} className="flex items-center gap-3 rounded-2xl p-3.5">
                  <span style={{ background: bar }} className="h-9 w-1 rounded-full" />
                  <div className="flex-1"><p className="text-[15px] font-bold">{c}</p><p className="text-xs opacity-60">{d}</p></div>
                  <span style={{ background: bar }} className="grid size-6 place-items-center rounded-full text-white"><Check className="size-3.5" strokeWidth={3} /></span>
                </div>
              ))}
              <p className="pt-2 text-center text-sm font-semibold text-[#7DF0B5]">5 classes found · alarms set</p>
            </motion.div>
            {/* laser */}
            <motion.div style={{ top: laser }} className="pointer-events-none absolute inset-x-0 -mt-16 h-16 bg-gradient-to-b from-transparent via-[#3DD68C]/25 to-[#7DF0B5]/70">
              <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[#B7FFD8] shadow-[0_0_18px_4px_#3DD68C]" />
            </motion.div>
            {['left-3 top-3 border-l-[3px] border-t-[3px]', 'right-3 top-3 border-r-[3px] border-t-[3px]', 'bottom-3 left-3 border-b-[3px] border-l-[3px]', 'bottom-3 right-3 border-b-[3px] border-r-[3px]'].map(k => (
              <span key={k} className={`absolute size-7 rounded-md border-[#7DF0B5] ${k}`} />
            ))}
          </div>
          <Image src="/mascots/dormosaur-thinking.png" alt="" width={130} height={130} className="absolute -bottom-10 -right-6 drop-shadow-xl" />
        </div>
      </div>
    </section>
  )
}

// ─── Feature cloud ────────────────────────────────────────────────────────

function FeatureCloud() {
  return (
    <section className="px-4 py-20 text-center">
      <Reveal>
        <h2 className="text-[40px] leading-[1.05] tracking-tight sm:text-[56px]" style={serif}>A class schedule<br /><em className="text-[#0E7A4A]">and dorm life planner</em> in one app</h2>
      </Reveal>
      <FeatureTiles />
    </section>
  )
}

// ─── Testimonials ────────────────────────────────────────────────────────


// ─── FAQ ─────────────────────────────────────────────────────────────────

const faqs = [
  ['Can I import my class schedule from a photo?', 'Yes. Take a photo, pick a screenshot, choose a PDF, or paste text. Dormosaur reads subjects, rooms, days and times, and you review everything before saving.'],
  ['Is Dormosaur free?', 'Yes. Dormosaur is free to download and has zero ads.'],
  ['Why is it an APK and not on the Play Store?', 'We ship the Android app directly while we prepare store listings. The APK is signed and the same build we use ourselves.'],
  ['Does it work offline?', 'Your schedule, alarms and tasks live on your phone. Class alarms ring even with no signal. Scanning needs a connection.'],
  ['Will it remind me before class?', 'Yes. Each class gets an alarm 15, 30 or 60 minutes before it starts. You can turn any of them off.'],
  ['Does it have home screen widgets?', 'You can save a schedule wallpaper for your home or lock screen today. Live widgets are coming in a future update.'],
  ['Is my data private?', 'Your data is tied to your account and never sold or shown to advertisers. There are no ads at all.'],
  ['Is there an iPhone version?', 'iPhone is on the roadmap. For now, Dormosaur is available for Android.'],
]

function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="scroll-mt-24 px-4 py-20">
      <div className="mx-auto grid max-w-[1100px] gap-10 md:grid-cols-[1fr_1.6fr]">
        <Reveal>
          <h2 className="text-[40px] leading-[1.05] tracking-tight sm:text-[52px]" style={serif}>Frequently asked<br /><em className="text-[#0E7A4A]">questions</em></h2>
          <Image src="/supportive-dormosaur.png" alt="" width={1036} height={1149} sizes="150px" className="mt-6 hidden h-auto w-[150px] md:block" />
        </Reveal>
        <div className="divide-y divide-black/[0.07]">
          {faqs.map(([q, a], i) => {
            const on = open === i
            return (
              <div key={q}>
                <button type="button" onClick={() => setOpen(on ? null : i)} aria-expanded={on} className="flex w-full items-center gap-4 py-5 text-left text-[17px] font-medium">
                  <span className="flex-1">{q}</span>
                  <motion.span animate={{ rotate: on ? 180 : 0 }} transition={spring} className={`grid size-8 shrink-0 place-items-center rounded-full ${on ? 'bg-[#0E7A4A] text-white' : 'bg-black/[0.05]'}`}><ChevronDown className="size-4" /></motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease }} className="overflow-hidden">
                      <p className="pb-5 pr-12 text-black/60">{a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA + footer ─────────────────────────────────────────────────────


const footerGroups = [
  { title: 'Explore', links: [['Features', '#features'], ['Schedule scanner', '#scanner'], ['Schools', '#marquee'], ['Reviews', '#reviews']] },
  { title: 'Get started', links: [['Installation guide', '#install'], ['Frequently asked questions', '#faq']] },
] as const

function Footer({ apkUrl }: { apkUrl: string }) {
  const linkStyle = 'inline-flex min-h-11 items-center rounded-sm text-[#D5E1D6] underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A3DCB8]'
  return (
    <footer className="relative isolate overflow-clip bg-[#0D2018] px-4 text-[#F0F6EE] sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[140px] right-[-72px] -z-10 size-[370px] bg-[#8CB79A]/10 [mask:url('/dormo-jumping.png')_center/contain_no-repeat] sm:-bottom-[172px] sm:right-[4%] sm:size-[520px]"
      />
      <div className="mx-auto max-w-[1100px]">
        <div className="grid gap-9 pb-10 pt-12 sm:pb-14 sm:pt-16 md:grid-cols-[1.65fr_1fr_1fr]">
          <div>
            <a href="#top" className="inline-flex min-h-11 items-center gap-3 rounded-md text-xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A3DCB8]">
              <Image src="/dormosaur-logo.png" alt="" width={40} height={40} className="rounded-xl" />
              Dormosaur
            </a>
            <p className="mt-4 max-w-[27ch] text-[17px] leading-relaxed text-[#B8CCBD]">Your schedule, deadlines, and dorm meals in one place.</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-4 md:col-span-2 md:gap-8">
            {footerGroups.map(({ title, links }) => (
              <div key={title}>
                <h2 className="mb-2 text-sm font-semibold text-[#A3DCB8]">{title}</h2>
                <ul className="text-sm">
                  {links.map(([label, href]) => (
                    <li key={href}><a href={href} className={linkStyle}>{label}</a></li>
                  ))}
                  {title === 'Get started' && <li><a href={apkUrl} download className={linkStyle}>Download for Android <Download aria-hidden className="ml-2 size-3.5 shrink-0" /></a></li>}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="flex min-h-28 flex-wrap content-start items-center gap-x-5 gap-y-2 border-t border-white/15 py-5 pr-24 text-sm text-[#B8CCBD] sm:min-h-24 sm:items-start">
          <p>© {new Date().getFullYear()} Dormosaur</p>
          <p>Free for Android</p>
        </div>
      </div>
    </footer>
  )
}
function AnimationToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} aria-pressed={on}
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-4 py-2.5 text-sm shadow-lg backdrop-blur-xl transition-transform hover:-translate-y-0.5">
      {on ? <Pause className="size-4" /> : <Play className="size-4" />} Animations <span className={on ? 'font-semibold text-[#0E7A4A]' : 'text-black/40'}>{on ? 'On' : 'Off'}</span>
    </button>
  )
}

