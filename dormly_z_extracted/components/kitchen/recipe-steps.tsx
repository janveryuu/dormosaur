'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function RecipeSteps({ steps }: { steps: string[] }) {
  const [done, setDone] = React.useState<number[]>([])

  const toggle = (i: number) =>
    setDone((prev) => (prev.includes(i) ? prev.filter((n) => n !== i) : [...prev, i]))

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-[13px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
          Method
        </h2>
        <span className="text-[13px] font-medium text-muted-foreground">
          {done.length} of {steps.length} done
        </span>
      </div>

      <ol className="flex flex-col gap-2.5">
        {steps.map((step, i) => {
          const complete = done.includes(i)
          return (
            <li key={i}>
              <motion.button
                whileTap={{ scale: 0.99 }}
                onClick={() => toggle(i)}
                aria-pressed={complete}
                className="flex w-full items-start gap-3 rounded-3xl bg-card p-4 text-left shadow-ios focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span
                  className={cn(
                    'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[12.5px] font-semibold transition-colors',
                    complete ? 'bg-primary text-primary-foreground' : 'bg-fill text-muted-foreground',
                  )}
                >
                  {complete ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span
                  className={cn(
                    'text-[15.5px] leading-relaxed transition-colors',
                    complete && 'text-muted-foreground line-through decoration-separator',
                  )}
                >
                  {step}
                </span>
              </motion.button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
