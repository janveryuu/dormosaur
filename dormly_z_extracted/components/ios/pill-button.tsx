'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const spring = { type: 'spring' as const, stiffness: 600, damping: 28 }

type Variant = 'primary' | 'secondary' | 'ghost' | 'glass'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_var(--primary)]',
  secondary: 'bg-fill text-foreground',
  ghost: 'text-primary',
  glass: 'ios-glass border border-border text-foreground',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[14px]',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-14 px-7 text-[17px]',
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
  return (
    <motion.button
      whileTap={{ scale: 0.965 }}
      whileHover={{ scale: 1.015 }}
      transition={spring}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.01em] select-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
        'disabled:opacity-50',
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
  return (
    <motion.div
      whileTap={{ scale: 0.965 }}
      whileHover={{ scale: 1.015 }}
      transition={spring}
      className={cn('inline-flex', full && 'w-full')}
    >
      <Link
        href={href}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.01em] select-none',
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
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={spring}
      className={cn('cursor-pointer', className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
