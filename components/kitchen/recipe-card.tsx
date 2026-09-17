'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock, Users, Banknote } from 'lucide-react'
import { useSchedule } from '@/components/schedule-provider'
import { formatRecipeCost } from '@/lib/currency'
import type { Recipe } from '@/lib/data'

import { cardHoverProps, springSmooth } from '@/lib/motion-presets'

export function RecipeCard({ recipe, index = 0 }: { recipe: Recipe; index?: number }) {
  const { profile } = useSchedule()
  const displayCost = formatRecipeCost(recipe.costUSD, profile?.country)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.25), ...springSmooth }}
      whileHover={cardHoverProps.whileHover}
      whileTap={cardHoverProps.whileTap}
    >
      <Link
        href={`/kitchen/${recipe.slug}`}
        className="group flex flex-col overflow-hidden rounded-3xl bg-card shadow-ios focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={recipe.image || '/placeholder.svg'}
            alt={recipe.title}
            fill
            sizes="(min-width: 1024px) 320px, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <span className="ios-glass absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11.5px] font-semibold tracking-[0.02em] text-foreground">
            {recipe.appliance}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 sm:gap-2 p-3.5 sm:p-4">
          <h3 className="text-[15px] sm:text-[16.5px] leading-snug font-semibold tracking-[-0.015em] text-pretty">
            {recipe.title}
          </h3>
          <p className="line-clamp-2 flex-1 text-[12.5px] sm:text-[13.5px] leading-relaxed text-muted-foreground">
            {recipe.blurb}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] sm:text-[12.5px] font-medium text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" strokeWidth={2.2} />
              <span className="tabular-nums">{recipe.minutes}m</span>
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3.5" strokeWidth={2.2} />
              <span>{recipe.servings}</span>
            </span>
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Banknote className="size-3.5" strokeWidth={2.2} />
              <span className="tabular-nums">{displayCost}</span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
