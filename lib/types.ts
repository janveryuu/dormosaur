import type { SubjectColor } from '@/lib/data'

export type MealPlanEntry = {
  day: string
  meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
  recipeSlug: string
}

export type GroceryItem = {
  id: string
  name: string
  checked: boolean
  custom?: boolean
}

export type DeadlineItem = {
  id: string
  title: string
  code: string
  type: 'exam' | 'assignment' | 'project' | 'quiz' | 'other'
  dueDate: string
  dueTime?: string
  color: SubjectColor
  completed: boolean
  source?: 'manual' | 'text_import' | 'image_import'
  confidence?: 'high' | 'low'
  lowFields?: string[]
  subjectId?: string
}
