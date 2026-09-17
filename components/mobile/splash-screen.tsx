'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { BUTTON_SPRING, IOS_SPRING } from '@/lib/springs'

export function MobileSplashScreen() {
  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col justify-between overflow-hidden bg-[#07130b] text-white md:hidden select-none">
      {/* ── 1. Full-Bleed Illustrated Scenic Background ─────────────── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/landing-bg.png"
          alt="Dormosaur Valley"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Atmospheric Scrim Gradient — subtle in upper half, deepening at bottom for crystal-clear readability */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(6,16,10,0.02) 0%, rgba(6,16,10,0.06) 30%, rgba(6,17,11,0.38) 50%, rgba(6,18,12,0.74) 68%, rgba(5,15,10,0.92) 84%, rgba(4,12,8,0.98) 100%)',
          }}
        />
      </div>

      {/* ── 2. Upper Scene: Floating Jumping Mascot ─────────────────── */}
      <div
        className="relative z-10 flex flex-1 items-center justify-center pt-8 px-6"
        style={{ paddingTop: 'max(2.5rem, env(safe-area-inset-top, 2.5rem))' }}
      >
        <motion.div
          className="relative w-56 sm:w-64 max-h-[38vh] aspect-square flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.9, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Subtle natural ambient shadow beneath jumping mascot */}
          <div
            aria-hidden="true"
            className="absolute -bottom-2 inset-x-12 h-6 rounded-full bg-black/40 blur-xl pointer-events-none"
          />

          {/* Gentle compositor-level floating animation */}
          <div className="relative w-full h-full animate-[dormo-float_3.4s_easeInOut_infinite] motion-reduce:animate-none">
            <Image
              src="/dormo-jumping.png"
              alt="Dormosaur Mascot"
              fill
              priority
              sizes="(max-width: 640px) 256px, 320px"
              className="object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.45)]"
            />
          </div>
        </motion.div>
      </div>

      {/* ── 3. Lower Content: Brand, Copy, CTAs, and Trust Badges ─────── */}
      <div
        className="relative z-10 flex flex-col items-center px-6 pb-6 text-center"
        style={{ paddingBottom: 'max(1.75rem, env(safe-area-inset-bottom, 1.75rem))' }}
      >
        {/* Brand Title + Value Proposition */}
        <motion.div
          className="flex flex-col items-center gap-2.5 mb-7"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...IOS_SPRING, delay: 0.15 }}
        >
          <h1 className="text-4xl sm:text-[42px] font-black tracking-[-0.035em] text-white leading-tight drop-shadow-[0_3px_12px_rgba(0,0,0,0.6)]">
            Dormosaur
          </h1>
          <p className="max-w-[290px] sm:max-w-[320px] text-[14.5px] sm:text-[15px] font-normal leading-[1.5] text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]">
            Dorm life, decoded. Paste your schedule, sync class alarms, and eat well on a dorm budget.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col items-center gap-3.5 w-full max-w-sm"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...IOS_SPRING, delay: 0.25 }}
        >
          {/* Primary CTA — PaWi-style earthy moss green pill */}
          <motion.div
            className="w-full"
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.015 }}
            transition={BUTTON_SPRING}
          >
            <Link
              href="/sign-up"
              className="inline-flex h-14 w-full items-center justify-center rounded-full bg-[#557E56] hover:bg-[#4C724D] active:bg-[#436644] px-6 text-[16px] font-semibold text-white tracking-[-0.01em] shadow-[0_10px_24px_-6px_rgba(18,48,25,0.6),inset_0_1px_0_rgba(255,255,255,0.22)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Let&apos;s get started!
            </Link>
          </motion.div>

          {/* Secondary Action Link */}
          <Link
            href="/sign-in"
            className="flex min-h-11 items-center justify-center rounded-full px-4 text-[13.5px] sm:text-[14px] font-normal text-white/80 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Already have an account?{' '}
            <span className="ml-1.5 font-semibold text-white underline underline-offset-4 decoration-white/70 hover:decoration-white">
              Log in
            </span>
          </Link>
        </motion.div>

        {/* Trust Badges matching PaWi reference */}
        <motion.div
          className="mt-6 flex items-center justify-center gap-2 text-[11.5px] sm:text-[12px] font-medium text-white/70 tracking-tight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.38 }}
        >
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="size-3.5 stroke-[2.2]" aria-hidden="true" />
            <span className="text-white/75">Offline-First</span>
          </span>
          <span className="text-white/30" aria-hidden="true">·</span>
          <span className="text-white/75">Zero Ads</span>
          <span className="text-white/30" aria-hidden="true">·</span>
          <span className="text-white/75">Private by Design</span>
        </motion.div>
      </div>
    </div>
  )
}
