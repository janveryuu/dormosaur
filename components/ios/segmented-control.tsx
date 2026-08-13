'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { buttonTapScale, springSnappy } from '@/lib/motion-presets'

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  layoutId = 'segment',
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  className?: string
  layoutId?: string
}) {
  return (
    <div
      role="tablist"
      className={cn('flex w-full items-center gap-1 rounded-full bg-fill p-1', className)}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <motion.button
            key={option.value}
            role="tab"
            aria-selected={active}
            whileTap={buttonTapScale}
            onClick={() => onChange(option.value)}
            className="relative flex-1 rounded-full px-3 py-2 text-[13.5px] font-semibold tracking-[-0.01em] focus-visible:outline-none"
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={springSnappy}
                className="absolute inset-0 rounded-full bg-card shadow-ios"
              />
            )}
            <span
              className={cn(
                'relative z-10 whitespace-nowrap transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {option.label}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 600, damping: 28 }}
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-card text-muted-foreground shadow-ios',
      )}
    >
      {label}
    </motion.button>
  )
}
