'use client'

import {
  AnimatePresence, MotionConfig, motion, useReducedMotion, useScroll, useSpring,
} from 'framer-motion'
import {
  ChevronDown, Menu, Pause, Play, X,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { SiteFooter } from '@/components/site-footer'
import { AppShowcase } from './app-showcase'
import { DownloadButton } from './download-button'
import { FinalCta } from './final-cta'
import { Hero } from './hero'
import { Intro } from './intro'
import { InstallSteps } from './install-steps'
import { NumberOne } from './number-one'
import { ScannerSection } from './scanner-section'
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
        <a href="#landing-main" className="sr-only z-[70] rounded-md bg-[#0A1710] px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-3">
          Skip to content
        </a>
        <ScrollProgress />
        <Nav apkUrl={apkUrl} />
        <main id="landing-main">
          <Hero apkUrl={apkUrl} apkVersion={apkVersion} animate={animate} go={introDone} />
          <Schools animate={animations} />
          <NumberOne />
          <Bento animate={animate} />
          <ScannerSection />
          <FeatureCloud animate={animate} />
          <AppShowcase />
          <Testimonials animate={animate} />
          <InstallSteps apkUrl={apkUrl} apkVersion={apkVersion} />
          <Faq />
          <FinalCta apkUrl={apkUrl} apkVersion={apkVersion} />
        </main>
        <SiteFooter />
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
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => scrollY.on('change', v => setPill(v > 40)), [scrollY])
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])
  const links = [['Features', '#features'], ['Scanner', '#scanner'], ['Reviews', '#reviews'], ['FAQ', '#faq']]
  return (
    <div className="fixed inset-x-0 top-3 z-50 flex flex-col items-center px-4">
      <motion.nav
        layout
        transition={spring}
        className={`flex w-full items-center gap-3 sm:gap-6 rounded-full border transition-colors duration-300 ${
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
        <div className="ml-auto flex items-center gap-1.5 sm:ml-0">
          <DownloadButton apkUrl={apkUrl} size="sm" />
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="grid size-10 place-items-center rounded-full border border-black/[0.08] bg-white/80 text-black/80 sm:hidden"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </motion.nav>
      {menuOpen && (
        <div role="region" aria-label="Mobile navigation" className="mt-2 flex w-full max-w-[420px] flex-col gap-1 rounded-3xl border border-black/[0.08] bg-white/95 p-3 shadow-xl backdrop-blur-xl sm:hidden">
          {links.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-2.5 text-sm font-medium text-black/80 hover:bg-black/[0.04]">
              {label}
            </a>
          ))}
          <Link href="/docs" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-2.5 text-sm font-medium text-[#0E7A4A] hover:bg-black/[0.04]">
            Help Docs
          </Link>
        </div>
      )}
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

function Bento({ animate }: { animate: boolean }) {
  return (
    <section id="features" className="scroll-mt-24 px-4 py-16">
      <div className="mx-auto max-w-[1100px]">
        <Reveal className="mb-12 text-center">
          <h2 className="text-balance text-[40px] font-bold leading-tight tracking-[-0.035em] sm:text-[52px]">Know what&apos;s next.</h2>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2">
          <BentoCard bg="#FFF3B0" ink="#4A3B00" title="Plan your whole term" body="Classes, exams, assignments and meals — all lined up in one calm week view.">
            <TermRails animate={animate} />
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
          <BentoCard bg="#FFE8D6" ink="#6B2F05" title="Eat well on a dorm budget" body="200 rice-cooker, kettle and microwave recipes. Plan the week, auto-build the grocery list." delay={0.08}>
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

// ─── Feature cloud ────────────────────────────────────────────────────────

function FeatureCloud({ animate }: { animate: boolean }) {
  return (
    <section className="px-4 py-20 text-center">
      <Reveal>
        <h2 className="text-[40px] leading-[1.05] tracking-tight sm:text-[56px]" style={serif}>A class schedule<br /><em className="text-[#0E7A4A]">and dorm life planner</em> in one app</h2>
      </Reveal>
      <FeatureTiles animate={animate} />
    </section>
  )
}

// ─── Testimonials ────────────────────────────────────────────────────────


// ─── FAQ ─────────────────────────────────────────────────────────────────

type FaqItem = {
  q: string
  a: string
  docHref?: string
  docLabel?: string
}

const faqs: FaqItem[] = [
  {
    q: 'Can I import my class schedule from a photo?',
    a: 'Yes. You can take a photo of a printed registration form, upload a screenshot from your student portal, import an official portal PDF (up to 3 MB), or paste plain timetable text. Dormosaur reads each subject name, course code, room, instructor, days, and start/end times automatically. Anything it is unsure about is flagged on a review screen before saving, duplicate scans skip already-saved classes, and every confirmed class gets an alarm right away.',
    docHref: '/docs/import',
    docLabel: 'Read the import guide',
  },
  {
    q: 'Is Dormosaur free?',
    a: 'Yes. Dormosaur is completely free to download and has zero ads anywhere in the app. Your core class schedule, task and deadline tracker, 15-minute class alarms, today’s meal plan, and all 200 dorm-budget recipes are free, along with 1 free AI schedule scan, 1 syllabus scan, and 5 daily Ask Dormo chats. If you want unlimited scans, 100 daily Ask Dormo chats, 30 or 60 minute alarm lead times, full-week meal planning with grocery list export, and extra watermark-free wallpaper themes, Dormosaur Pro offers a 7-day free trial with no automatic renewal and affordable plans payable via GCash, Maya, MariBank, or GoTyme.',
  },
  {
    q: 'Why is it an APK and not on the Play Store?',
    a: 'We ship Dormosaur directly as a signed Android APK while store listings are finalized. It is the exact same production build we run on our own phones, compatible with Android 8 or newer. Whenever a new version releases on this site, installing the update over your existing app preserves every class, deadline, and meal plan safely because your data stays tied to your account.',
    docHref: '/docs/install',
    docLabel: 'Read the install guide',
  },
  {
    q: 'Does it work offline?',
    a: 'Yes, for everything you rely on between classes. Your weekly timetable, open deadlines, saved recipes, and class alarms are cached locally on your phone, and alarms schedule as native Android notifications so they still ring on time even with zero signal or weak dorm Wi-Fi. An internet connection is only needed when running AI scans, chatting with Ask Dormo, or syncing changes across devices.',
  },
  {
    q: 'Will it remind me before class?',
    a: 'Yes. Every class you scan or add receives an automatic reminder before it starts, showing the exact ring time and room. Free accounts ring 15 minutes ahead of class, while Dormosaur Pro lets you choose 30-minute or 60-minute lead times when you have a longer commute. You can switch any individual class alarm off without deleting the class, and our help docs include quick battery settings tips for phones that pause background apps.',
    docHref: '/docs/alarms',
    docLabel: 'Read the class alarms guide',
  },
  {
    q: 'Does it have home screen widgets?',
    a: 'Right now you can generate a crisp, customized Schedule Wallpaper sized for your Lock Screen or Home Screen in seconds, choosing between List or Timetable layouts with optional room numbers, plus sharing your week as an image or plain text. Native live Android home screen widgets (which you can already preview inside the app) are actively planned for an upcoming update.',
    docHref: '/docs/wallpaper-widgets',
    docLabel: 'See wallpaper and widgets',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. Dormosaur never displays ads and never sells or shares student timetables with advertisers or data brokers. Your classes, alarms, tasks, and meal plans are stored under your account solely so everything stays backed up if you switch phones or reinstall. When you scan a schedule image or PDF, the file is processed securely only to extract your classes or due dates.',
    docHref: '/docs/privacy',
    docLabel: 'Read privacy and data details',
  },
  {
    q: 'Is there an iPhone version?',
    a: 'Dormosaur launched Android-first to reach campus students quickly, and an iPhone (iOS) version is on our roadmap. Because your timetable, tasks, and meal plan stay synced to your Google or email account, signing in on a newer Android phone or future device restores your entire semester right away.',
  },
]

function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="scroll-mt-24 px-4 py-20">
      <div className="mx-auto grid max-w-[1100px] gap-10 md:grid-cols-[0.95fr_1.55fr] md:gap-14">
        <Reveal>
          <div className="md:sticky md:top-28">
            <h2 className="text-balance text-[40px] leading-[1.05] tracking-tight sm:text-[52px]" style={serif}>
              Frequently asked<br /><em className="text-[#0E7A4A]">questions</em>
            </h2>
            <p className="mt-4 max-w-[34ch] text-pretty text-[15.5px] leading-[1.6] text-[#35463C]">
              Everything students usually ask before installing Dormosaur and scanning their first timetable.
            </p>
            <Link
              href="/docs"
              className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-[14.5px] font-semibold text-[#0E7A4A] underline-offset-4 hover:underline"
            >
              Browse all Help Docs →
            </Link>
            <Image src="/supportive-dormosaur.png" alt="" width={1036} height={1149} sizes="150px" className="mt-6 hidden h-auto w-[150px] md:block" />
          </div>
        </Reveal>
        <div className="divide-y divide-black/[0.08]">
          {faqs.map((item, i) => {
            const on = open === i
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(on ? null : i)}
                  aria-expanded={on}
                  className="flex min-h-[60px] w-full cursor-pointer items-center gap-4 py-5 text-left text-[17px] font-semibold text-[#0A1710] transition-colors hover:text-[#0E7A4A]"
                >
                  <span className="flex-1">{item.q}</span>
                  <motion.span
                    animate={{ rotate: on ? 180 : 0 }}
                    transition={spring}
                    className={`grid size-9 shrink-0 place-items-center rounded-full transition-colors ${on ? 'bg-[#0E7A4A] text-white' : 'bg-[#EEF2EF] text-[#1D3528]'}`}
                  >
                    <ChevronDown className="size-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease }}
                      className="overflow-hidden"
                    >
                      <div className="pb-6 pr-8 sm:pr-12">
                        <p className="max-w-[62ch] text-pretty text-[15.5px] leading-[1.72] text-[#35463C]">{item.a}</p>
                        {item.docHref && item.docLabel && (
                          <Link
                            href={item.docHref}
                            className="mt-3 inline-flex min-h-[36px] items-center text-[14px] font-semibold text-[#0E7A4A] underline-offset-4 hover:underline"
                          >
                            {item.docLabel} →
                          </Link>
                        )}
                      </div>
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


function AnimationToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} aria-pressed={on}
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-4 py-2.5 text-sm shadow-lg backdrop-blur-xl transition-transform hover:-translate-y-0.5">
      {on ? <Pause className="size-4" /> : <Play className="size-4" />} Animations <span className={on ? 'font-semibold text-[#0E7A4A]' : 'text-black/40'}>{on ? 'On' : 'Off'}</span>
    </button>
  )
}

