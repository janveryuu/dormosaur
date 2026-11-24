import { recipeData, recipeImages } from './recipes.generated'

export const RECIPE_MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Drink', 'Dessert'] as const
export const APPLIANCES = ['Microwave', 'Rice cooker', 'Kettle', 'Hot plate', 'No cook'] as const

type RecipeMeal = typeof RECIPE_MEALS[number]
type Appliance = typeof APPLIANCES[number]

export type Ingredient = {
  name: string
  amount: number
  unit: 'g' | 'ml' | 'pc' | 'tsp' | 'tbsp' | 'cup' | 'pinch' | 'pack' | 'can'
  aisle: 'Produce' | 'Protein' | 'Dairy & eggs' | 'Grains & bread' | 'Pantry'
}

export type RecipeStep = {
  text: string
  minutes: number
  phase: 'prep' | 'cook' | 'rest'
  timer?: boolean
}

type RecipeData = {
  slug: string
  title: string
  meal: RecipeMeal
  mealTypes?: RecipeMeal[]
  appliance: Appliance
  servings: number
  costPHP: number
  blurb: string
  ingredients: Ingredient[]
  steps: RecipeStep[]
  allergens: string[]
  searchTerms: string[]
  tip?: string
  addedOn?: string
}

export type Recipe = RecipeData & {
  image: number
  placeholder: string
  minutes: number
  prepMinutes: number
  cookMinutes: number
  restMinutes: number
  cost: string
}

const pesos = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0, minimumFractionDigits: 0 })
export const formatPesos = (amount: number) => pesos.format(amount)

export function formatRecipeTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} min`
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

export const recipes: Recipe[] = (recipeData as RecipeData[]).map(recipe => {
  const [image, placeholder] = recipeImages[recipe.slug]
  const times = { prep: 0, cook: 0, rest: 0 }
  for (const step of recipe.steps) times[step.phase] += step.minutes
  return {
    ...recipe, image, placeholder,
    minutes: times.prep + times.cook + times.rest,
    prepMinutes: times.prep,
    cookMinutes: times.cook,
    restMinutes: times.rest,
    cost: formatPesos(recipe.costPHP),
  }
})

export const recipeBySlug = new Map(recipes.map(recipe => [recipe.slug, recipe]))
export const recipeMatchesMeal = (recipe: Recipe, meal: RecipeMeal) => recipe.meal === meal || Boolean(recipe.mealTypes?.includes(meal))
