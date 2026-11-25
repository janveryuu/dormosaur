'use client'

import {
  AnimatePresence, MotionConfig, motion, useReducedMotion, useScroll, useSpring,
} from 'framer-motion'
import {
  ChevronDown, Pause, Play,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useState, type ReactNode } from 'react'
import { SiteFooter } from '@/components/site-footer'
import { AppShowcase } from './app-showcase'
import { FinalCta } from './final-cta'
import { Hero } from './hero'
import { Intro } from './intro'
import { InstallSteps } from './install-steps'
import { NumberOne } from './number-one'
import { ScannerSection } from './scanner-section'
import { Schools } from './schools'
import { FeatureTiles, HomeScreenPhone, TermRails } from './showcase'
import { SiteNav } from './site-nav'
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
        <SiteNav apkUrl={apkUrl} />
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
          <BentoCard bg="#FFF3B0" ink="#4A3B00" title="Plan your whole term" body="Check your classes, exams, assignments, and meals for the week.">
            <TermRails animate={animate} />
          </BentoCard>
          <BentoCard bg="#D9E8FF" ink="#123A7A" title={<>Your schedule on<br />your lock screen</>} body="Save your weekly schedule as a wallpaper so it’s easy to check between classes." delay={0.08} className="md:row-span-2">
            <div className="pt-4"><HomeScreenPhone /></div>
          </BentoCard>
          <BentoCard bg="#FFD9EC" ink="#7A1745" title={<>Today&apos;s classes<br />and deadlines</>} delay={0.12}>
            <StackedNotes />
          </BentoCard>
          <BentoCard bg="#DCF5E7" ink="#0A4A2D" title="Class alarms that work offline" body="Get an alarm 15 minutes before class, even with no signal. Pro can remind you 30 or 60 minutes before class." className="md:col-span-2" delay={0.05}>
            <AlarmStrip />
          </BentoCard>
          <BentoCard bg="#FFE8D6" ink="#6B2F05" title="Eat well on a dorm budget" body="Find 200 recipes for dorm appliances. Pick your meals and make a grocery list." delay={0.08}>
            <RecipeFan />
          </BentoCard>
          <BentoCard bg="#ECE6FF" ink="#3E1D8F" title="See what’s due next" body="See exams, quizzes, and projects in due date order. Mark each task done when you finish." delay={0.14}>
            <Notification />
          </BentoCard>
        </div>
      </div>
    </section>
  )
}


function StackedNotes() {
  const [organized, setOrganized] = useState(false)
  const notes = [
    { t: '8:30 AM', c: 'Calculus I', r: 'Sci 204', bg: '#FFE0CC', rot: -5, z: 3 },
    { t: '10:15 AM', c: 'Chemistry', r: 'Lab B-12', bg: '#C9F2EC', rot: -2.5, z: 2 },
    { t: '1:00 PM', c: 'Programming', r: 'Tech 118', bg: '#DCD3FF', rot: -4, z: 1 },
  ]
  return (
    <div
      onMouseEnter={() => setOrganized(true)}
      onMouseLeave={() => setOrganized(false)}
      onClick={() => setOrganized(o => !o)}
      className="relative h-[234px] cursor-pointer select-none"
    >
      {notes.map((n, i) => (
        <motion.div
          key={n.c}
          style={{ background: n.bg, zIndex: n.z }}
          initial={{ y: -95 - i * 18, x: -12, opacity: 0, rotate: n.rot * 2.2, scale: 0.94 }}
          whileInView={{
            y: i * 62,
            x: organized ? 4 : 0,
            opacity: 1,
            rotate: organized ? 0 : n.rot,
            scale: 1,
          }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{
            type: 'spring',
            stiffness: 340,
            damping: 23,
            mass: 0.72,
            delay: organized ? i * 0.035 : 0.06 + i * 0.095,
          }}
          className="absolute left-0 top-1 flex w-[62%] gap-3.5 rounded-2xl px-4 py-3 shadow-[0_14px_28px_-16px_rgba(68,14,38,0.34)] ring-1 ring-black/[0.04]"
        >
          <span className="shrink-0 text-[13px] font-semibold tabular-nums">{n.t}</span>
          <span className="min-w-0 text-[13px]">
            <b className="block truncate">{n.c}</b>
            <span className="opacity-65">{n.r}</span>
          </span>
        </motion.div>
      ))}
      <motion.div
        initial={{ y: -80, rotate: 16, scale: 0.88, opacity: 0 }}
        whileInView={{ y: 0, rotate: organized ? 0 : 4.5, scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22, mass: 0.78, delay: organized ? 0.1 : 0.38 }}
        className="absolute right-0 top-3 z-10 w-[41%] rounded-2xl border-2 border-dashed border-[#E0457B]/40 bg-white p-4 text-[#B0124F] shadow-[0_18px_36px_-20px_rgba(122,23,69,0.45)]"
      >
        <p className="text-xs font-semibold">Due this week</p>
        <p className="mt-2 text-[26px] font-bold leading-none tabular-nums">3 tasks</p>
        <p className="mt-1 text-[22px] font-bold leading-none tabular-nums">1 exam</p>
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
    a: 'Yes. Use a photo of your registration form, a portal screenshot, a PDF up to 3 MB, or pasted text. Dormosaur pulls out class times and rooms and flags details to double check. Review the results before saving. Dormosaur skips duplicate classes and sets alarms for the classes you confirm.',
    docHref: '/docs/import',
    docLabel: 'Read the import guide',
  },
  {
    q: 'Is Dormosaur free?',
    a: 'Dormosaur is free to download and has no ads. The free plan includes your schedule, tasks, class alarms 15 minutes before class, today’s meal plan, and all 200 recipes. You also get one AI schedule scan, one syllabus scan, and five Ask Dormo messages a day. Dormosaur Pro includes unlimited scans, 100 Ask Dormo messages a day, alarms 30 or 60 minutes before class, weekly meal planning with grocery list export, and extra wallpaper themes without a watermark. You can try Pro free for 7 days. Plans do not renew automatically. Pay with GCash, Maya, MariBank, or GoTyme.',
  },
  {
    q: 'Why is it an APK and not on the Play Store?',
    a: 'While we prepare store listings, you can download the signed APK directly from Dormosaur. It works on Android 8 or later. Install updates over your existing app to keep your data.',
    docHref: '/docs/install',
    docLabel: 'Read the install guide',
  },
  {
    q: 'Does it work offline?',
    a: 'Yes. You can check your saved timetable, tasks, and recipes offline. Scheduled class alarms still ring. Connect to the internet to sign in, run AI scans, use Ask Dormo, or sync changes.',
  },
  {
    q: 'Will it remind me before class?',
    a: 'Yes. Dormosaur sets an alarm for each class you add. On the free plan, it rings 15 minutes before class. With Pro, you can also choose 30 or 60 minutes. You can turn off an alarm for a single class and keep the class in your schedule.',
    docHref: '/docs/alarms',
    docLabel: 'Read the class alarms guide',
  },
  {
    q: 'Does it have home screen widgets?',
    a: 'You can preview upcoming live widgets in the app. For now, save your schedule as a wallpaper in List or Timetable view, with or without room numbers. You can also share your schedule as an image or text.',
    docHref: '/docs/wallpaper-widgets',
    docLabel: 'See wallpaper and widgets',
  },
  {
    q: 'Is my data private?',
    a: 'Dormosaur never sells student timetables or shares them with advertisers or data brokers. Your account backs up your classes, alarms, tasks, and meal plans so you can recover them after reinstalling or switching phones. We process scan files to read your classes or due dates.',
    docHref: '/docs/privacy',
    docLabel: 'Read privacy and data details',
  },
  {
    q: 'Is there an iPhone version?',
    a: 'Dormosaur is available on Android. An iPhone version is planned. If you switch Android phones, sign in with the same account to restore your timetable, tasks, and meal plan.',
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
              What to know before you download Dormosaur or import your first schedule.
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

