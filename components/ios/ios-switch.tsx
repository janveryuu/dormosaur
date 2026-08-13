'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

import { springSnappy } from '@/lib/motion-presets'

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
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative flex h-[31px] w-[51px] shrink-0 items-center rounded-full px-[2px] transition-colors duration-300',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
        checked ? 'bg-primary' : 'bg-fill',
        className,
      )}
    >
      <motion.span
        layout
        transition={springSnappy}
        className="h-[27px] w-[27px] rounded-full bg-card shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
        style={{ marginLeft: checked ? 20 : 0 }}
      />
    </button>
  )
}
