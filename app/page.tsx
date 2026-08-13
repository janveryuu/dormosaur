'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Check, Sparkles } from 'lucide-react'

// ─── Exact easing from Framer source ─────────────────────────────────────────
const IOS_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const IOS_SPRING = { type: 'spring' as const, stiffness: 400, damping: 30 }
const IOS_SPRING_SNAPPY = { type: 'spring' as const, stiffness: 600, damping: 36 }

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

// Exact SVG icons extracted from Framer source HTML
function IconSchedule() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M8 2 L8 6" stroke="#1f6f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 2 L16 6" stroke="#1f6f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="#1f6f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M3 10 L21 10" stroke="#1f6f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 14 L8.01 14" stroke="#1f6f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 14 L12.01 14" stroke="#1f6f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 14 L16.01 14" stroke="#1f6f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 18 L8.01 18" stroke="#1f6f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 18 L12.01 18" stroke="#1f6f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 18 L16.01 18" stroke="#1f6f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconAlarms() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="13" r="8" stroke="#1f6f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 9 L12 13 L14 15" stroke="#1f6f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 6 L2 3" stroke="#1f6f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19 3 L22 6" stroke="#1f6f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.38 21 L4 18.7" stroke="#1f6f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17.64 18.67 L20 21" stroke="#1f6f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconKitchen() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M2 12 L22 12" stroke="#1f6f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 12 L20 20 C20 21.105 19.105 22 18 22 L6 22 C4.895 22 4 21.105 4 20 L4 12" stroke="#1f6f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 8 L20 4" stroke="#1f6f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.86 6 L8.41 4.19 C8.28 3.67 8.36 3.12 8.63 2.67 C8.9 2.21 9.35 1.88 9.86 1.75 L11.8 1.27 C12.31 1.14 12.86 1.22 13.31 1.49 C13.77 1.77 14.1 2.21 14.22 2.73 L14.68 4.53" stroke="#1f6f50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const featureItems = [
  { Icon: IconSchedule, title: 'Schedule', body: 'Paste the mess from your registrar. Get a clean weekly grid in seconds.' },
  { Icon: IconAlarms, title: 'Alarms', body: 'Every class gets an alarm that follows your timetable automatically.' },
  { Icon: IconKitchen, title: 'Kitchen', body: 'Real meals from a microwave, a kettle, and a very small budget.' },
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
        <motion.p
          animate={{ color: hovered ? '#1a1f1c' : '#1a1f1c' }}
          transition={IOS_SPRING}
          style={{
            fontSize: 13.5,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {subject}
        </motion.p>
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
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        justifyContent: 'center',
        padding: '18px 40px 0',
      }}
    >
      <motion.nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: 1160,
          padding: '10px 12px 10px 20px',
          borderRadius: 100,
          border: '1px solid rgba(26,31,28,0.07)',
          backgroundColor: bgAlpha,
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          boxShadow: shadow,
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <img
            src="/android-chrome-192x192.png"
            alt="Dormosaur"
            style={{ width: 26, height: 26, borderRadius: 8, objectFit: 'cover' }}
          />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: '#1a1f1c' }}>Dormosaur</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          {[
            { label: 'How it works', href: '#how-it-works' },
            { label: 'Open app', href: '/sign-in' },
          ].map(l => (
            <NavLink key={l.label} href={l.href}>{l.label}</NavLink>
          ))}
          <NavCTA href="/sign-up">Get started</NavCTA>
        </div>
      </motion.nav>
    </motion.header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <motion.div animate={{ color: hovered ? '#1a1f1c' : '#7a8580' }} transition={IOS_SPRING_SNAPPY}>
      <Link
        href={href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ fontSize: 15, fontWeight: 400, color: 'inherit', textDecoration: 'none' }}
      >
        {children}
      </Link>
    </motion.div>
  )
}

function NavCTA({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={IOS_SPRING_SNAPPY}
    >
      <Link
        href={href}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 100,
          backgroundColor: '#1f6f50', color: '#fff',
          fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em',
          textDecoration: 'none',
          boxShadow: 'rgba(31,111,80,0.22) 0px 8px 20px 0px, rgba(255,255,255,0.12) 0px 1px 0px 0px',
        }}
      >
        {children}
        <ArrowRight size={14} strokeWidth={2} />
      </Link>
    </motion.div>
  )
}

function CTAButton({ href, children, large }: { href: string; children: React.ReactNode; large?: boolean }) {
  return (
    <motion.div
      whileHover={{ scale: 1.025, y: -1.5 }}
      whileTap={{ scale: 0.975 }}
      transition={IOS_SPRING_SNAPPY}
    >
      <Link
        href={href}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: large ? 9 : 7,
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
  return (
    <div
      style={{
        minHeight: '100dvh',
        overflowX: 'hidden',
        backgroundColor: '#f7f8f5',
        fontFamily: '"Inter Variable", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}
    >
      <NavBar />

      {/* HERO */}
      <section style={{ display: 'flex', justifyContent: 'center', padding: '96px 40px 88px' }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center',
          gap: 64, width: '100%', maxWidth: 1160,
        }}>

          {/* LEFT — Text */}
          <div style={{ flex: '1 0 0', minWidth: 380, display: 'flex', flexDirection: 'column', gap: 26 }}>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: IOS_EASE, delay: 0 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 14px 7px 12px', borderRadius: 100,
                backgroundColor: '#1f6f5014', width: 'fit-content',
              }}
            >
              <Sparkles size={13} color="#1f6f50" strokeWidth={2} />
              <span style={{
                fontSize: 11, fontWeight: 500, letterSpacing: '0.12em',
                color: '#1f6f50', textTransform: 'uppercase',
              }}>
                Built for dorm life
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: IOS_EASE, delay: 0.08 }}
            >
              <h1 style={{
                fontSize: 'clamp(40px, 5.5vw, 66px)',
                fontWeight: 600,
                letterSpacing: '-0.035em',
                lineHeight: '1.03em',
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
                fontSize: 'clamp(16px, 1.5vw, 19px)', lineHeight: '1.55em',
                color: '#7a8580', margin: 0, maxWidth: 470,
              }}
            >
              Paste your schedule as-is. We'll turn it into a timetable, set your
              alarms, and even suggest what to cook between classes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: IOS_EASE, delay: 0.28 }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 6 }}
            >
              <CTAButton href="/sign-up">Get started</CTAButton>
              <span style={{ fontSize: 14, color: '#7a8580', whiteSpace: 'nowrap' }}>
                Takes about ninety seconds.
              </span>
            </motion.div>
          </div>

          {/* RIGHT — Product Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 34 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: IOS_EASE, delay: 0.36 }}
            style={{
              flex: '1 0 0', minWidth: 400,
              display: 'flex', flexDirection: 'column', gap: 12,
              overflow: 'visible',
            }}
          >
            <motion.div
              initial={{ rotate: -1.4 }}
              animate={{ rotate: -1.4 }}
              whileHover={{ rotate: 0, y: -4, boxShadow: '0 16px 40px rgba(26,31,28,0.1)' }}
              transition={IOS_SPRING}
              style={{
                width: '82%',
                padding: '18px 20px',
                borderRadius: 20,
                border: '1px solid rgba(26,31,28,0.07)',
                backgroundColor: 'rgba(255,255,255,0.65)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: '0 6px 18px rgba(26,31,28,0.06)',
                cursor: 'default',
              }}
            >
              <p style={{
                fontSize: 11, fontWeight: 500, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: '#7a8580', marginBottom: 10,
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

            <div style={{ paddingLeft: 34, display: 'flex', alignItems: 'center', gap: 10 }}>
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
                <Sparkles size={13} color="#fff" strokeWidth={2} />
                <span style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: '#fff',
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
                padding: '22px 22px 14px',
              }}>
                <h3 style={{
                  fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em',
                  color: '#1a1f1c', margin: 0, lineHeight: '1.3em',
                }}>
                  Your week
                </h3>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 10px', borderRadius: 100, backgroundColor: '#1f6f5014',
                }}>
                  <Check size={12} strokeWidth={2.5} color="#1f6f50" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#1f6f50' }}>
                    5 classes
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 22px 22px' }}>
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
        style={{ display: 'flex', justifyContent: 'center', padding: '20px 40px 100px', scrollMarginTop: 90 }}
      >
        <div style={{ width: '100%', maxWidth: 1160, display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ width: '100%', height: 1, backgroundColor: 'rgba(26,31,28,0.07)' }} />
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: IOS_EASE }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(240px, 1fr))',
              gap: 48,
            }}
          >
            {featureItems.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, ease: IOS_EASE, delay: i * 0.08 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12, alignSelf: 'start' }}
              >
                <feat.Icon />
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
          </motion.div>
        </div>
      </section>

      {/* CTA CARD */}
      <section style={{ display: 'flex', justifyContent: 'center', padding: '0 40px 96px', scrollMarginTop: 100 }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: IOS_EASE }}
          style={{
            width: '100%', maxWidth: 1160,
            display: 'flex', flexWrap: 'wrap',
            alignItems: 'center', justifyContent: 'space-between',
            gap: 32, padding: '46px 48px',
            borderRadius: 30,
            border: '1px solid rgba(26,31,28,0.07)',
            backgroundColor: '#fff',
            boxShadow: '0 24px 50px -24px rgba(26,31,28,0.14)',
          }}
        >
          <div style={{ flex: '1 0 0', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{
              fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em',
              lineHeight: '1.12em', color: '#1a1f1c', margin: 0, maxWidth: 440,
            }}>
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
      <footer style={{
        display: 'flex', justifyContent: 'center',
        borderTop: '1px solid rgba(26,31,28,0.07)',
        padding: '26px 40px 34px',
      }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap',
          alignItems: 'center', justifyContent: 'space-between',
          width: '100%', maxWidth: 1160,
        }}>
          <p style={{ fontSize: 15, lineHeight: '1.55em', color: '#7a8580', margin: 0 }}>
            Dormosaur — less scrambling, more sleeping.
          </p>
          <p style={{ fontSize: 15, lineHeight: '1.55em', color: '#7a8580', margin: 0 }}>
            © 2026
          </p>
        </div>
      </footer>
    </div>
  )
}
