'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { CalendarCheck, BellRinging, ForkKnife } from '@phosphor-icons/react'
import { IOS_SPRING, IOS_SPRING_SNAPPY, IOS_EASE, BUTTON_SPRING } from '@/lib/springs'

// ─── Feature data ─────────────────────────────────────────────────────────────
const features = [
  {
    Icon: CalendarCheck,
    label: 'Schedule',
    body: 'Paste the mess from your registrar. Clean timetable in seconds.',
  },
  {
    Icon: BellRinging,
    label: 'Alarms',
    body: 'Every class gets an alarm that follows your timetable automatically.',
  },
  {
    Icon: ForkKnife,
    label: 'Kitchen',
    body: 'Real meals from a microwave, a kettle, and a very small budget.',
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function FeaturePill({
  Icon,
  label,
  body,
  delay,
}: {
  Icon: React.ElementType
  label: string
  body: string
  delay: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={reduce ? undefined : { scale: 0.95 }}
      transition={{ ...BUTTON_SPRING, delay: delay || 0 }}
      className="flex flex-col gap-2.5 rounded-3xl bg-card p-4 shadow-ios border border-separator/50 cursor-pointer select-none"
    >
      <span className="flex size-9 items-center justify-center rounded-2xl bg-accent text-primary">
        <Icon weight="duotone" size={20} />
      </span>
      <div>
        <p className="text-[15px] font-semibold tracking-[-0.015em] text-foreground">{label}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{body}</p>
      </div>
    </motion.div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function MobileSplashScreen() {
  const reduce = useReducedMotion()

  return (
    <div
      className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground md:hidden"
      style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
    >

      {/* ── Hero section ────────────────────────────────────────────── */}
      <section className="relative flex flex-1 flex-col items-center justify-center gap-0 px-6 pb-4 pt-6 text-center">

        {/* Mascot — the brand character, float animation is motivated */}
        <motion.div
          className="relative h-52 w-48"
          initial={reduce ? false : { opacity: 0, y: 20, scale: 0.88 }}
          animate={
            reduce
              ? { opacity: 1 }
              : {
                  opacity: 1,
                  y: [0, -8, 0],
                  scale: 1,
                }
          }
          transition={
            reduce
              ? { duration: 0 }
              : {
                  opacity: { duration: 0.5, delay: 0.06 },
                  scale: { duration: 0.6, ease: IOS_EASE, delay: 0.06 },
                  y: {
                    ...IOS_SPRING,
                    delay: 0.5,
                    repeat: Infinity,
                    repeatDelay: 3,
                    repeatType: 'loop',
                  },
                }
          }
        >
          {/* Floor shadow — intentional, not random blob */}
          <div
            aria-hidden="true"
            className="absolute inset-x-10 bottom-1 h-5 rounded-full bg-primary/12 blur-lg"
          />
          <Image
            src="/dormosaur-hi.png"
            alt="Dormosaur mascot"
            fill
            priority
            sizes="192px"
            className="object-contain"
          />
        </motion.div>

        {/* Wordmark + tagline */}
        <motion.div
          className="mt-4 flex flex-col items-center gap-2"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { ...IOS_SPRING, delay: 0.28 }}
        >
          <h1 className="text-4xl font-bold tracking-[-0.035em] text-foreground">
            Dormosaur
          </h1>
          <p className="max-w-[17rem] text-[15px] leading-snug text-muted-foreground">
            Your schedule, your alarms, your meals — sorted.
          </p>
        </motion.div>
      </section>

      {/* ── Feature strip ───────────────────────────────────────────── */}
      <section className="px-5 pb-4">
        <div className="grid grid-cols-3 gap-2.5">
          {features.map((f, i) => (
            <FeaturePill key={f.label} {...f} delay={0.42 + i * 0.07} />
          ))}
        </div>
      </section>

      {/* ── Social proof ────────────────────────────────────────────── */}
      <motion.section
        className="px-5 pb-4"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0 } : { ...IOS_SPRING, delay: 0.65 }}
      >
        <blockquote className="rounded-3xl border border-separator/50 bg-card p-4 shadow-ios-sm">
          <p className="text-[13.5px] leading-snug text-foreground/80">
            "I used to miss 8 AM classes all the time. Set up Dormosaur in 2 minutes,
            never missed one since."
          </p>
          <footer className="mt-2.5 text-[12px] text-muted-foreground">
            Maya R. · 2nd year · Computer Science
          </footer>
        </blockquote>
      </motion.section>

      {/* ── CTAs ────────────────────────────────────────────────────── */}
      <motion.section
        className="flex flex-col gap-3 px-5"
        style={{ paddingBottom: 'max(1.75rem, env(safe-area-inset-bottom))' }}
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0 } : { ...IOS_SPRING, delay: 0.75 }}
      >
        <motion.div
          className="w-full"
          whileTap={reduce ? undefined : { scale: 0.96 }}
          whileHover={reduce ? undefined : { scale: 1.015 }}
          transition={BUTTON_SPRING}
        >
          <Link
            href="/sign-up"
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[0_12px_28px_-10px_rgba(31,111,80,0.45)] hover:shadow-[0_16px_32px_-10px_rgba(31,111,80,0.55)] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Get started
            <ArrowRight className="size-4.5" aria-hidden="true" />
          </Link>
        </motion.div>

        <Link
          href="/sign-in"
          className="flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Already have an account?&nbsp;
          <span className="font-semibold text-primary">Sign in</span>
        </Link>
      </motion.section>
    </div>
  )
}
