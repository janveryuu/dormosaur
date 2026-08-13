'use client'

import { useMemo, useState } from 'react'
import { Plus, Search, Utensils } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AdminRecipeCard } from '@/components/admin/admin-recipe-card'
import { RecipeFormDialog } from '@/components/admin/recipe-form-dialog'
import { INITIAL_ADMIN_RECIPES, type MealType, type Recipe } from '@/lib/admin-recipes'

const MEAL_FILTERS: (MealType | 'all')[] = [
  'all',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Dessert',
]

export function KitchenGrid() {
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_ADMIN_RECIPES)
  const [query, setQuery] = useState('')
  const [mealType, setMealType] = useState<MealType | 'all'>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Recipe | undefined>(undefined)
  const [deleting, setDeleting] = useState<Recipe | undefined>(undefined)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return recipes.filter((r) => {
      const matchesQuery = !q || r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
      const matchesMeal = mealType === 'all' || r.mealType === mealType
      return matchesQuery && matchesMeal
    })
  }, [recipes, query, mealType])

  function handleSave(recipe: Recipe) {
    setRecipes((prev) => {
      const exists = prev.some((r) => r.id === recipe.id)
      return exists ? prev.map((r) => (r.id === recipe.id ? recipe : r)) : [recipe, ...prev]
    })
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recipes..."
              className="h-10 rounded-full pl-9 bg-background/50"
            />
          </div>
          <Select value={mealType} onValueChange={(v) => setMealType(v as MealType | 'all')}>
            <SelectTrigger className="h-10 w-full rounded-full sm:w-44 bg-background/50">
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
        </div>

        <Button
          className="rounded-full font-bold shadow-xs gap-1.5"
          onClick={() => {
            setEditing(undefined)
            setFormOpen(true)
          }}
        >
          <Plus className="size-4" />
          Add Recipe
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((recipe) => (
          <AdminRecipeCard
            key={recipe.id}
            recipe={recipe}
            onEdit={() => {
              setEditing(recipe)
              setFormOpen(true)
            }}
            onDelete={() => setDeleting(recipe)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-3xl bg-card py-16 text-center text-muted-foreground shadow-ios border border-border/40 flex flex-col items-center gap-2">
          <Utensils className="size-8 text-muted-foreground/40" />
          <p className="font-semibold">No recipes match your search.</p>
        </div>
      )}

      <RecipeFormDialog open={formOpen} onOpenChange={setFormOpen} recipe={editing} onSave={handleSave} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this recipe?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `"${deleting.name}" will be removed from the student kitchen library. This action cannot be undone.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) {
                  setRecipes((prev) => prev.filter((r) => r.id !== deleting.id))
                }
                setDeleting(undefined)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
