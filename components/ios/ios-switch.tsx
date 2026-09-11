'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { springSwitch, springSnappy } from '@/lib/motion-presets'

export function IosSwitch({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  className?: string
}) {
  const reduce = useReducedMotion()

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      whileTap={reduce ? undefined : { scale: 0.93 }}
      transition={springSnappy}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative flex h-[31px] w-[51px] shrink-0 items-center rounded-full p-[2px] transition-colors duration-250 cursor-pointer select-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
        checked ? 'bg-primary shadow-[0_2px_8px_-2px_rgba(31,111,80,0.5)]' : 'bg-fill',
        className,
      )}
    >
      <motion.span
        layout
        transition={springSwitch}
        className="size-[27px] rounded-full bg-card shadow-[0_2px_5px_rgba(0,0,0,0.18)]"
        style={{ marginLeft: checked ? 20 : 0 }}
      />
    </motion.button>
  )
}
