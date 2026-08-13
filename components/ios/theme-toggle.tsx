'use client'

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  value: 'light' | 'dark'
  onChange: (value: 'light' | 'dark') => void
  className?: string
}

export function ThemeToggle({ value, onChange, className = '' }: ThemeToggleProps) {
  const isDark = value === 'dark'
  const shouldReduceMotion = useReducedMotion()

  const toggleTheme = () => {
    onChange(isDark ? 'light' : 'dark')
  }

  // Spring transition tuned for snappy, tactile iOS feel
  const springTransition = shouldReduceMotion
    ? { duration: 0.15 }
    : {
        type: 'spring',
        stiffness: 480,
        damping: 26,
        mass: 0.7,
      }

  const iconTransition = shouldReduceMotion
    ? { duration: 0.12 }
    : {
        type: 'spring',
        stiffness: 400,
        damping: 24,
      }

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      whileTap={{ scale: 0.93 }}
      className={`relative flex h-[32px] w-[56px] shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        isDark
          ? 'bg-zinc-800/90 border border-white/10 shadow-inner'
          : 'bg-amber-100/75 border border-amber-300/40 shadow-xs'
      } ${className}`}
    >
      {/* Sliding Circular Knob */}
      <motion.div
        animate={{
          x: isDark ? 24 : 0,
        }}
        transition={springTransition}
        className={`relative flex size-[26px] items-center justify-center rounded-full shadow-ios-sm transition-colors duration-300 ${
          isDark
            ? 'bg-zinc-900 border border-white/15 text-slate-100 shadow-zinc-950/40'
            : 'bg-white border border-amber-200/50 text-amber-500 shadow-amber-500/10'
        }`}
      >
        {/* Sun Icon (Light Mode) */}
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 0 : 1,
            opacity: isDark ? 0 : 1,
            rotate: isDark ? -90 : 0,
          }}
          transition={iconTransition}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sun className="size-3.5 fill-amber-400 text-amber-500" strokeWidth={2.2} />
        </motion.div>

        {/* Moon Icon (Dark Mode) */}
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 1 : 0,
            opacity: isDark ? 1 : 0,
            rotate: isDark ? 0 : 90,
          }}
          transition={iconTransition}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Moon className="size-3.5 fill-indigo-200 text-slate-100 dark:fill-slate-100 dark:text-slate-100" strokeWidth={2.2} />
        </motion.div>
      </motion.div>
    </motion.button>
  )
}
