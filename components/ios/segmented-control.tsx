'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { buttonTapScale, chipTapScale, springLayout, springButton } from '@/lib/motion-presets'

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
  const reduce = useReducedMotion()

  return (
    <div
      role="tablist"
      className={cn('flex w-full items-center gap-1 rounded-full bg-fill p-1 select-none', className)}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <motion.button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            whileTap={reduce ? undefined : buttonTapScale}
            whileHover={reduce || active ? undefined : { scale: 1.015 }}
            transition={springButton}
            onClick={() => onChange(option.value)}
            className="relative flex-1 min-w-0 rounded-full px-2 py-2 text-[13.5px] font-semibold tracking-[-0.01em] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={springLayout}
                className="absolute inset-0 rounded-full bg-card shadow-ios"
              />
            )}
            <span
              className={cn(
                'relative z-10 block truncate transition-colors duration-150',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
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
  const reduce = useReducedMotion()

  return (
    <motion.button
      type="button"
      whileTap={reduce ? undefined : chipTapScale}
      whileHover={reduce ? undefined : { scale: 1.025, y: -1 }}
      transition={springButton}
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors select-none cursor-pointer',
        active
          ? 'bg-primary text-primary-foreground shadow-[0_4px_12px_-2px_rgba(31,111,80,0.4)]'
          : 'bg-card text-muted-foreground shadow-ios hover:text-foreground hover:bg-fill/60',
      )}
    >
      {label}
    </motion.button>
  )
}
