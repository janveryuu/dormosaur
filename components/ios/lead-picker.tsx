'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronRight } from 'lucide-react'
import { buttonTapScale, buttonHoverScale, springButton, springSmooth } from '@/lib/motion-presets'

const options = [15, 30, 60] as const
const pickerOpenEvent = 'dormosaur:lead-picker-open'
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
  const listId = React.useId()
  React.useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onOtherPickerOpen = () => setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener(pickerOpenEvent, onOtherPickerOpen)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener(pickerOpenEvent, onOtherPickerOpen)
    }
  }, [open])

  return (
    <div ref={ref} className="flex max-w-full shrink-0 flex-col items-start select-none sm:items-end">
      <motion.button
        type="button"
        whileTap={buttonTapScale}
        whileHover={buttonHoverScale}
        transition={springButton}
        onClick={() => {
          if (!open) document.dispatchEvent(new Event(pickerOpenEvent))
          setOpen((o) => !o)
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${label} lead time`}
        className="flex min-h-11 items-center gap-1 rounded-full bg-fill px-3 py-1.5 text-[13.5px] font-semibold tabular-nums cursor-pointer hover:bg-accent transition-colors"
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
            id={listId}
            aria-label={`${label} lead time options`}
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={springSmooth}
            className="ios-glass w-44 max-w-full overflow-hidden rounded-2xl border border-border shadow-ios-lg p-1"
          >
            {options.map((option) => {
              const active = option === value
              return (
                <li key={option}>
                  <motion.button
                    type="button"
                    role="option"
                    aria-selected={active}
                    whileTap={{ scale: 0.97 }}
                    transition={springButton}
                    onClick={() => {
                      onChange(option)
                      setOpen(false)
                    }}
                    className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3.5 py-2 text-[14px] font-medium transition-colors cursor-pointer ${
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
