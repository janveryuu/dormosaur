'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  CalendarCheck2,
  CalendarDays,
  Check,
  MapPin,
  UtensilsCrossed,
} from 'lucide-react'
import { MobileSplashScreen } from '@/components/mobile/splash-screen'
import { createClient } from '@/lib/supabase/client'
import { BUTTON_SPRING, IOS_EASE, IOS_SPRING } from '@/lib/springs'

const scheduleItems = [
  { subject: 'Calculus I', detail: 'Mon / Wed / Sci Hall 204', time: '8:30 AM', active: true },
  { subject: 'General Chemistry Lab', detail: 'Mon / Wed / Lab B-11', time: '10:15 AM', active: false },
  { subject: 'Modern Literature', detail: 'Tue / Thu / Humanities 310', time: '9:10 AM', active: false },
  { subject: 'Intro to Programming', detail: 'Tue / Thu / Tech Center 118', time: '1:00 PM', active: false },
  { subject: 'Psychology 101', detail: 'Mon-Fri / West Wing 22', time: '3:00 PM', active: false },
]

const featureItems = [
  {
    Icon: CalendarCheck2,
    label: 'Schedule',
    title: 'See the week before it gets loud.',
    body: 'Paste the registrar mess once. Dormosaur turns it into a timetable you can actually read.',
  },
  {
    Icon: BellRing,
    label: 'Alarms',
    title: 'Leave at the right time.',
    body: 'Class-aware alarms follow your timetable, so reminders arrive with enough context to help.',
  },
  {
    Icon: UtensilsCrossed,
    label: 'Kitchen',
    title: 'Eat well in a small room.',
    body: 'Get realistic meals for a microwave, a kettle, and a student budget.',
  },
]

function Reveal({
  children,
  className,
  delay = 0,
  y = 20,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  y?: number
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay, ease: IOS_EASE }}
    >
      {children}
    </motion.div>
  )
}

function ScheduleRow({
  subject,
  detail,
  time,
  active,
}: {
  subject: string
  detail: string
  time: string
  active: boolean
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={`landing-schedule-row${active ? ' is-active' : ''}`}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      whileTap={reduceMotion ? undefined : { scale: 0.99 }}
      transition={IOS_SPRING}
    >
      <span className="landing-schedule-marker" aria-hidden="true" />
      <div className="landing-schedule-copy">
        <p>{subject}</p>
        <span>{detail}</span>
      </div>
      <time>{time}</time>
    </motion.div>
  )
}

function NavBar() {
  const reduceMotion = useReducedMotion()

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: IOS_EASE }}
      className="landing-header"
    >
      <nav className="landing-nav" aria-label="Main navigation">
        <Link href="/" className="landing-brand">
          <Image
            src="/android-chrome-192x192.png"
            alt="Dormosaur"
            width={36}
            height={36}
            priority
            className="landing-brand-mark"
          />
          <span>Dormosaur</span>
        </Link>

        <div className="landing-nav-links">
          <Link href="#how-it-works">How it works</Link>
          <Link href="/sign-in">Open app</Link>
          <Link href="/sign-up" className="landing-nav-cta">
            Get started <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </nav>
    </motion.header>
  )
}

function CTAButton({
  href,
  children,
  large = false,
}: {
  href: string
  children: React.ReactNode
  large?: boolean
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -2 }}
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      transition={BUTTON_SPRING}
      className="inline-flex"
    >
      <Link href={href} className={`landing-primary-cta${large ? ' is-large' : ''}`}>
        {children}
        <ArrowRight size={large ? 17 : 15} strokeWidth={2.2} aria-hidden="true" />
      </Link>
    </motion.div>
  )
}

function HeroDemo() {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 26, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.18, ease: IOS_EASE }}
      className="landing-demo"
      aria-label="Example of Dormosaur turning a pasted schedule into a clear weekly route"
    >
      <div className="landing-photo-frame">
        <Image
          src="/campus-daylight.png"
          alt="A bright campus path beneath mature trees"
          fill
          priority
          sizes="(max-width: 1100px) 92vw, 52vw"
          className="landing-photo"
        />
        <div className="landing-photo-scrim" aria-hidden="true" />
        <div className="landing-photo-sign" aria-hidden="true">
          <MapPin size={15} strokeWidth={2} />
          <span>same campus, clearer route</span>
        </div>

        <div className="landing-demo-board">
          <div className="landing-board-header">
            <span className="landing-route-label">Campus departures</span>
            <span className="landing-board-status">
              <Check size={13} strokeWidth={2.4} aria-hidden="true" />
              ready for Monday
            </span>
          </div>

          <div className="landing-board-feature">
            <div>
              <span className="landing-board-kicker">Next class</span>
              <h2>Calculus I</h2>
              <p>Sci Hall 204 / 8:30 AM</p>
            </div>
            <div className="landing-board-time" aria-label="8:30 AM">
              08:30
            </div>
          </div>

          <div className="landing-board-rule" aria-hidden="true" />

          <div className="landing-board-meta">
            <span>your week</span>
            <span>5 classes</span>
          </div>

          <div className="landing-schedule-list">
            {scheduleItems.slice(1, 5).map((item) => (
              <ScheduleRow key={item.subject} {...item} />
            ))}
          </div>
        </div>
      </div>

      <div className="landing-demo-caption" aria-hidden="true">
        <span>messy schedule in</span>
        <ArrowRight size={16} strokeWidth={1.8} />
        <span className="is-strong">a week you can read</span>
      </div>
    </motion.div>
  )
}

function FeatureRouteCard() {
  return (
    <article className="landing-feature-route">
      <div className="landing-feature-topline">
        <span className="landing-feature-index">Schedule</span>
        <CalendarDays size={20} strokeWidth={1.8} aria-hidden="true" />
      </div>
      <div className="landing-feature-route-copy">
        <h3>From registrar noise to a route you can follow.</h3>
        <p>One clear view for the classes, rooms, and times that shape your day.</p>
      </div>
      <div className="landing-route-mini" aria-label="A sample class route">
        <div className="landing-route-mini-line" aria-hidden="true" />
        <div className="landing-route-stop is-current">
          <span>08:30</span>
          <strong>Calculus I</strong>
          <small>Sci Hall 204</small>
        </div>
        <div className="landing-route-stop">
          <span>10:15</span>
          <strong>Chemistry Lab</strong>
          <small>Lab B-11</small>
        </div>
        <div className="landing-route-stop">
          <span>13:00</span>
          <strong>Programming</strong>
          <small>Tech Center 118</small>
        </div>
      </div>
    </article>
  )
}

function FeatureSideCard({
  item,
  tone,
}: {
  item: (typeof featureItems)[number]
  tone: 'light' | 'accent'
}) {
  const Icon = item.Icon

  return (
    <article className={`landing-feature-side is-${tone}`}>
      <div className="landing-feature-topline">
        <span className="landing-feature-index">{item.label}</span>
        <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
      </div>
      <h3>{item.title}</h3>
      <p>{item.body}</p>
      <span className="landing-feature-arrow" aria-hidden="true">
        <ArrowUpRight size={18} strokeWidth={1.8} />
      </span>
    </article>
  )
}

export default function LandingPage() {
  const router = useRouter()

  React.useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return

      supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()
        .then(
          ({ data: profile }) => {
            router.replace(profile?.onboarding_completed ? '/dashboard' : '/onboarding')
          },
          () => router.replace('/onboarding'),
        )
    })
  }, [router])

  return (
    <>
      <MobileSplashScreen />

      <div className="landing-desktop hidden min-h-[100dvh] md:block">
        <NavBar />

        <main>
          <section className="landing-hero">
            <div className="landing-hero-inner">
              <div className="landing-hero-copy">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.05, ease: IOS_EASE }}
                >
                  <h1>
                    Dorm life,
                    <br />
                    <span>decoded.</span>
                  </h1>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.13, ease: IOS_EASE }}
                >
                  Turn the schedule you already have into a calmer week of classes, alarms, deadlines, and dorm meals.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.21, ease: IOS_EASE }}
                  className="landing-hero-actions"
                >
                  <CTAButton href="/sign-up">Get started</CTAButton>
                  <Link href="#how-it-works" className="landing-secondary-cta">
                    See how it works <ArrowDown size={15} strokeWidth={2} aria-hidden="true" />
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.38, ease: IOS_EASE }}
                  className="landing-hero-note"
                >
                  <span className="landing-hero-note-rule" aria-hidden="true" />
                  Built for the minutes between things.
                </motion.div>
              </div>

              <HeroDemo />
            </div>
          </section>

          <section id="how-it-works" className="landing-system-section scroll-mt-24">
            <div className="landing-section-inner">
              <Reveal className="landing-section-heading">
                <h2>One place for the pieces that usually scatter.</h2>
                <p>Dormosaur connects the small decisions that make a student day feel easier to carry.</p>
              </Reveal>

              <div className="landing-feature-grid">
                <Reveal y={28}>
                  <FeatureRouteCard />
                </Reveal>
                <div className="landing-feature-stack">
                  <Reveal delay={0.08} y={28}>
                    <FeatureSideCard item={featureItems[1]} tone="light" />
                  </Reveal>
                  <Reveal delay={0.16} y={28}>
                    <FeatureSideCard item={featureItems[2]} tone="accent" />
                  </Reveal>
                </div>
              </div>
            </div>
          </section>

          <section className="landing-closer-section">
            <Reveal className="landing-closer">
              <div className="landing-closer-copy">
                <span className="landing-closer-rule" aria-hidden="true" />
                <h2>Show up for a week that feels more yours.</h2>
                <p>Start with the schedule in your notes app. Leave with a plan that knows where you need to be next.</p>
                <CTAButton href="/sign-up" large>Get started</CTAButton>
              </div>
              <div className="landing-closer-mascot" aria-hidden="true">
                <Image
                  src="/dormo-jumping.png"
                  alt=""
                  fill
                  sizes="260px"
                  className="object-contain"
                />
              </div>
            </Reveal>
          </section>
        </main>

        <footer className="landing-footer">
          <div className="landing-footer-inner">
            <p>Dormosaur. Less scrambling, more sleeping.</p>
            <div>
              <Link href="/sign-in">Sign in</Link>
              <Link href="/sign-up">Get started</Link>
              <span>© 2026</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
