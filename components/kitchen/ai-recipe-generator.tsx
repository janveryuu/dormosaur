'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Sparkles, Wand2, Plus, Check } from 'lucide-react'
import { AiRecipeModal, type GeneratedRecipe } from './ai-recipe-modal'

import { useSchedule } from '@/components/schedule-provider'

const presetIngredients = [
  { name: 'Eggs', emoji: '🥚' },
  { name: 'Rice', emoji: '🍚' },
  { name: 'Instant Ramen', emoji: '🍜' },
  { name: 'Bread', emoji: '🍞' },
  { name: 'Cheese', emoji: '🧀' },
  { name: 'Peanut Butter', emoji: '🥜' },
  { name: 'Canned Tuna', emoji: '🥫' },
  { name: 'Kimchi', emoji: '🥬' },
]

const presetAppliances = [
  { name: 'Microwave', id: 'microwave', icon: '⚡' },
  { name: 'Kettle', id: 'kettle', icon: '🫖' },
  { name: 'Rice Cooker', id: 'rice_cooker', icon: '🍲' },
  { name: 'Induction Burner', id: 'induction_burner', icon: '🔥' },
]

export function AiRecipeGenerator() {
  const { profile } = useSchedule()
  const [selectedIngredients, setSelectedIngredients] = React.useState<string[]>(['Eggs', 'Rice'])

  // Map student profile appliances to preset appliance names
  const initialAppliances = React.useMemo(() => {
    const studentApps = profile.appliances || ['microwave', 'kettle']
    const map: Record<string, string> = {
      microwave: 'Microwave',
      kettle: 'Kettle',
      rice_cooker: 'Rice Cooker',
      induction_burner: 'Induction Burner',
    }
    const matched = studentApps.map((a) => map[a]).filter(Boolean)
    return matched.length > 0 ? matched : ['Microwave']
  }, [profile.appliances])

  const [selectedAppliances, setSelectedAppliances] = React.useState<string[]>(initialAppliances)

  React.useEffect(() => {
    setSelectedAppliances(initialAppliances)
  }, [initialAppliances])
  const [customPrompt, setCustomPrompt] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [generatedRecipe, setGeneratedRecipe] = React.useState<GeneratedRecipe | null>(null)

  const toggleIngredient = (name: string) => {
    setError(null)
    setSelectedIngredients((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    )
  }

  const toggleAppliance = (name: string) => {
    setError(null)
    setSelectedAppliances((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    )
  }

  const handleGenerate = async (queryText?: string) => {
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: selectedIngredients,
          appliances: selectedAppliances,
          prompt: queryText || customPrompt,
        }),
      })

      const data = await res.json()
      if (res.ok && data.recipe) {
        setGeneratedRecipe(data.recipe as GeneratedRecipe)
      } else {
        setError(data.error || 'Unable to generate recipe right now. Please try again.')
      }
    } catch (err) {
      console.error('Failed to generate AI recipe:', err)
      setError('Connection error — please check network connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-border/80 bg-card p-5 shadow-ios">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <img
              src="/chef-dormosaur.png"
              alt="Chef Dormosaur"
              className="size-14 sm:size-16 object-contain filter drop-shadow-sm shrink-0 transition-transform hover:scale-105"
            />
            <div>
              <h3 className="text-[16px] font-extrabold tracking-tight text-foreground">
                Dormosaur Dish-covery
              </h3>
              <p className="text-[12px] text-muted-foreground">
                Generate real, delicious dorm meals from what&apos;s on hand
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 shrink-0">
            Llama 3
          </span>
        </div>

        {/* Ingredient Chips Selector */}
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground block mb-2">
            Select what you have:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presetIngredients.map((ing) => {
              const active = selectedIngredients.includes(ing.name)
              return (
                <button
                  key={ing.name}
                  type="button"
                  onClick={() => toggleIngredient(ing.name)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-all ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]'
                      : 'bg-fill text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{ing.emoji}</span>
                  <span>{ing.name}</span>
                  {active && <Check className="size-3 stroke-[3]" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Appliance Pills Selector */}
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground block mb-2">
            Available Appliances:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presetAppliances.map((app) => {
              const active = selectedAppliances.includes(app.name)
              return (
                <button
                  key={app.name}
                  type="button"
                  onClick={() => toggleAppliance(app.name)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all ${
                    active
                      ? 'border border-primary/40 bg-primary/10 text-primary'
                      : 'border border-border bg-card text-muted-foreground'
                  }`}
                >
                  <span>{app.icon}</span>
                  <span>{app.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom Prompt Input & Error Banner */}
        <div className="flex flex-col gap-2 pt-1">
          <input
            value={customPrompt}
            onChange={(e) => {
              setError(null)
              setCustomPrompt(e.target.value)
            }}
            placeholder='Or type custom: "I have eggs, kimchi, and leftover rice..."'
            className="w-full rounded-2xl border border-border bg-fill px-4 py-2.5 text-[13px] outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
          />

          {error && (
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-[12.5px] font-medium text-rose-800 dark:text-rose-200">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => handleGenerate()}
                className="shrink-0 rounded-full bg-rose-600 px-3 py-1 text-[11.5px] font-bold text-white shadow-xs hover:bg-rose-700 transition-all"
              >
                Try Again
              </button>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => handleGenerate()}
            disabled={loading}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-[14.5px] font-semibold text-white shadow-ios hover:bg-[#1a6148] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Activity className="size-4 animate-spin" />
                Chef Dormosaur is cooking your recipe...
              </>
            ) : (
              <>
                <Sparkles className="size-4.5" />
                Generate Dorm Recipe
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Generated Recipe Modal */}
      <AiRecipeModal
        recipe={generatedRecipe}
        onClose={() => setGeneratedRecipe(null)}
      />
    </>
  )
}
