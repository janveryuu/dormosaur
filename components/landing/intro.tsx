'use client'

import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import styles from './intro.module.css'

const SEEN_KEY = 'dormo-intro-seen'
const MIN_MS = 1300
const MAX_MS = 2600

/**
 * Brand intro, once per browser session: the logo is framed in a camera viewfinder, a shutter
 * flash "snaps" it, and the frame shrinks into the hero phone screen to hand off to the page.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<'intro' | 'flash' | 'exit' | 'gone'>('intro')
  const clip = useMotionValue('inset(0px 0px 0px 0px round 0px)')
  const opacity = useMotionValue(1)
  const ref = useRef<HTMLDivElement>(null)
  const doneRef = useRef(onDone)
  const exitRef = useRef<() => void>(() => {})

  useEffect(() => {
    doneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    let seen = false
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === '1'
    } catch {}
    if (seen) {
      const raf = requestAnimationFrame(() => {
        setPhase('gone')
        doneRef.current()
      })
      return () => cancelAnimationFrame(raf)
    }

    const root = document.documentElement
    root.style.overflow = 'hidden'
    let cancelled = false
    let started = false
    const timers: number[] = []
    const finish = () => {
      root.style.overflow = ''
      try {
        sessionStorage.setItem(SEEN_KEY, '1')
      } catch {}
      setPhase('gone')
    }

    const exit = () => {
      if (started || cancelled) return
      started = true
      if (reduce) {
        doneRef.current()
        animate(opacity, 0, { duration: 0.3 }).then(finish)
        return
      }
      setPhase('flash')
      timers.push(window.setTimeout(() => {
        if (cancelled) return
        setPhase('exit')
        const phone = document.getElementById('hero-phone')?.getBoundingClientRect()
        const vw = window.innerWidth
        const vh = window.innerHeight
        const target = phone && phone.bottom > 0 && phone.top < vh
          ? `inset(${phone.top}px ${vw - phone.right}px ${Math.max(0, vh - phone.bottom)}px ${phone.left}px round 34px)`
          : `inset(${vh / 2 - 40}px ${vw / 2 - 40}px ${vh / 2 - 40}px ${vw / 2 - 40}px round 34px)`
        animate(clip, target, { duration: 0.75, ease: [0.76, 0, 0.24, 1] }).then(() => {
          if (cancelled) return
          doneRef.current()
          animate(opacity, 0, { duration: 0.28, ease: 'easeOut' }).then(finish)
        })
      }, 140))
    }
    exitRef.current = exit

    // Wait for the hero's real images (phone + desk items), bounded by MIN_MS and MAX_MS.
    const startedAt = performance.now()
    const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('#top img'))
    const loaded = Promise.all(imgs.map(img => (img.complete ? Promise.resolve() : img.decode().catch(() => undefined))))
    loaded.then(() => {
      const wait = Math.max(0, MIN_MS - (performance.now() - startedAt))
      timers.push(window.setTimeout(exit, wait))
    })
    timers.push(window.setTimeout(exit, MAX_MS))

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') exit()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      window.removeEventListener('keydown', onKey)
      root.style.overflow = ''
    }
  }, [clip, opacity, reduce])

  if (phase === 'gone') return null

  return (
    <motion.div
      id="dormo-intro"
      ref={ref}
      role="status"
      aria-label="Loading Dormosaur"
      suppressHydrationWarning
      onClick={() => exitRef.current()}
      style={{ clipPath: clip, opacity }}
      className="fixed inset-0 z-[100] grid cursor-pointer place-items-center bg-[radial-gradient(ellipse_at_50%_45%,#EAF6EC_0%,#F7FBF4_55%,#F3F7EF_100%)]"
    >
      <motion.div
        animate={phase === 'exit' ? { scale: 0.6, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 1, 1] }}
        className="flex flex-col items-center"
      >
        <div className="relative grid size-[168px] place-items-center">
          {(['tl', 'tr', 'bl', 'br'] as const).map(c => (
            <span key={c} aria-hidden className={`${styles.corner} ${styles[c]}`} />
          ))}
          <div className={styles.logo}>
            <Image src="/dormosaur-logo.png" alt="" width={88} height={88} priority className="rounded-[24px] shadow-[0_18px_40px_-14px_rgba(14,122,74,0.55)]" />
          </div>
        </div>
        <p className="mt-6 flex overflow-hidden text-[28px] font-semibold tracking-[-0.03em] text-[#0A1710]" aria-hidden>
          {'Dormosaur'.split('').map((ch, i) => (
            <span key={i} className={styles.letter} style={{ animationDelay: `${320 + i * 38}ms` }}>{ch}</span>
          ))}
        </p>
        <p className={`${styles.caption} mt-2 text-[13px] text-[#48564D]`}>Snapping your week…</p>
      </motion.div>

      {phase === 'flash' && <span aria-hidden className={`${styles.flash} pointer-events-none absolute inset-0 bg-white`} />}
      <p className={`${styles.caption} absolute bottom-8 text-[12px] text-[#48564D]/70`}>Tap to skip</p>
    </motion.div>
  )
}
