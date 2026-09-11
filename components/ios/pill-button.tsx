'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { buttonTapScale, buttonHoverScale, springButton } from '@/lib/motion-presets'

type Variant = 'primary' | 'secondary' | 'ghost' | 'glass'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-[0_8px_20px_-6px_rgba(31,111,80,0.45)] hover:shadow-[0_12px_28px_-6px_rgba(31,111,80,0.55)] active:shadow-none transition-shadow',
  secondary:
    'bg-fill text-foreground hover:bg-accent active:bg-accent/80 transition-colors shadow-2xs',
  ghost:
    'text-primary hover:bg-primary/10 active:bg-primary/15 transition-colors',
  glass:
    'ios-glass border border-border text-foreground hover:bg-card/90 active:bg-card/70 shadow-ios transition-colors',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[13.5px]',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-14 px-7 text-[16.5px]',
}

type BaseProps = {
  variant?: Variant
  size?: Size
  full?: boolean
  className?: string
  children: React.ReactNode
}

export function PillButton({
  variant = 'primary',
  size = 'md',
  full,
  className,
  children,
  ...props
}: BaseProps & React.ComponentPropsWithoutRef<'button'>) {
  const reduce = useReducedMotion()

  return (
    <motion.button
      whileTap={reduce ? undefined : buttonTapScale}
      whileHover={reduce ? undefined : buttonHoverScale}
      transition={springButton}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.01em] select-none cursor-pointer',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        full && 'w-full',
        className,
      )}
      {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
    >
      {children}
    </motion.button>
  )
}

export function PillLink({
  variant = 'primary',
  size = 'md',
  full,
  className,
  children,
  href,
}: BaseProps & { href: string }) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      whileTap={reduce ? undefined : buttonTapScale}
      whileHover={reduce ? undefined : buttonHoverScale}
      transition={springButton}
      className={cn('inline-flex', full && 'w-full')}
    >
      <Link
        href={href}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.01em] select-none cursor-pointer',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
          variants[variant],
          sizes[size],
          full && 'w-full',
          className,
        )}
      >
        {children}
      </Link>
    </motion.div>
  )
}

export function Tappable({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof motion.div>) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      whileTap={reduce ? undefined : { scale: 0.975 }}
      whileHover={reduce ? undefined : { scale: 1.01 }}
      transition={springButton}
      className={cn('cursor-pointer', className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
