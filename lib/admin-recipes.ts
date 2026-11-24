import originals from '@/mobile/data/kitchen/recipes/originals.json'
import breakfastLunch from '@/mobile/data/kitchen/recipes/breakfast-lunch.json'
import dinnerSnacks from '@/mobile/data/kitchen/recipes/dinner-snacks.json'
import meriendaDrinks from '@/mobile/data/kitchen/recipes/merienda-and-drinks.json'

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Drink' | 'Dessert'
export type ApplianceType = 'Microwave' | 'Hot plate' | 'Rice cooker' | 'No cook' | 'Kettle'

export interface AdminRecipe {
  id: string
  name: string
  mealType: MealType
  appliance: ApplianceType
  description: string
  cookTimeMinutes: number
  servings: number
  costPHP: number
  ingredientCount: number
  image: string | null
}

const RECIPE_IMAGE_SLUGS = new Set([
  'champorado-chocolate-rice',
  'chicken-tinola-soup',
  'corned-beef-rice-bowl',
  'dorm-simple-menudo',
  'garlic-rice-egg-dinner',
  'ginisang-munggo-stew',
  'instant-pancit-canton-egg',
  'kettle-eggs',
  'kettle-poached-eggs',
  'kimchi-fried-rice-mug',
  'luncheon-meat-rice-bowl',
  'microwave-mug-pancakes',
  'monay-with-egg',
  'mug-pancakes',
  'overnight-oats',
  'quick-chicken-adobo-bowl',
  'rice-cooker-congee',
  'rice-cooker-lugaw',
  'sinangag-garlic-rice-egg',
  'sinigang-mug-soup',
  'skillet-quesadilla',
  'taho-overnight-oats',
  'tamago-kake-gohan',
  'tortang-talong-omelet',
  'upgraded-ramen',
])

type RawMobileRecipe = {
  slug: string
  title: string
  meal: string
  appliance: string
  servings: number
  costPHP: number
  blurb: string
  ingredients?: unknown[]
  steps?: { minutes?: number }[]
}

export function loadMobileRecipes(): AdminRecipe[] {
  const all = [
    ...(originals as RawMobileRecipe[]),
    ...(breakfastLunch as RawMobileRecipe[]),
    ...(dinnerSnacks as RawMobileRecipe[]),
    ...(meriendaDrinks as RawMobileRecipe[]),
  ]

  return all.map((r) => {
    const minutes = (r.steps || []).reduce((sum, s) => sum + (Number(s.minutes) || 0), 0)
    return {
      id: r.slug,
      name: r.title,
      mealType: r.meal as MealType,
      appliance: r.appliance as ApplianceType,
      description: r.blurb,
      cookTimeMinutes: minutes > 0 ? minutes : 5,
      servings: r.servings || 1,
      costPHP: r.costPHP,
      ingredientCount: Array.isArray(r.ingredients) ? r.ingredients.length : 0,
      image: RECIPE_IMAGE_SLUGS.has(r.slug) ? `/recipes/${r.slug}.jpg` : null,
    }
  })
}
