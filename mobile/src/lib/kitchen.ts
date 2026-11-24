import { APPLIANCES, formatPesos, recipeBySlug, recipeMatchesMeal, recipes, type Ingredient, type Recipe } from './recipes'
import { DAYS, MEALS, uid, type GroceryItem, type MealPlanEntry } from './repo'

export type RecipeSort = 'Recommended' | 'Fastest' | 'Lowest cost' | 'Newest'
export type RecipeFilters = {
  query?: string
  meal?: Recipe['meal']
  appliances?: Recipe['appliance'][]
  costLimit?: number
  minuteLimit?: number
  sort?: RecipeSort
}

const fold = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ')
const ingredientAliases: Record<string, string> = {
  banana: 'saging', cabbage: 'repolyo', calamansi: 'kalamansi', 'chicken thigh': 'manok',
  'coconut milk': 'gata', 'cooked rice': 'kanin', egg: 'itlog', eggplant: 'talong',
  garlic: 'bawang', ginger: 'luya', onion: 'sibuyas', potato: 'patatas',
  'sweet potato': 'kamote', tofu: 'tokwa', tomato: 'kamatis', 'white rice': 'bigas',
}
const searchIndex = new Map(recipes.map(recipe => [recipe.slug, fold([
  recipe.title, recipe.blurb, recipe.meal, recipe.appliance, ...recipe.searchTerms,
  ...recipe.ingredients.map(item => `${item.name} ${ingredientAliases[item.name] ?? ''}`),
].join(' '))]))

export const kitchenAppliances = [...APPLIANCES]

export function findRecipes({ query = '', meal, appliances, costLimit, minuteLimit, sort }: RecipeFilters) {
  const words = fold(query).split(/\s+/).filter(Boolean)
  const list = recipes.filter(recipe =>
    (!meal || recipeMatchesMeal(recipe, meal)) &&
    (!appliances?.length || recipe.appliance === 'No cook' || appliances.includes(recipe.appliance)) &&
    (costLimit === undefined || recipe.costPHP <= costLimit) &&
    (minuteLimit === undefined || recipe.minutes <= minuteLimit) &&
    words.every(word => searchIndex.get(recipe.slug)!.includes(word)),
  )
  if (sort === 'Fastest') list.sort((a, b) => a.minutes - b.minutes)
  if (sort === 'Lowest cost') list.sort((a, b) => a.costPHP - b.costPHP)
  if (sort === 'Newest') list.reverse().sort((a, b) => (b.addedOn ?? '').localeCompare(a.addedOn ?? ''))
  return list
}

export const ingredientAisles = ['Produce', 'Protein', 'Dairy & eggs', 'Grains & bread', 'Pantry', 'Other'] as const
const aisleByName = new Map(recipes.flatMap(recipe => recipe.ingredients.map(item => [item.name, item.aisle] as const)))
const quantityFormatter = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 2 })

export function ingredientAmount(amount: number, unit: Ingredient['unit']) {
  return `${quantityFormatter.format(amount)} ${unit}`
}

export function ingredientLabel({ name, amount, unit }: Ingredient) {
  return `${ingredientAmount(amount, unit)} ${name}`
}

const capitalize = (name: string) => name.charAt(0).toUpperCase() + name.slice(1)
function itemName(grocery: GroceryItem) {
  const name = grocery.name.split(' · ', 1)[0].trim().toLowerCase()
  if (aisleByName.has(name)) return name
  const bare = name.replace(/^\s*[\d ./]+\s*(?:(?:cups?|tbsp|tsp|grams?|g|ml|packs?|cans?|pieces?|pcs?)\s+)?/, '').split(',')[0].trim()
  if (aisleByName.has(bare)) return bare
  const singular = bare.replace(/s$/, '')
  return aisleByName.has(singular) ? singular : name
}

export function groceryAisle(item: GroceryItem) {
  return aisleByName.get(itemName(item)) ?? 'Other'
}

export function ingredientsFromPlan(plan: MealPlanEntry[]) {
  return plan.flatMap(entry => {
    const recipe = recipeBySlug.get(entry.recipeSlug)
    return recipe ? recipe.ingredients.map(item => ({ ...item, amount: item.amount / recipe.servings })) : []
  })
}

export function addGroceryIngredients(existing: GroceryItem[], ingredients: Ingredient[], source: 'plan' | 'recipe') {
  const grouped = new Map<string, Map<Ingredient['unit'], number>>()
  for (const { name, amount, unit } of ingredients) {
    if (name === 'water') continue
    const quantities = grouped.get(name) ?? new Map()
    quantities.set(unit, (quantities.get(unit) ?? 0) + amount)
    grouped.set(name, quantities)
  }
  const candidates = new Map<string, string>()
  for (const [name, amounts] of grouped) {
    const label = [...amounts].sort(([a], [b]) => a.localeCompare(b)).map(([unit, amount]) => ingredientAmount(amount, unit)).join(' + ')
    candidates.set(name, `${capitalize(name)} · ${label}`)
  }
  const keep = existing.filter(item => {
    if (source !== 'plan' || !item.id.startsWith('kitchen-plan-')) return true
    return candidates.has(itemName(item))
  })
  const existingNames = new Set(keep.map(itemName))
  const updated = keep.map(item => {
    if (source !== 'plan' || !item.id.startsWith('kitchen-plan-')) return item
    const name = candidates.get(itemName(item))
    return name && name !== item.name ? { ...item, name, checked: false } : item
  })
  for (const [name, label] of candidates) {
    if (existingNames.has(name)) continue
    updated.push({ id: source === 'plan' ? `kitchen-plan-${uid()}` : uid(), name: label, checked: false })
  }
  return updated.length === existing.length && updated.every((item, index) => item === existing[index]) ? existing : updated
}

export function plannedCost(plan: MealPlanEntry[]) {
  return plan.reduce((cost, entry) => cost + (recipeBySlug.get(entry.recipeSlug)?.costPHP ?? 0), 0)
}

function mealVariety(recipe: Recipe, meal: MealPlanEntry['meal'], recentlyUsed: Set<string>) {
  const protein = recipe.ingredients.find(ingredient => ingredient.aisle === 'Protein' || /^(?:egg|mung bean|lentil)$/.test(ingredient.name))
  const produce = recipe.ingredients.find(ingredient => ingredient.aisle === 'Produce' && !/^(?:garlic|onion|scallion|ginger|calamansi|lime)$/.test(ingredient.name))
  const score = Number(recipe.meal === meal) + Number(Boolean(protein)) + Number(Boolean(produce))
  return score + Number(Boolean(protein && !recentlyUsed.has(protein.name)))
}

export function suggestMeals(existing: MealPlanEntry[], budget: number) {
  const mainMeals = MEALS.filter(meal => meal !== 'Snack')
  const available = new Map(mainMeals.map(meal => [meal, findRecipes({ meal, sort: 'Lowest cost' })]))
  const slots = DAYS.flatMap(day => mainMeals
    .filter(meal => !existing.some(item => item.day === day && item.meal === meal))
    .map(meal => ({ day, meal, choices: available.get(meal)! })))
  const initialCost = plannedCost(existing)
  const minimum = slots.reduce((cost, { choices }) => cost + choices[0].costPHP, initialCost)
  if (!slots.length) return { added: [], message: 'Every breakfast, lunch, and dinner is planned.' }
  if (minimum > budget) return { added: [], message: `Set a budget of at least ${formatPesos(minimum)} to fill the open meals.` }

  const seen = new Set(existing.map(entry => entry.recipeSlug))
  const recentlyUsed = new Set<string>()
  let remaining = budget - initialCost
  let reserve = minimum - initialCost
  const added: MealPlanEntry[] = slots.map(({ day, meal, choices }, index) => {
    reserve -= choices[0].costPHP
    const limit = Math.floor(remaining - reserve)
    const average = Math.floor(remaining / (slots.length - index))
    const newChoices = choices.filter(recipe => !seen.has(recipe.slug) && recipe.costPHP <= Math.min(limit, average + 8))
      .sort((a, b) => mealVariety(b, meal, recentlyUsed) - mealVariety(a, meal, recentlyUsed))
    const pick = newChoices[index % Math.min(newChoices.length, 3)] ?? choices[0]
    seen.add(pick.slug)
    for (const ingredient of pick.ingredients) recentlyUsed.add(ingredient.name)
    remaining -= pick.costPHP
    return { day, meal, recipeSlug: pick.slug }
  })
  return { added, message: `Filled ${added.length} meals · ${formatPesos(budget - remaining)} estimated for the week.` }
}
