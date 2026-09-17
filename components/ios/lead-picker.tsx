'use client'

import * as React from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, ChevronRight } from 'lucide-react'
import { buttonTapScale, buttonHoverScale, springButton, springSmooth } from '@/lib/motion-presets'

const options = [15, 30, 60] as const
export type Lead = (typeof options)[number]

export function LeadPicker({
  value,
  onChange,
  label,
}: {
  value: Lead
  onChange: (value: Lead) => void
  label: string
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  React.useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [open])

  return (
    <div ref={ref} className="relative select-none">
      <motion.button
        type="button"
        whileTap={reduce ? undefined : buttonTapScale}
        whileHover={reduce ? undefined : buttonHoverScale}
        transition={springButton}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label} lead time`}
        className="flex items-center gap-1 rounded-full bg-fill px-3 py-1.5 text-[13.5px] font-semibold tabular-nums cursor-pointer hover:bg-accent transition-colors"
      >
        {value} min
        <ChevronRight
          className={`size-3.5 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          strokeWidth={2.2}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4 }}
            transition={springSmooth}
            className="ios-glass absolute top-full right-0 z-30 mt-2 w-44 origin-top-right overflow-hidden rounded-2xl border border-border shadow-ios-lg p-1"
          >
            {options.map((option) => {
              const active = option === value
              return (
                <li key={option}>
                  <motion.button
                    type="button"
                    role="option"
                    aria-selected={active}
                    whileTap={reduce ? undefined : { scale: 0.97 }}
                    transition={springButton}
                    onClick={() => {
                      onChange(option)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-[14px] font-medium transition-colors cursor-pointer ${
                      active ? 'bg-primary/12 text-primary font-semibold' : 'text-foreground hover:bg-fill'
                    }`}
                  >
                    <span>{option} min before</span>
                    {active && <Check className="size-4 text-primary" strokeWidth={2.4} />}
                  </motion.button>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
