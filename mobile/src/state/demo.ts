/** Preview data used only when Supabase env vars are missing (design review in Expo Go). */
import type { Alarm, ClassEntry, Deadline, GroceryItem, MealPlanEntry, Profile } from '@/lib/repo'

export const demoProfile: Profile = {
  id: 'demo', name: 'Janver', school: 'State University', dorm: 'Acacia Hall', year: '3rd year',
  initials: 'J', is_dorm_student: true, onboarding_completed: true,
}

export const demoClasses: ClassEntry[] = [
  { id: 'c1', subject: 'Calculus I', code: 'MATH 101', instructor: 'Dr. Reyes', room: 'Sci Hall 204', days: ['Mon', 'Wed', 'Fri'], start: '08:30', end: '09:50', color: 1 },
  { id: 'c2', subject: 'General Chemistry', code: 'CHEM 120', instructor: 'Prof. Hale', room: 'Lab B-12', days: ['Mon', 'Wed'], start: '10:15', end: '12:00', color: 2 },
  { id: 'c3', subject: 'Modern Literature', code: 'ENG 205', instructor: 'Dr. Tanaka', room: 'Humanities 310', days: ['Tue', 'Thu'], start: '09:00', end: '10:20', color: 3 },
  { id: 'c4', subject: 'Intro to Programming', code: 'CS 150', instructor: 'Prof. Okonkwo', room: 'Tech Center 118', days: ['Tue', 'Thu', 'Fri'], start: '13:00', end: '14:40', color: 4 },
  { id: 'c5', subject: 'Psychology 101', code: 'PSY 110', instructor: 'Dr. Patel', room: 'West Wing 22', days: ['Mon', 'Fri', 'Sat'], start: '15:00', end: '16:20', color: 5 },
]

export const demoAlarms: Alarm[] = demoClasses.map((c, i) => ({
  id: `a${i}`, classId: c.id, subject: c.subject, code: c.code, time: c.start, day: c.days[0], lead: 30, enabled: i !== 4, color: c.color,
}))

const inDays = (d: number, h: number) => {
  const date = new Date(); date.setDate(date.getDate() + d); date.setHours(h, 0, 0, 0)
  return date.toISOString()
}

export const demoDeadlines: Deadline[] = [
  { id: 'd1', title: 'Problem set 4', code: 'MATH 101', type: 'assignment', due: inDays(0, 23), color: 1, completed: false },
  { id: 'd2', title: 'Lab report', code: 'CHEM 120', type: 'project', due: inDays(2, 17), color: 2, completed: false },
  { id: 'd3', title: 'Midterm', code: 'PSY 110', type: 'exam', due: inDays(5, 9), color: 5, completed: false },
  { id: 'd4', title: 'Reading quiz', code: 'ENG 205', type: 'quiz', due: inDays(-1, 10), color: 3, completed: true },
]


export const demoMealPlan: MealPlanEntry[] = [
  { day: 'Mon', meal: 'Breakfast', recipeSlug: 'champorado-chocolate-rice' },
  { day: 'Mon', meal: 'Dinner', recipeSlug: 'chicken-tinola-soup' },
  { day: 'Tue', meal: 'Lunch', recipeSlug: 'corned-beef-rice-bowl' },
]

export const demoGrocery: GroceryItem[] = [
  { id: 'g1', name: 'Eggs', checked: false },
  { id: 'g2', name: 'Rice', checked: true },
  { id: 'g3', name: 'Cocoa powder', checked: false },
]
