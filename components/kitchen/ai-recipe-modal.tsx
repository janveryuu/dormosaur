'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Lightbulb,
  Plus,
  ShoppingBag,
  Sparkles,
  Users,
  Utensils,
  X,
} from 'lucide-react'
import { useSchedule } from '@/components/schedule-provider'

export type GeneratedRecipe = {
  title: string
  slug: string
  cook_time_minutes: number
  servings: number
  appliances: string[]
  ingredients: string[]
  steps: { text: string; duration_minutes: number }[]
  dorm_tip?: string
}

interface Props {
  recipe: GeneratedRecipe | null
  onClose: () => void
}

import { buttonTapScale, springSmooth } from '@/lib/motion-presets'

export function AiRecipeModal({ recipe, onClose }: Props) {
  const { setMealPlanItem, addCustomGroceryItem } = useSchedule()
  const [completedSteps, setCompletedSteps] = React.useState<Record<number, boolean>>({})
  const [savedMealPlan, setSavedMealPlan] = React.useState(false)
  const [addedGrocery, setAddedGrocery] = React.useState(false)

  React.useEffect(() => {
    setCompletedSteps({})
    setSavedMealPlan(false)
    setAddedGrocery(false)
  }, [recipe])

  if (!recipe) return null

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  const handleSaveToMealPlan = () => {
    // Add to Monday dinner or today's dinner
    setMealPlanItem('Mon', 'Dinner', recipe.slug)
    setSavedMealPlan(true)
    setTimeout(() => setSavedMealPlan(false), 3000)
  }

  const handleAddGrocery = () => {
    recipe.ingredients.forEach((ing) => addCustomGroceryItem(ing))
    setAddedGrocery(true)
    setTimeout(() => setAddedGrocery(false), 3000)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={springSmooth}
          className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl no-scrollbar"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4.5" />
          </button>

          {/* Chef Dormosaur Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[11.5px] font-bold text-emerald-800 dark:text-emerald-300">
            <img src="/chef-dormosaur.png" alt="Chef Dormosaur" className="size-5 object-contain" />
            <span>CHEF DORMSAUR DISH-COVERY</span>
          </div>

          {/* Title */}
          <h2 className="mt-3 text-[22px] font-bold tracking-tight text-foreground leading-snug">
            {recipe.title}
          </h2>

          {/* Recipe Meta Badges */}
          <div className="mt-4 flex flex-wrap gap-2 text-[12.5px] font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5 rounded-xl bg-fill px-3 py-1.5">
              <Clock className="size-4 text-primary" /> {recipe.cook_time_minutes} mins
            </span>
            <span className="flex items-center gap-1.5 rounded-xl bg-fill px-3 py-1.5">
              <Users className="size-4 text-primary" /> {recipe.servings} serving{recipe.servings > 1 ? 's' : ''}
            </span>
            {recipe.appliances.map((app) => (
              <span key={app} className="flex items-center gap-1.5 rounded-xl bg-primary/10 text-primary font-semibold px-3 py-1.5">
                <Utensils className="size-3.5" /> {app}
              </span>
            ))}
          </div>

          {/* Ingredients Section */}
          <div className="mt-6 rounded-2xl border border-border/60 bg-fill p-4">
            <h3 className="text-[13px] font-bold tracking-wide uppercase text-muted-foreground mb-2.5">
              Ingredients Needed
            </h3>
            <ul className="space-y-1.5">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-center gap-2.5 text-[13.5px] font-medium text-foreground">
                  <span className="size-1.5 rounded-full bg-primary shrink-0" />
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="mt-6">
            <h3 className="text-[13px] font-bold tracking-wide uppercase text-muted-foreground mb-3">
              Step-by-Step Instructions ({recipe.steps.length})
            </h3>
            <div className="space-y-2.5">
              {recipe.steps.map((step, idx) => {
                const done = !!completedSteps[idx]
                return (
                  <div
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className={`flex items-start gap-3 rounded-2xl border p-3.5 cursor-pointer transition-all ${
                      done
                        ? 'border-primary/40 bg-primary/5 opacity-75'
                        : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    <button
                      type="button"
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full border mt-0.5 transition-colors ${
                        done
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/40 bg-transparent text-transparent'
                      }`}
                    >
                      <Check className="size-3.5 stroke-[3]" />
                    </button>
                    <div className="flex-1 text-[13.5px] leading-relaxed font-medium">
                      <span className={done ? 'line-through text-muted-foreground' : 'text-foreground'}>
                        {step.text}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Dorm Tip */}
          {recipe.dorm_tip && (
            <div className="mt-5 flex gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-4 text-emerald-950 dark:text-emerald-200">
              <img src="/chef-dormosaur.png" alt="Chef Dormosaur" className="mt-0.5 size-9 shrink-0 object-contain drop-shadow-xs" />
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Chef Dormosaur Tip</p>
                <p className="mt-0.5 text-[13px] leading-relaxed font-medium">{recipe.dorm_tip}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={handleAddGrocery}
              className="flex items-center justify-center gap-1.5 rounded-full border border-border bg-fill py-3 text-[13.5px] font-semibold text-foreground hover:bg-secondary active:scale-95 transition-all"
            >
              {addedGrocery ? <CheckCircle2 className="size-4 text-primary" /> : <ShoppingBag className="size-4" />}
              {addedGrocery ? 'Added to Grocery!' : 'Add to Grocery'}
            </button>
            <button
              onClick={handleSaveToMealPlan}
              className="flex items-center justify-center gap-1.5 rounded-full bg-primary py-3 text-[13.5px] font-semibold text-white shadow-ios hover:bg-[#1a6148] active:scale-95 transition-all"
            >
              {savedMealPlan ? <Check className="size-4" /> : <Plus className="size-4" />}
              {savedMealPlan ? 'Saved to Plan!' : 'Save to Meal Plan'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
