'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Utensils, Sparkles, X } from 'lucide-react'
import { ScreenHeader } from '@/components/ios/screen-header'
import { SegmentedControl, FilterChip } from '@/components/ios/segmented-control'
import { RecipeCard } from '@/components/kitchen/recipe-card'
import { MealPlanner } from '@/components/kitchen/meal-planner'
import { GroceryList } from '@/components/kitchen/grocery-list'
import { AiRecipeGenerator } from '@/components/kitchen/ai-recipe-generator'
import { ScheduleAwareTab } from '@/components/kitchen/schedule-aware-tab'
import { useSchedule } from '@/components/schedule-provider'
import Link from 'next/link'
import { getCountryByCode } from '@/lib/countries-data'
import { recipes } from '@/lib/data'
import {
  getFeasibleRecipes,
  getDietaryFilteredRecipes,
  formatApplianceSummary,
  formatDietarySummary,
  type ApplianceType,
  type DietaryPreference,
} from '@/lib/appliances-data'

const mainViews = [
  { value: 'recipes', label: 'Recipes' },
  { value: 'schedule-aware', label: 'Fits Schedule' },
  { value: 'planner', label: 'Meal Planner' },
  { value: 'grocery', label: 'Grocery List' },
] as const

const meals = [
  { value: 'all', label: 'All' },
  { value: 'Breakfast', label: 'Breakfast' },
  { value: 'Lunch', label: 'Lunch' },
  { value: 'Dinner', label: 'Dinner' },
  { value: 'Snack', label: 'Snack' },
] as const

const appliances = ['Microwave', 'Rice cooker', 'Kettle', 'Hot plate', 'No cook']

export default function KitchenPage() {
  const { profile } = useSchedule()
  const [view, setView] = React.useState<(typeof mainViews)[number]['value']>('recipes')
  const [meal, setMeal] = React.useState<(typeof meals)[number]['value']>('all')
  const [appliance, setAppliance] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState('')
  const [showAllSession, setShowAllSession] = React.useState(false)
  const [dismissedDietaryChip, setDismissedDietaryChip] = React.useState(false)

  const countryData = getCountryByCode(profile.country)
  const studentAppliances = (profile.appliances || ['microwave', 'kettle']) as ApplianceType[]
  const studentDietaryPref = (profile.dietary_preference || 'none') as DietaryPreference
  const studentDietaryNote = profile.dietary_note || ''

  // Step 1: Apply feasibility & dietary filtering by default (unless user toggled "See all recipes" for session)
  const baseRecipes = showAllSession
    ? recipes
    : getDietaryFilteredRecipes(getFeasibleRecipes(recipes, studentAppliances), studentDietaryPref)

  // Step 2: Apply meal, appliance, and search filters
  const filtered = baseRecipes.filter((r) => {
    if (meal !== 'all') {
      const targetMeal = meal.toLowerCase() as any
      const matchesMeal =
        r.mealType === targetMeal ||
        r.mealTypes?.includes(targetMeal) ||
        r.meal.toLowerCase() === targetMeal
      if (!matchesMeal) return false
    }
    if (appliance && r.appliance !== appliance) return false
    if (query && !`${r.title} ${r.blurb}`.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  // Partition recipes by regional recommendation & meal-types when no specific search query active
  const userCountryCode = profile.country || 'PH'
  const isDefaultView = meal === 'all' && !appliance && !query

  const recommendedRecipes = isDefaultView
    ? filtered.filter(
        (r) =>
          r.countryTags?.includes(userCountryCode) ||
          r.cuisine_region?.toLowerCase() === countryData.cuisineRegion.toLowerCase() ||
          (countryData.cuisineRegion === 'Asian' && r.cuisine_region === 'Asian') ||
          (countryData.cuisineRegion === 'American' && r.cuisine_region === 'American'),
      )
    : []

  const remainingRecipes = isDefaultView
    ? filtered.filter((r) => !recommendedRecipes.some((rec) => rec.slug === r.slug))
    : filtered

  return (
    <div className="pb-4">
      <ScreenHeader
        eyebrow="Dorm kitchen"
        title="Cook something in the gap between classes"
        subtitle="Every recipe here fits a dorm: one appliance, few ingredients, under an hour."
        headerGraphic={
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="relative flex items-center justify-center shrink-0"
          >
            <img
              src="/chef-dormosaur.png"
              alt="Chef Dormosaur"
              className="h-24 sm:h-32 md:h-36 w-auto object-contain filter drop-shadow-md hover:scale-105 transition-transform"
            />
          </motion.div>
        }
      />

      <div className="mb-6">
        <SegmentedControl
          options={[...mainViews]}
          value={view}
          onChange={(v) => setView(v as typeof view)}
          layoutId="kitchen-main-tab"
        />
      </div>

      <AnimatePresence mode="wait">
        {view === 'recipes' && (
          <motion.div
            key="recipes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          >
            {/* Dorm Setup Feasibility Banner */}
            <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-card border border-border/50 p-3.5 shadow-sm text-[13.5px]">
              {studentAppliances.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <span className="flex size-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>
                      Showing {studentDietaryPref !== 'none' && studentDietaryPref !== 'other' ? `${formatDietarySummary(studentDietaryPref)} ` : ''}recipes for your dorm setup ({formatApplianceSummary(studentAppliances)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAllSession((prev) => !prev)}
                    className="font-semibold text-primary hover:underline"
                  >
                    {showAllSession ? 'Filter by my setup' : 'See all recipes'}
                  </button>
                </>
              ) : (
                <div className="flex w-full items-center justify-between gap-2 text-amber-600 dark:text-amber-400 font-medium">
                  <span>Got a microwave or kettle? Update your kitchen setup in Settings to unlock more recipes.</span>
                  <Link href="/profile" className="font-bold underline text-[13px] shrink-0">
                    Update Settings
                  </Link>
                </div>
              )}
            </div>

            {/* Free-text Dietary Reminder Chip */}
            {studentDietaryPref === 'other' && studentDietaryNote && !dismissedDietaryChip && (
              <div className="mb-4 flex items-center justify-between gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 text-[13.5px] text-emerald-800 dark:text-emerald-300 font-medium shadow-sm">
                <span>Remember: {studentDietaryNote}</span>
                <button
                  type="button"
                  onClick={() => setDismissedDietaryChip(true)}
                  className="rounded-full p-1 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            <AiRecipeGenerator />

            <div className="flex flex-col gap-4">
              <label className="flex h-11 items-center gap-2.5 rounded-full bg-fill px-4">
                <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={2.2} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search recipes"
                  className="w-full bg-transparent text-[15px] placeholder:text-muted-foreground focus:outline-none"
                />
                <span className="sr-only">Search recipes</span>
              </label>

              <SegmentedControl options={[...meals]} value={meal} onChange={setMeal} layoutId="meal" />

              <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
                {appliances.map((a) => (
                  <FilterChip
                    key={a}
                    label={a}
                    active={appliance === a}
                    onClick={() => setAppliance(appliance === a ? null : a)}
                  />
                ))}
              </div>
            </div>

            {/* Recommended for your country section — Meal-Appropriate Curation */}
            {recommendedRecipes.length > 0 && (
              <div className="mt-7 mb-6 flex flex-col gap-6">
                <div className="flex items-center justify-between px-1">
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 py-1 text-[13px] font-extrabold text-emerald-800 dark:text-emerald-300 shadow-xs">
                    <Sparkles className="size-3.5" />
                    Recommended for {countryData.flag} {countryData.name} Dorm Students
                  </span>
                </div>

                {/* Sub-row 1: Breakfast Picks */}
                {recommendedRecipes.some((r) => r.mealType === 'breakfast' || r.mealTypes?.includes('breakfast')) && (
                  <div>
                    <h3 className="mb-2.5 px-1 text-[13.5px] font-bold text-foreground flex items-center gap-1.5">
                      <span>☀️</span> Breakfast Picks
                    </h3>
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                      {recommendedRecipes
                        .filter((r) => r.mealType === 'breakfast' || r.mealTypes?.includes('breakfast'))
                        .map((recipe, i) => (
                          <RecipeCard key={recipe.slug} recipe={recipe} index={i} />
                        ))}
                    </div>
                  </div>
                )}

                {/* Sub-row 2: Lunch Picks */}
                {recommendedRecipes.some((r) => r.mealType === 'lunch' || r.mealTypes?.includes('lunch')) && (
                  <div>
                    <h3 className="mb-2.5 px-1 text-[13.5px] font-bold text-foreground flex items-center gap-1.5">
                      <span>🍱</span> Lunch Picks
                    </h3>
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                      {recommendedRecipes
                        .filter((r) => r.mealType === 'lunch' || r.mealTypes?.includes('lunch'))
                        .map((recipe, i) => (
                          <RecipeCard key={recipe.slug} recipe={recipe} index={i} />
                        ))}
                    </div>
                  </div>
                )}

                {/* Sub-row 3: Dinner Picks */}
                {recommendedRecipes.some((r) => r.mealType === 'dinner' || r.mealTypes?.includes('dinner')) && (
                  <div>
                    <h3 className="mb-2.5 px-1 text-[13.5px] font-bold text-foreground flex items-center gap-1.5">
                      <span>🌙</span> Dinner Picks
                    </h3>
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                      {recommendedRecipes
                        .filter((r) => r.mealType === 'dinner' || r.mealTypes?.includes('dinner'))
                        .map((recipe, i) => (
                          <RecipeCard key={recipe.slug} recipe={recipe} index={i} />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="mt-6 mb-3 px-1 text-[13px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
              {recommendedRecipes.length > 0 ? 'All Dorm Recipes' : `${filtered.length} ${filtered.length === 1 ? 'recipe' : 'recipes'}`}
            </p>

            {remainingRecipes.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                {remainingRecipes.map((recipe, i) => (
                  <RecipeCard key={recipe.slug} recipe={recipe} index={i} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-3xl bg-card px-6 py-14 text-center shadow-ios">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-fill">
                  <Utensils className="size-5 text-muted-foreground" strokeWidth={2.2} />
                </span>
                <p className="text-[16px] font-semibold">Nothing matches those filters</p>
                <p className="max-w-xs text-[14px] leading-relaxed text-muted-foreground">
                  Try clearing the appliance filter or searching for a different ingredient.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {view === 'schedule-aware' && (
          <motion.div
            key="schedule-aware"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          >
            <ScheduleAwareTab />
          </motion.div>
        )}

        {view === 'planner' && (
          <motion.div
            key="planner"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          >
            <MealPlanner />
          </motion.div>
        )}

        {view === 'grocery' && (
          <motion.div
            key="grocery"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          >
            <GroceryList />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
