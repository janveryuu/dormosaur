'use client'

import { useMemo, useState } from 'react'
import { Search, Utensils, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminRecipeCard } from '@/components/admin/admin-recipe-card'
import type { AdminRecipe, ApplianceType, MealType } from '@/lib/admin-recipes'

const MEAL_FILTERS: (MealType | 'all')[] = [
  'all',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Drink',
  'Dessert',
]

const APPLIANCE_FILTERS: (ApplianceType | 'all')[] = [
  'all',
  'Microwave',
  'Hot plate',
  'Rice cooker',
  'Kettle',
  'No cook',
]

export function KitchenGrid({ recipes }: { recipes: AdminRecipe[] }) {
  const [query, setQuery] = useState('')
  const [mealType, setMealType] = useState<MealType | 'all'>('all')
  const [appliance, setAppliance] = useState<ApplianceType | 'all'>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return recipes.filter((r) => {
      const matchesQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.appliance.toLowerCase().includes(q)
      const matchesMeal = mealType === 'all' || r.mealType === mealType
      const matchesAppliance = appliance === 'all' || r.appliance === appliance
      return matchesQuery && matchesMeal && matchesAppliance
    })
  }, [recipes, query, mealType, appliance])

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 200 mobile recipes..."
              aria-label="Search recipes"
              className="h-10 rounded-full pl-9 pr-8 bg-background/50"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Clear search"
                onClick={() => setQuery('')}
                className="absolute top-1/2 right-1.5 size-7 -translate-y-1/2 rounded-full"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
          <Select value={mealType} onValueChange={(v) => setMealType((v || 'all') as MealType | 'all')}>
            <SelectTrigger aria-label="Filter by meal type" className="h-10 w-full rounded-full sm:w-44 bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEAL_FILTERS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m === 'all' ? 'All meal types' : m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={appliance} onValueChange={(v) => setAppliance((v || 'all') as ApplianceType | 'all')}>
            <SelectTrigger aria-label="Filter by appliance" className="h-10 w-full rounded-full sm:w-44 bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPLIANCE_FILTERS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a === 'all' ? 'All appliances' : a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Badge variant="secondary" className="w-fit rounded-full px-3.5 py-1.5 text-xs font-bold">
          Showing {filtered.length} of {recipes.length} (Read-only catalog)
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((recipe) => (
          <AdminRecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-3xl bg-card py-16 text-center text-muted-foreground shadow-ios border border-border/40 flex flex-col items-center gap-2">
          <Utensils className="size-8 text-muted-foreground/40" />
          <p className="font-semibold">No recipes match your filters.</p>
        </div>
      )}
    </div>
  )
}
