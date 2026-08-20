'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const spring = { type: 'spring' as const, stiffness: 170, damping: 24 }

export function MobileSplashScreen() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col justify-between overflow-hidden bg-background px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] text-foreground md:hidden">
      {/* Atmospheric Ambient Background Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 -top-24 size-80 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 size-64 rounded-full bg-primary/8 blur-3xl"
      />

      <h1 className="sr-only">Welcome to Dormosaur</h1>

      {/* Mascot & Tagline Section */}
      <div className="relative flex flex-1 flex-col items-center justify-center pb-6">
        <motion.div
          className="relative size-60"
          initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.84 }}
          animate={
            reduceMotion
              ? { opacity: 1 }
              : { opacity: 1, y: [0, -6, 0], scale: [1, 1.012, 1] }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  opacity: { duration: 0.5, delay: 0.08 },
                  y: { ...spring, delay: 0.08, repeat: Infinity, repeatDelay: 2.8 },
                  scale: { duration: 3.6, delay: 0.7, repeat: Infinity, ease: 'easeInOut' },
                }
          }
        >
          {/* Soft mascot floor shadow with zero artifacts */}
          <div
            aria-hidden="true"
            className="absolute inset-x-10 bottom-3 h-8 rounded-full bg-primary/15 blur-xl"
          />
          <Image
            src="/dormosaur-mascot-transparent.png"
            alt="Dormosaur baby dinosaur mascot"
            fill
            priority
            sizes="240px"
            className="object-contain"
          />
        </motion.div>

        {/* Wordmark and Tagline */}
        <motion.div
          className="mt-2 flex flex-col items-center gap-2 text-center"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { ...spring, delay: 0.32 }}
        >
          <p className="font-sans text-4xl font-bold tracking-tight text-foreground">
            Dormosaur
          </p>
          <p className="max-w-64 font-sans text-base leading-6 text-muted-foreground">
            Your chaos, about to get organized.
          </p>
        </motion.div>
      </div>

      {/* CTAs Section */}
      <motion.div
        className="relative flex flex-col items-center gap-4"
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0 } : { ...spring, delay: 0.56 }}
      >
        <motion.div className="w-full" whileTap={reduceMotion ? undefined : { scale: 0.975 }}>
          <Link
            href="/sign-up"
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[0_16px_32px_-14px_rgba(31,111,80,0.4)] transition-all hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Get Started
            <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
        </motion.div>

        <Link
          href="/sign-in"
          className="flex min-h-11 items-center justify-center rounded-full px-4 font-sans text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Already have an account?&nbsp;<span className="font-semibold text-primary">Sign in</span>
        </Link>
      </motion.div>
    </div>
  )
}
