'use client'

import * as React from 'react'
import { Search, Utensils } from 'lucide-react'
import { ScreenHeader } from '@/components/ios/screen-header'
import { SegmentedControl, FilterChip } from '@/components/ios/segmented-control'
import { RecipeCard } from '@/components/kitchen/recipe-card'
import { recipes } from '@/lib/data'

const meals = [
  { value: 'all', label: 'All' },
  { value: 'Breakfast', label: 'Breakfast' },
  { value: 'Lunch', label: 'Lunch' },
  { value: 'Dinner', label: 'Dinner' },
  { value: 'Snack', label: 'Snack' },
] as const

const appliances = ['Microwave', 'Rice cooker', 'Kettle', 'Hot plate', 'No cook']

export default function KitchenPage() {
  const [meal, setMeal] = React.useState<(typeof meals)[number]['value']>('all')
  const [appliance, setAppliance] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState('')

  const filtered = recipes.filter((r) => {
    if (meal !== 'all' && r.meal !== meal) return false
    if (appliance && r.appliance !== appliance) return false
    if (query && !`${r.title} ${r.blurb}`.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  return (
    <div className="pb-4">
      <ScreenHeader
        eyebrow="Dorm kitchen"
        title="Cook something in the gap between classes"
        subtitle="Every recipe here fits a dorm: one appliance, few ingredients, under an hour."
      />

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

      <p className="mt-6 mb-3 px-1 text-[13px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
        {filtered.length} {filtered.length === 1 ? 'recipe' : 'recipes'}
      </p>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {filtered.map((recipe, i) => (
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
    </div>
  )
}
