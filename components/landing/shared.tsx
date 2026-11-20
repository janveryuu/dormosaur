'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'

export const ease = [0.22, 1, 0.36, 1] as const
export const spring = { type: 'spring', stiffness: 220, damping: 24, mass: 0.9 } as const
export const serif = { fontFamily: 'var(--font-serif-display), Georgia, serif' }

export function Reveal({ children, delay = 0, y = 28, className = '' }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease, delay }}
    >
      {children}
    </motion.div>
  )
}

/** Counts up from 0 the first time it scrolls into view. */
export function Counter({ to, suffix = '', decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const [v, setV] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const start = performance.now()
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / 1400)
        setV(to * (1 - Math.pow(1 - p, 4)))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [to])
  return <span ref={ref} className="tabular-nums">{v.toFixed(decimals)}{suffix}</span>
}
