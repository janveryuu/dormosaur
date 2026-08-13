'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

function getStrength(password: string) {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score++
  return Math.min(score, 4)
}

const labels = ['Too short', 'Weak', 'Okay', 'Good', 'Strong']

export function PasswordStrength({ password }: { password: string }) {
  const strength = getStrength(password)

  if (!password) return null

  return (
    <div className="flex flex-col gap-1.5 pt-1" aria-live="polite">
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={cn(
              'h-1 flex-1 rounded-full bg-border transition-colors',
              index < strength &&
                (strength <= 1
                  ? 'bg-destructive'
                  : strength === 2
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'),
            )}
          />
        ))}
      </div>
      <span className="text-[12px] font-medium text-muted-foreground">{labels[strength]}</span>
    </div>
  )
}
