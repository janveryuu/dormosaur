'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CookingPot, Sparkles, ArrowRight, Utensils, Check } from 'lucide-react'
import { useSchedule } from '@/components/schedule-provider'
import { recipes, type Recipe } from '@/lib/data'

type AiMealSuggestion = {
  headline: string
  subtext: string
  recommendedSlugs: string[]
  scheduleInsights: { recipeSlug: string; reason: string }[]
}

export function ScheduleMealBanner() {
  const { classes, setMealPlanItem } = useSchedule()
  const [data, setData] = React.useState<AiMealSuggestion | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [savedSlug, setSavedSlug] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function fetchSuggestions() {
      setLoading(true)
      try {
        const res = await fetch('/api/recipes/schedule-aware', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ classes, dayName: 'Mon' }),
        })
        const json = await res.json()
        if (json.recommendedSlugs) {
          setData(json)
        }
      } catch (err) {
        console.error('Failed to load schedule-aware meals:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSuggestions()
  }, [classes])

  if (loading) {
    return (
      <div className="flex h-36 items-center justify-center rounded-3xl border border-line bg-field p-6 animate-pulse">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Sparkles className="size-5 text-primary animate-spin" />
          <span className="text-[14px] font-medium">Analyzing schedule & kitchen gaps...</span>
        </div>
      </div>
    )
  }

  if (!data) return null

  const recommendedRecipes = recipes.filter((r) => data.recommendedSlugs.includes(r.slug))

  const handleSaveToPlan = (slug: string) => {
    setMealPlanItem('Mon', 'Dinner', slug)
    setSavedSlug(slug)
    setTimeout(() => setSavedSlug(null), 2500)
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
      className="dashboard-section rounded-3xl border border-line bg-field p-5"
    >
      {/* Header Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/chef-dormosaur.png"
            alt="Chef Dormosaur"
            width={48}
            height={48}
            className="size-12 shrink-0 object-contain sm:size-14"
          />
          <span className="route-label">
            Kitchen connection
          </span>
        </div>
        <span className="rounded-full border border-line bg-card px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
          Schedule x Kitchen
        </span>
      </div>

      {/* Headline & Subtext */}
      <div className="mt-3">
        <h3 className="text-[17px] font-bold tracking-tight text-foreground leading-snug">
          {data.headline}
        </h3>
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
          {data.subtext}
        </p>
      </div>

      {/* Recommended Recipe Cards Grid */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {recommendedRecipes.map((recipe) => {
          const insight = data.scheduleInsights.find((i) => i.recipeSlug === recipe.slug)?.reason
          const isSaved = savedSlug === recipe.slug
          return (
            <div
              key={recipe.slug}
              className="flex flex-col justify-between rounded-2xl border border-line bg-card p-3.5 transition-colors hover:border-primary/50"
            >
              <div>
                <div className="flex items-center justify-between text-[11.5px] font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3 text-primary" /> {recipe.minutes} min
                  </span>
                  <span className="rounded-full bg-card px-1.5 py-0.5 text-[10.5px] text-foreground font-medium border border-border/40">
                    {recipe.appliance}
                  </span>
                </div>
                <h4 className="mt-2 text-[14px] font-bold text-foreground line-clamp-1">
                  {recipe.title}
                </h4>
                {insight && (
                  <p className="mt-1 text-[11.5px] leading-normal text-muted-foreground line-clamp-2">
                    {insight}
                  </p>
                )}
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.015 }}
                transition={{ type: 'spring', stiffness: 520, damping: 26 }}
                onClick={() => handleSaveToPlan(recipe.slug)}
                className={`mt-3 flex min-h-10 cursor-pointer items-center justify-center gap-1.5 py-1.5 text-[12px] font-bold transition-colors select-none ${
                  isSaved
                    ? 'rounded-full bg-primary text-primary-foreground shadow-xs'
                    : 'rounded-full bg-card text-foreground border border-border/80 hover:border-primary/50'
                }`}
              >
                {isSaved ? <Check className="size-3.5" /> : <CookingPot className="size-3.5 text-primary" />}
                <span>{isSaved ? 'Planned!' : 'Plan for Today'}</span>
              </motion.button>
            </div>
          )
        })}
      </div>
    </motion.section>
  )
}
