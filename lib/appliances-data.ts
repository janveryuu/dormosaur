/**
 * lib/appliances-data.ts
 * Single shared taxonomy & utility module for dorm kitchen appliances and feasibility & dietary recipe filtering.
 */

export type ApplianceType = 'microwave' | 'rice_cooker' | 'kettle' | 'induction_burner'

export type ApplianceOption = {
  id: ApplianceType
  label: string
  iconName: string
  description: string
}

export const APPLIANCE_OPTIONS: ApplianceOption[] = [
  {
    id: 'microwave',
    label: 'Microwave',
    iconName: 'Zap',
    description: 'Reheating, quick mug meals & soups',
  },
  {
    id: 'rice_cooker',
    label: 'Rice cooker',
    iconName: 'CookingPot',
    description: 'Steaming rice, stews & one-pot meals',
  },
  {
    id: 'kettle',
    label: 'Electric kettle',
    iconName: 'Coffee',
    description: 'Boiling water, instant noodles & oatmeal',
  },
  {
    id: 'induction_burner',
    label: 'Induction burner',
    iconName: 'Flame',
    description: 'Skillet cooking, pan-searing & boiling',
  },
]

export type DietaryTag = 'vegetarian' | 'halal' | 'contains_meat' | 'contains_pork'
export type DietaryPreference = 'none' | 'vegetarian' | 'halal' | 'other'

export type RecipeWithAppliancesAndDiet = {
  id?: string
  slug?: string
  title: string
  requiredAppliances?: ApplianceType[]
  dietary_tags?: DietaryTag[]
  [key: string]: unknown
}

/**
 * Single shared feasibility filter:
 * A recipe is feasible if every item in its requiredAppliances is present in studentAppliances.
 * Recipes requiring no appliances (requiredAppliances = []) are ALWAYS included.
 */
export function getFeasibleRecipes<T extends RecipeWithAppliancesAndDiet>(
  recipes: T[],
  studentAppliances: ApplianceType[] = []
): T[] {
  const applianceSet = new Set<string>(studentAppliances)

  return recipes.filter((recipe) => {
    const required = recipe.requiredAppliances || []
    if (required.length === 0) return true
    return required.every((app) => applianceSet.has(app))
  })
}

/**
 * Single shared dietary preference filter:
 * - 'vegetarian': hides recipes with 'contains_meat' or 'contains_pork'
 * - 'halal': hides recipes with 'contains_pork'
 * - 'other' or 'none': shows all recipes
 */
export function getDietaryFilteredRecipes<T extends RecipeWithAppliancesAndDiet>(
  recipes: T[],
  preference: DietaryPreference = 'none'
): T[] {
  if (preference === 'none' || preference === 'other') return recipes

  return recipes.filter((recipe) => {
    const tags = recipe.dietary_tags || []
    if (preference === 'vegetarian') {
      return !tags.includes('contains_meat') && !tags.includes('contains_pork')
    }
    if (preference === 'halal') {
      return !tags.includes('contains_pork')
    }
    return true
  })
}

/**
 * Formats a clean human-readable summary for Profile/Settings (e.g., "Microwave, Electric kettle")
 */
export function formatApplianceSummary(appliances: ApplianceType[] = []): string {
  if (!appliances || appliances.length === 0) {
    return 'No appliances selected'
  }
  const labels = appliances.map((id) => {
    const opt = APPLIANCE_OPTIONS.find((o) => o.id === id)
    return opt ? opt.label : id
  })
  return labels.join(', ')
}

export function formatDietarySummary(preference: DietaryPreference = 'none', note?: string): string {
  if (preference === 'vegetarian') return 'Vegetarian'
  if (preference === 'halal') return 'Halal'
  if (preference === 'other') return note ? `Other (${note})` : 'Other'
  return 'No restrictions'
}
