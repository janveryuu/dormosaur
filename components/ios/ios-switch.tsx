'use client'

import { motion } from 'framer-motion'
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
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      whileTap={{ scale: 0.93 }}
      transition={springSnappy}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative flex h-11 w-[59px] shrink-0 items-center justify-center rounded-full cursor-pointer select-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'relative flex h-[31px] w-[51px] items-center rounded-full p-[2px] transition-colors duration-250',
          checked ? 'bg-primary shadow-[0_2px_8px_-2px_rgba(31,111,80,0.5)]' : 'bg-fill',
        )}
      >
        <motion.span
          layout
          transition={springSwitch}
          className="size-[27px] rounded-full bg-card shadow-[0_2px_5px_rgba(0,0,0,0.18)]"
          style={{ marginLeft: checked ? 20 : 0 }}
        />
      </span>
    </motion.button>
  )
}
