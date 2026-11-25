'use client'

import { motion, useReducedMotionConfig } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'

export const ease = [0.22, 1, 0.36, 1] as const
export const spring = { type: 'spring', stiffness: 260, damping: 28, mass: 0.9 } as const
export const serif = { fontFamily: 'var(--font-serif-display), Georgia, serif' }

export function Reveal({ children, delay = 0, y = 20, className = '' }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0.92, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 'some' }}
      transition={{ duration: 0.65, ease, delay }}
    >
      {children}
    </motion.div>
  )
}

/** Counts up from 0 the first time it scrolls into view, snapping cleanly under reduced motion. */
export function Counter({ to, suffix = '', decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const reduce = useReducedMotionConfig()
  const [v, setV] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (reduce) return
    const el = ref.current
    if (!el) return
    let raf = 0
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / 1100)
          setV(to * (1 - Math.pow(1 - p, 4)))
          if (p < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { rootMargin: '160px 0px' },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to, reduce])
  return <span ref={ref} className="tabular-nums">{(reduce ? to : v).toFixed(decimals)}{suffix}</span>
}
