'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, BellRing, CalendarCheck2, Check, UtensilsCrossed } from 'lucide-react'
import { MobileSplashScreen } from '@/components/mobile/splash-screen'
import { createClient } from '@/lib/supabase/client'
import { IOS_EASE, IOS_SPRING, IOS_SPRING_SNAPPY, BUTTON_SPRING } from '@/lib/springs'

// ─── Data ─────────────────────────────────────────────────────────────────────
const messyLines = [
  'MATH101 calculus 1 M&F 8:30-9:50am sci hall 204 reyes',
  'chem 130 general chem lab, mon/wed 10:15 to 12, lab b11',
  'ENG205 modern lit TTh 9:10:20 humanities 310 (tanaka)',
  'cs150 intro programming tues-thurs 1pm-2:40pm tech 118',
  'psy 110 mon-fri 3:00-4:20 west wing 22 dr patel',
]

const scheduleItems = [
  { subject: 'Calculus I', detail: 'Mon · Wed · Sci Hall 204', time: '8:30 AM', active: true },
  { subject: 'General Chemistry Lab', detail: 'Mon · Wed · Lab B‑11', time: '10:15 AM', active: false },
  { subject: 'Modern Literature', detail: 'Tue · Thu · Humanities 310', time: '9:10 AM', active: false },
  { subject: 'Intro to Programming', detail: 'Tue · Thu · Tech Center 118', time: '1:00 PM', active: false },
  { subject: 'Psychology 101', detail: 'Mon–Fri · West Wing 22', time: '3:00 PM', active: false },
]

const featureItems = [
  {
    Icon: CalendarCheck2,
    title: 'Schedule',
    body: 'Paste the mess from your registrar. Get a clean weekly grid in seconds.',
  },
  {
    Icon: BellRing,
    title: 'Alarms',
    body: 'Every class gets an alarm that follows your timetable automatically.',
  },
  {
    Icon: UtensilsCrossed,
    title: 'Kitchen',
    body: 'Real meals from a microwave, a kettle, and a very small budget.',
  },
]

// ─── Animated Schedule Row ────────────────────────────────────────────────────
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
  index: number
}) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{
        y: hovered ? -2 : 0,
        backgroundColor: hovered
          ? active ? '#ffffff' : '#f5f7f5'
          : active ? '#ffffff' : '#fafbf9',
        boxShadow: hovered
          ? active
            ? '0 8px 22px rgba(26,31,28,0.1), 0 1px 4px rgba(26,31,28,0.06)'
            : '0 6px 16px rgba(26,31,28,0.07)'
          : active
            ? '0 4px 14px rgba(26,31,28,0.06)'
            : '0 0px 0px rgba(26,31,28,0)',
      }}
      transition={IOS_SPRING}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 14,
        border: '1px solid rgba(26,31,28,0.07)',
        cursor: 'default',
        willChange: 'transform',
        position: 'relative',
      }}
    >
      <motion.div
        animate={{
          backgroundColor: hovered
            ? '#1f6f50'
            : active
              ? '#1f6f50'
              : 'rgba(122,133,128,0.35)',
          scaleY: hovered ? 1.08 : 1,
        }}
        transition={IOS_SPRING}
        style={{
          width: 3,
          height: 28,
          borderRadius: 100,
          flexShrink: 0,
          transformOrigin: 'center',
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 13.5,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: '#1a1f1c',
          }}
        >
          {subject}
        </p>
        <p
          style={{
            fontSize: 11.5,
            color: '#7a8580',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {detail}
        </p>
      </div>
      <motion.span
        animate={{ color: hovered ? '#1f6f50' : '#7a8580' }}
        transition={IOS_SPRING}
        style={{
          fontSize: 12,
          fontWeight: 500,
          flexShrink: 0,
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'right',
        }}
      >
        {time}
      </motion.span>
    </motion.div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function NavBar() {
  const { scrollY } = useScroll()
  const shadow = useTransform(scrollY, [0, 60], ['0 10px 30px rgba(26,31,28,0)', '0 10px 30px rgba(26,31,28,0.05)'])
  const bgAlpha = useTransform(scrollY, [0, 60], ['rgba(247,248,245,0.5)', 'rgba(247,248,245,0.88)'])

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: IOS_EASE }}
      className="sticky top-0 z-20 flex justify-center px-4 sm:px-8 md:px-10 pt-3 sm:pt-4"
    >
      <motion.nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: 1160,
          padding: '8px 12px 8px 16px',
          borderRadius: 100,
          border: '1px solid rgba(26,31,28,0.07)',
          backgroundColor: bgAlpha,
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          boxShadow: shadow,
        }}
      >
        <Link href="/" style={{ display: 'flex', minHeight: 44, alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <Image
            src="/android-chrome-192x192.png"
            alt="Dormosaur"
            width={30}
            height={30}
            style={{ width: 30, height: 30, borderRadius: 9, objectFit: 'contain' }}
          />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: '#1a1f1c' }}>Dormosaur</span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden sm:flex items-center gap-4 sm:gap-6">
            {[
              { label: 'How it works', href: '#how-it-works' },
              { label: 'Open app', href: '/sign-in' },
            ].map(l => (
              <NavLink key={l.label} href={l.href}>{l.label}</NavLink>
            ))}
          </div>
          <NavCTA href="/sign-up">Get started</NavCTA>
        </div>
      </motion.nav>
    </motion.header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{ fontSize: 14, fontWeight: 400, color: '#7a8580', textDecoration: 'none' }}
      className="inline-flex min-h-11 items-center transition-colors hover:text-[#1a1f1c]"
    >
      {children}
    </Link>
  )
}

function NavCTA({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={BUTTON_SPRING}
    >
      <Link
        href={href}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          minHeight: 44,
          padding: '7px 14px', borderRadius: 100,
          backgroundColor: '#1f6f50', color: '#fff',
          fontSize: 13.5, fontWeight: 500, letterSpacing: '-0.005em',
          textDecoration: 'none',
          boxShadow: 'rgba(31,111,80,0.22) 0px 8px 20px 0px, rgba(255,255,255,0.12) 0px 1px 0px 0px',
        }}
      >
        {children}
        <ArrowRight size={13} strokeWidth={2} />
      </Link>
    </motion.div>
  )
}

function CTAButton({ href, children, large }: { href: string; children: React.ReactNode; large?: boolean }) {
  return (
    <motion.div
      whileHover={{ scale: 1.025, y: -1.5 }}
      whileTap={{ scale: 0.96 }}
      transition={BUTTON_SPRING}
    >
      <Link
        href={href}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: large ? 9 : 7,
          minHeight: 44,
          padding: large ? '12px 22px' : '10px 20px',
          borderRadius: 100,
          backgroundColor: '#1f6f50', color: '#fff',
          fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em',
          textDecoration: 'none',
          boxShadow: 'rgba(31,111,80,0.22) 0px 8px 20px 0px, rgba(255,255,255,0.12) 0px 1px 0px 0px',
        }}
      >
        {children}
        <ArrowRight size={15} strokeWidth={2} />
      </Link>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()

  React.useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()
          .then(
            ({ data: profile }) => {
              if (profile && profile.onboarding_completed) {
                router.replace('/dashboard')
              } else {
                router.replace('/onboarding')
              }
            },
            () => {
              router.replace('/onboarding')
            }
          )
      }
    })
  }, [router])

  return (
    <>
      {/* Mobile: full landing experience */}
      <MobileSplashScreen />

      {/* Desktop: full landing page */}
      <div
        className="landing-desktop hidden md:block"
        style={{
          minHeight: '100dvh',
          overflowX: 'hidden',
          backgroundColor: '#f7f8f5',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      >
        <NavBar />

        {/* HERO */}
        <section className="flex justify-center px-4 sm:px-8 md:px-10 py-12 sm:py-18 lg:py-24">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 w-full max-w-[1160px]">

            {/* LEFT — Text */}
            <div className="flex-1 w-full min-w-0 lg:min-w-[340px] flex flex-col gap-5 sm:gap-6 text-center lg:text-left items-center lg:items-start">

              <motion.div
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: IOS_EASE, delay: 0.08 }}
              >
                <h1 style={{
                  fontSize: 'clamp(36px, 5vw, 64px)',
                  fontWeight: 700,
                  letterSpacing: '-0.035em',
                  lineHeight: '1.04em',
                  color: '#1a1f1c',
                  margin: 0,
                }}>
                  Dorm life,<br />
                  <span style={{ color: '#1f6f50' }}>decoded.</span>
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: IOS_EASE, delay: 0.18 }}
                style={{
                  fontSize: 'clamp(15px, 1.5vw, 18px)',
                  lineHeight: '1.6em',
                  color: '#7a8580',
                  margin: 0,
                  maxWidth: '42ch',
                }}
              >
                Paste your schedule as-is. We turn it into a timetable, set your alarms, and suggest what to cook.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: IOS_EASE, delay: 0.28 }}
                className="flex items-center gap-3.5 pt-1.5"
              >
                <CTAButton href="/sign-up">Get started</CTAButton>
                <span style={{ fontSize: 13, color: '#7a8580' }}>
                  Takes about ninety seconds.
                </span>
              </motion.div>
            </div>

            {/* RIGHT — Product Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 34 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, ease: IOS_EASE, delay: 0.36 }}
              className="flex-1 w-full min-w-0 lg:min-w-[360px] flex flex-col gap-3 overflow-visible"
            >
              <motion.div
                initial={{ rotate: -1.4 }}
                animate={{ rotate: -1.4 }}
                whileHover={{ rotate: 0, y: -4, boxShadow: '0 16px 40px rgba(26,31,28,0.1)' }}
                transition={IOS_SPRING}
                className="w-full sm:w-[88%] md:w-[82%] p-4 sm:p-5 rounded-2xl border border-[rgba(26,31,28,0.07)] bg-[rgba(255,255,255,0.65)] backdrop-blur-md shadow-xs cursor-default"
              >
                <p style={{
                  fontSize: 11.5,
                  color: '#7a8580',
                  marginBottom: 10,
                  letterSpacing: '-0.01em',
                }}>
                  What you paste
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {messyLines.map((line, i) => (
                    <p key={i} style={{
                      fontSize: 11.5,
                      lineHeight: '1.9em',
                      color: '#7a8580',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      margin: 0,
                    }}>
                      {line}
                    </p>
                  ))}
                </div>
              </motion.div>

              <div className="pl-4 sm:pl-8 flex items-center gap-2.5">
                <motion.div
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={IOS_SPRING_SNAPPY}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '7px 13px 7px 11px', borderRadius: 100,
                    backgroundColor: '#1f6f50',
                    boxShadow: '0 6px 16px rgba(31,111,80,0.32)',
                  }}
                >
                  <Check size={13} color="#fff" strokeWidth={2.5} />
                  <span style={{
                    fontSize: 11.5, fontWeight: 600, letterSpacing: '-0.005em',
                    color: '#fff',
                  }}>
                    Dormosaur sorts it
                  </span>
                </motion.div>
              </div>

              <motion.div
                initial={{ y: 26.4 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, ease: IOS_EASE, delay: 0.36 }}
                whileHover={{ y: -6, boxShadow: '0 36px 70px -20px rgba(26,31,28,0.22), 0 4px 10px rgba(26,31,28,0.08)' }}
                style={{
                  width: '100%',
                  borderRadius: 26,
                  border: '1px solid rgba(26,31,28,0.07)',
                  backgroundColor: '#fff',
                  boxShadow: '0 28px 60px -20px rgba(26,31,28,0.18), 0 2px 6px rgba(26,31,28,0.06)',
                  overflow: 'hidden',
                  zIndex: 1,
                  cursor: 'default',
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '18px 18px 12px',
                }}>
                  <h2 style={{
                    fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em',
                    color: '#1a1f1c', margin: 0, lineHeight: '1.3em',
                  }}>
                    Your week
                  </h2>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 10px', borderRadius: 100, backgroundColor: '#1f6f5014',
                  }}>
                    <Check size={12} strokeWidth={2.5} color="#1f6f50" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#1f6f50', fontVariantNumeric: 'tabular-nums' }}>
                      5 classes
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 18px 18px' }}>
                  {scheduleItems.map((item, i) => (
                    <ScheduleRow
                      key={item.subject}
                      index={i}
                      subject={item.subject}
                      detail={item.detail}
                      time={item.time}
                      active={item.active}
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how-it-works"
          className="flex justify-center px-4 sm:px-8 md:px-10 py-8 sm:py-16 md:py-24 scroll-mt-24"
        >
          <div className="w-full max-w-[1160px] flex flex-col gap-7 sm:gap-10">
            <div style={{ width: '100%', height: 1, backgroundColor: 'rgba(26,31,28,0.07)' }} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {featureItems.map((feat, i) => (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, ease: IOS_EASE, delay: i * 0.08 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 12, alignSelf: 'start' }}
                >
                  <feat.Icon size={22} strokeWidth={1.9} color="#1f6f50" aria-hidden="true" />
                  <h3 style={{
                    fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em',
                    lineHeight: '1.3em', color: '#1a1f1c', margin: 0,
                  }}>
                    {feat.title}
                  </h3>
                  <p style={{ fontSize: 15, lineHeight: '1.55em', color: '#7a8580', margin: 0 }}>
                    {feat.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA CARD */}
        <section className="flex justify-center px-4 sm:px-8 md:px-10 pb-16 sm:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: IOS_EASE }}
            className="w-full max-w-[1160px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 sm:p-10 md:p-12 rounded-3xl border border-[rgba(26,31,28,0.07)] bg-white shadow-lg"
          >
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#1a1f1c] m-0 max-w-md" style={{ letterSpacing: '-0.03em' }}>
                One setup. Zero maintenance.
              </h2>
              <p style={{ fontSize: 15, lineHeight: '1.55em', color: '#7a8580', margin: 0 }}>
                Set it and go back to actually being a student.
              </p>
            </div>
            <CTAButton href="/sign-up" large>Get started</CTAButton>
          </motion.div>
        </section>

        {/* FOOTER */}
        <footer className="flex justify-center border-t border-[rgba(26,31,28,0.07)] px-4 sm:px-8 md:px-10 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full max-w-[1160px] text-center sm:text-left">
            <p style={{ fontSize: 14, lineHeight: '1.55em', color: '#7a8580', margin: 0 }}>
              Dormosaur — less scrambling, more sleeping.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/sign-in" style={{ fontSize: 13, color: '#7a8580', textDecoration: 'none' }} className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-[#1a1f1c] transition-colors">Sign in</Link>
              <Link href="/sign-up" style={{ fontSize: 13, color: '#7a8580', textDecoration: 'none' }} className="inline-flex min-h-11 items-center hover:text-[#1a1f1c] transition-colors">Get started</Link>
              <p style={{ fontSize: 13, color: '#7a8580', margin: 0 }}>© 2026</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
