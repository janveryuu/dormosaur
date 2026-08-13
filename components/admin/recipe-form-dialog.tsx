'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { MealType, Recipe } from '@/lib/admin-recipes'

const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert']

export type RecipeDraft = Omit<Recipe, 'id' | 'views'>

function recipeToDraft(recipe?: Recipe): RecipeDraft {
  if (!recipe) {
    return {
      name: '',
      description: '',
      image: '/placeholder.jpg',
      mealType: 'Lunch',
      costUSD: 2.0,
      cookTimeMinutes: 15,
      servings: 1,
      dietaryTags: ['Budget Friendly'],
      ingredients: ['1 cup Rice'],
      instructions: ['Cook and serve hot.'],
    }
  }
  return {
    name: recipe.name,
    description: recipe.description,
    image: recipe.image || '/placeholder.jpg',
    mealType: recipe.mealType,
    costUSD: recipe.costUSD,
    cookTimeMinutes: recipe.cookTimeMinutes,
    servings: recipe.servings,
    dietaryTags: recipe.dietaryTags,
    ingredients: recipe.ingredients || [],
    instructions: recipe.instructions || [],
  }
}

export function RecipeFormDialog({
  open,
  onOpenChange,
  recipe,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipe?: Recipe
  onSave: (recipe: Recipe) => void
}) {
  const [draft, setDraft] = useState<RecipeDraft>(() => recipeToDraft(recipe))

  useEffect(() => {
    if (open) setDraft(recipeToDraft(recipe))
  }, [open, recipe])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const saved: Recipe = {
      id: recipe?.id ?? draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: draft.name,
      description: draft.description,
      image: draft.image,
      mealType: draft.mealType,
      costUSD: draft.costUSD,
      cookTimeMinutes: draft.cookTimeMinutes,
      servings: draft.servings,
      dietaryTags: draft.dietaryTags,
      ingredients: draft.ingredients,
      instructions: draft.instructions,
      views: recipe?.views ?? 1,
    }
    onSave(saved)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{recipe ? 'Edit Recipe' : 'Add New Recipe'}</DialogTitle>
          <DialogDescription>
            {recipe
              ? 'Update the recipe cost, cook time, and description for the student kitchen.'
              : 'Add a new student meal recipe to the kitchen library.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground">Recipe Name</label>
            <Input
              required
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="e.g. Adobo Rice Bowl"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground">Description</label>
            <Textarea
              required
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="A short description of the recipe."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-foreground">Meal Type</label>
              <Select
                value={draft.mealType}
                onValueChange={(v) => setDraft((d) => ({ ...d, mealType: v as MealType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-foreground">Cost (USD $)</label>
              <Input
                type="number"
                min={0}
                step={0.1}
                required
                value={draft.costUSD}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, costUSD: Number(e.target.value) }))
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-foreground">Cook Time (minutes)</label>
              <Input
                type="number"
                min={1}
                required
                value={draft.cookTimeMinutes}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, cookTimeMinutes: Number(e.target.value) }))
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-foreground">Servings</label>
              <Input
                type="number"
                min={1}
                required
                value={draft.servings}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, servings: Number(e.target.value) }))
                }
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{recipe ? 'Save Changes' : 'Add Recipe'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
