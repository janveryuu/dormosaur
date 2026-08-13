'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronRight } from 'lucide-react'

import { buttonTapScale, springSmooth, springSnappy } from '@/lib/motion-presets'

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

  React.useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileTap={buttonTapScale}
        transition={springSnappy}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label} lead time`}
        className="flex items-center gap-1 rounded-full bg-fill px-3 py-1.5 text-[13.5px] font-semibold tabular-nums"
      >
        {value} min
        <ChevronRight
          className={`size-3.5 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`}
          strokeWidth={2.2}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -4 }}
            transition={springSmooth}
            className="ios-glass absolute top-full right-0 z-20 mt-2 w-40 origin-top-right overflow-hidden rounded-2xl border border-border shadow-ios-lg"
          >
            {options.map((option) => (
              <li key={option}>
                <button
                  role="option"
                  aria-selected={option === value}
                  onClick={() => {
                    onChange(option)
                    setOpen(false)
                  }}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-[14.5px] font-medium hover:bg-fill"
                >
                  {option} min before
                  {option === value && (
                    <Check className="size-4 text-primary" strokeWidth={2.4} />
                  )}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
