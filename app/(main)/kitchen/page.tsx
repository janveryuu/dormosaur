'use client'

import * as React from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, CalendarDays, Clock, CookingPot, Moon, Search, ShoppingCart, Sandwich, Sparkles, Sun, Utensils, X } from 'lucide-react'
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
  { value: 'planner', label: 'Meal Plan' },
  { value: 'grocery', label: 'Grocery' },
] as const

const meals = [
  { value: 'all', label: 'All' },
  { value: 'Breakfast', label: 'Breakfast' },
  { value: 'Lunch', label: 'Lunch' },
  { value: 'Dinner', label: 'Dinner' },
  { value: 'Snack', label: 'Snack' },
] as const

const appliances = ['Microwave', 'Rice cooker', 'Kettle', 'Hot plate', 'No cook']
const mobileViewIcons = { recipes: BookOpen, 'schedule-aware': CookingPot, planner: CalendarDays, grocery: ShoppingCart }

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
      <div className="hidden sm:block"><ScreenHeader
        eyebrow="Micro-Cooking"
        title="Dorm Kitchen"
        subtitle="Student-tested recipes for microwaves, electric kettles & rice cookers."
      /></div>

      <div className="mobile-page-intro mobile-kitchen-intro sm:hidden"><p className="mobile-eyebrow">Dorm kitchen</p><h1>Dorm Kitchen</h1><p>Simple, tasty meals for your space.</p><Image src="/chef-dormosaur.png" alt="Dormosaur in a chef hat" width={150} height={150} className="mobile-kitchen-mascot" /></div>
      <div className="mobile-kitchen-setup sm:hidden"><div className="mobile-kitchen-setup-title"><Utensils className="size-5" /><span>Your setup</span><Link href="/profile">Edit</Link></div><div className="mobile-kitchen-setup-chips">{studentAppliances.map((item) => <span key={item}>{item.replace(/_/g, ' ')}</span>)}</div></div>

      <section className="kitchen-summary hidden sm:flex" aria-label="Kitchen overview">
        <div>
          <p className="route-label">Dorm life, served</p>
          <h2>Cook something that fits your day.</h2>
          <p className="kitchen-summary-copy">Fast, affordable recipes for the space and appliances you actually have.</p>
        </div>
        <div className="kitchen-setup-note">
          <Utensils className="size-5" />
          <div><span>Your setup</span><strong>{formatApplianceSummary(studentAppliances)}</strong></div>
        </div>
      </section>

      <div className="mobile-kitchen-tiles sm:hidden" role="tablist" aria-label="Kitchen sections">{[mainViews[0], mainViews[2], mainViews[3], mainViews[1]].map((item) => { const Icon = mobileViewIcons[item.value]; return <button key={item.value} type="button" role="tab" aria-selected={view === item.value} onClick={() => setView(item.value)} className={view === item.value ? 'is-active' : ''}><Icon /><span>{item.label}</span></button> })}</div>

      <div className="kitchen-view-toolbar hidden sm:flex">
        <div>
          <p className="route-label">Kitchen board</p>
          <p className="mt-1 text-xs text-muted-foreground">Choose how you want to plan the next meal.</p>
        </div>
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
            className="kitchen-recipes-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          >
            {/* Dorm Setup Feasibility Banner */}
            <div className="kitchen-setup-banner">
              {studentAppliances.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <span className="size-2 shrink-0 bg-primary" />
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
              <div className="kitchen-dietary-note">
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

            <div className="mobile-generator-order"><AiRecipeGenerator /></div>

            <div className="mobile-kitchen-filters flex flex-col gap-4">
              <label className="kitchen-search">
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

              <div className="-mx-4 sm:-mx-6 md:-mx-8 lg:mx-0 flex gap-2 overflow-x-auto px-4 sm:px-6 md:px-8 pb-1 lg:px-0 [&::-webkit-scrollbar]:hidden">
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

            {filtered.length > 0 && <section className="mobile-featured-recipe sm:hidden"><div className="mobile-section-title"><h2>{query || meal !== 'all' || appliance ? 'Recipes for you' : 'Featured Recipe'}</h2><button type="button" onClick={() => setShowAllSession((value) => !value)}>{showAllSession ? 'Fits setup' : 'See all'}</button></div><Link href={`/kitchen/${filtered[0].slug}`} className="mobile-featured-card"><div className="mobile-featured-photo"><Image src={filtered[0].image} alt={filtered[0].title} fill sizes="45vw" /></div><div className="mobile-featured-content"><span className="mobile-featured-badge">Popular</span><h3>{filtered[0].title}</h3><p><Clock className="size-4" /> {filtered[0].minutes} min <Utensils className="size-4" /> Easy</p><span>{filtered[0].appliance}</span></div></Link></section>}
            <section className="mobile-quick-ideas sm:hidden"><div className="mobile-section-title"><h2>Quick Ideas</h2></div>{filtered.length > 1 ? <div className="mobile-quick-grid">{filtered.slice(1).map((recipe, i) => <RecipeCard key={recipe.slug} recipe={recipe} index={i} />)}</div> : <p className="text-sm text-muted-foreground">Try another category for more ideas.</p>}</section>

            {/* Recommended for your country section — Meal-Appropriate Curation */}
            {recommendedRecipes.length > 0 && (
              <div className="mt-7 mb-6 hidden flex-col gap-6 sm:flex">
                <div className="flex items-center justify-between px-1">
                  <span className="kitchen-recommendation">
                    <Sparkles className="size-3.5" />
                    Recommended for {countryData.flag} {countryData.name} Dorm Students
                  </span>
                </div>

                {/* Sub-row 1: Breakfast Picks */}
                {recommendedRecipes.some((r) => r.mealType === 'breakfast' || r.mealTypes?.includes('breakfast')) && (
                  <div>
                    <h3 className="mb-2.5 px-1 text-[13.5px] font-bold text-foreground flex items-center gap-1.5">
                      <Sun className="size-4 text-amber-500" aria-hidden="true" /> Breakfast Picks
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
                      <Sandwich className="size-4 text-amber-600" aria-hidden="true" /> Lunch Picks
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
                      <Moon className="size-4 text-indigo-500" aria-hidden="true" /> Dinner Picks
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

            <p className="mt-6 mb-3 hidden px-1 text-[13px] font-semibold tracking-[0.04em] text-muted-foreground uppercase sm:block">
              {recommendedRecipes.length > 0 ? 'All Dorm Recipes' : `${filtered.length} ${filtered.length === 1 ? 'recipe' : 'recipes'}`}
            </p>

            {remainingRecipes.length > 0 ? (
              <div className="hidden grid-cols-2 gap-4 sm:grid lg:grid-cols-3">
                {remainingRecipes.map((recipe, i) => (
                  <RecipeCard key={recipe.slug} recipe={recipe} index={i} />
                ))}
              </div>
            ) : (
              <div className="schedule-empty-state gap-3 px-6 py-14">
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
