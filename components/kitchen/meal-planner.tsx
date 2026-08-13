'use client'

import * as React from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Banknote, Plus, Trash2, X } from 'lucide-react'
import { PillButton } from '@/components/ios/pill-button'
import { useSchedule, type MealPlanEntry } from '@/components/schedule-provider'
import { recipes, weekDays } from '@/lib/data'

const meals: MealPlanEntry['meal'][] = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

export function MealPlanner() {
  const { mealPlan, setMealPlanItem, removeMealPlanItem } = useSchedule()
  const [selectedSlot, setSelectedSlot] = React.useState<{
    day: string
    meal: MealPlanEntry['meal']
  } | null>(null)

  // Calculate estimated total weekly budget
  const totalCost = React.useMemo(() => {
    let sum = 0
    mealPlan.forEach((plan) => {
      const r = recipes.find((item) => item.slug === plan.recipeSlug)
      if (r) {
        const val = parseFloat(r.cost.replace('$', ''))
        if (!isNaN(val)) sum += val
      }
    })
    return sum.toFixed(2)
  }, [mealPlan])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-3xl bg-card p-5 shadow-ios">
        <div>
          <h3 className="text-[17px] font-bold tracking-[-0.02em]">Weekly Dorm Food Budget</h3>
          <p className="mt-0.5 text-[13.5px] text-muted-foreground">
            Estimated cost for {mealPlan.length} planned meals
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl bg-accent px-4 py-2 text-[20px] font-bold tracking-[-0.02em] text-accent-foreground">
          <Banknote className="size-5 text-primary" strokeWidth={2.2} />=${totalCost}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {weekDays.map((day) => {
          const dayPlans = mealPlan.filter((p) => p.day === day)

          return (
            <div key={day} className="rounded-3xl bg-card p-5 shadow-ios">
              <div className="flex items-baseline justify-between border-b border-separator pb-3">
                <h4 className="text-[17px] font-bold tracking-[-0.02em]">{day}</h4>
                <span className="text-[12.5px] font-medium text-muted-foreground">
                  {dayPlans.length} {dayPlans.length === 1 ? 'meal' : 'meals'}
                </span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {meals.map((meal) => {
                  const entry = dayPlans.find((p) => p.meal === meal)
                  const recipe = entry
                    ? recipes.find((r) => r.slug === entry.recipeSlug)
                    : null

                  return (
                    <div
                      key={meal}
                      className="flex flex-col justify-between rounded-2xl bg-fill p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11.5px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                          {meal}
                        </span>
                        {entry && (
                          <button
                            onClick={() => removeMealPlanItem(day, meal)}
                            aria-label={`Remove ${meal} for ${day}`}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>

                      {recipe ? (
                        <div className="mt-2 flex items-center gap-2.5">
                          <div className="relative size-11 shrink-0 overflow-hidden rounded-xl">
                            <Image
                              src={recipe.image}
                              alt={recipe.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13.5px] font-semibold tracking-[-0.01em]">
                              {recipe.title}
                            </p>
                            <p className="text-[12px] text-muted-foreground">
                              {recipe.minutes}m · {recipe.cost}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedSlot({ day, meal })}
                          className="mt-3 flex h-11 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-card text-[13px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
                        >
                          <Plus className="size-4" />
                          Plan Recipe
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Recipe Select Modal */}
      <AnimatePresence>
        {selectedSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSlot(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="ios-glass relative z-10 w-full max-w-lg overflow-hidden rounded-4xl border border-border p-6 shadow-ios-lg"
            >
              <div className="flex items-center justify-between border-b border-separator pb-3">
                <div>
                  <h3 className="text-[18px] font-bold tracking-[-0.02em]">
                    Plan {selectedSlot.meal} for {selectedSlot.day}
                  </h3>
                  <p className="text-[13px] text-muted-foreground">Select a dorm recipe</p>
                </div>
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="flex size-8 items-center justify-center rounded-full bg-fill text-muted-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-4 max-h-80 overflow-y-auto pr-1">
                <div className="grid gap-2 sm:grid-cols-2">
                  {recipes.map((r) => (
                    <button
                      key={r.slug}
                      onClick={() => {
                        setMealPlanItem(selectedSlot.day, selectedSlot.meal, r.slug)
                        setSelectedSlot(null)
                      }}
                      className="flex items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-ios hover:ring-2 hover:ring-primary focus-visible:outline-none"
                    >
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl">
                        <Image src={r.image} alt={r.title} fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold">{r.title}</p>
                        <p className="text-[12px] text-muted-foreground">
                          {r.minutes} min · {r.cost}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
