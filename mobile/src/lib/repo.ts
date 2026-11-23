/**
 * Supabase data access for the mobile app.
 * Tables and row shapes match the web app's lib/db.ts so both clients share data.
 */
import { supabase } from './supabase'

export type SubjectColor = 1 | 2 | 3 | 4 | 5
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
export type Day = (typeof DAYS)[number]

export type ClassEntry = {
  id: string
  subject: string
  code: string
  instructor: string
  room: string
  days: string[]
  start: string
  end: string
  color: SubjectColor
  confidence?: 'high' | 'low'
  lowFields?: string[]
}

export type Alarm = {
  id: string
  classId: string
  subject: string
  code: string
  time: string
  day: string
  lead: 15 | 30 | 60
  enabled: boolean
  color: SubjectColor
}

export type DeadlineType = 'exam' | 'assignment' | 'project' | 'quiz' | 'other'
export type Deadline = {
  id: string
  title: string
  code: string
  type: DeadlineType
  /** ISO timestamp */
  due: string
  color: SubjectColor
  completed: boolean
}

export type Profile = {
  id: string
  name: string
  school: string
  dorm: string
  year: string
  initials: string
  avatar_url?: string | null
  is_dorm_student: boolean
  onboarding_completed: boolean
  country?: string
  timezone?: string
  appliances?: string[]
  dietary_preference?: string
}

export function uid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const text = (v: unknown) => (typeof v === 'string' ? v : '')
const color = (v: unknown): SubjectColor => ([1, 2, 3, 4, 5].includes(v as number) ? (v as SubjectColor) : 1)

function fail(message: string, error: unknown): never {
  console.warn('[repo]', message, (error as { message?: string })?.message)
  throw new Error(message)
}

/**
 * Writes rows owned by the user without relying on a unique constraint on `id`
 * (the live tables don't have one, so `upsert(onConflict: 'id')` is rejected).
 * Existing rows are updated by (user_id, id); the rest are inserted.
 */
async function saveOwnedRows(table: string, userId: string, rows: ({ id: string } & Record<string, unknown>)[], message: string) {
  if (!rows.length) return
  const { data: existing, error: readError } = await supabase.from(table).select('id').eq('user_id', userId).in('id', rows.map(r => r.id))
  if (readError) fail(message, readError)
  const have = new Set((existing ?? []).map(r => r.id as string))
  const fresh = rows.filter(r => !have.has(r.id))
  const results = await Promise.all([
    ...rows.filter(r => have.has(r.id)).map(r => supabase.from(table).update(r).eq('user_id', userId).eq('id', r.id)),
    ...(fresh.length ? [supabase.from(table).insert(fresh)] : []),
  ])
  const failed = results.find(r => r.error)
  if (failed) fail(message, failed.error)
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) fail('Could not load profile', error)
  return data as Profile | null
}

const PROFILE_COLUMNS = ['name', 'school', 'dorm', 'year', 'initials', 'is_dorm_student', 'onboarding_completed', 'country', 'timezone', 'appliances', 'dietary_preference'] as const

export async function saveProfile(userId: string, patch: Partial<Profile>) {
  const row: Record<string, unknown> = { id: userId }
  for (const key of PROFILE_COLUMNS) if (patch[key] !== undefined) row[key] = patch[key]
  const { data, error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' }).select('*').single()
  if (error) fail('Could not save profile', error)
  return data as Profile
}

// ─── Classes ─────────────────────────────────────────────────────────────────

export async function getClasses(userId: string): Promise<ClassEntry[]> {
  const { data, error } = await supabase.from('classes').select('*').eq('user_id', userId).order('start_time')
  if (error) fail('Could not load classes', error)
  return (data ?? []).map(row => ({
    id: row.id,
    subject: text(row.subject),
    code: text(row.code),
    instructor: text(row.instructor),
    room: text(row.room),
    days: Array.isArray(row.days) ? row.days.filter((d: unknown) => DAYS.includes(d as Day)) : [],
    start: text(row.start_time).slice(0, 5),
    end: text(row.end_time).slice(0, 5),
    color: color(row.color),
    confidence: row.confidence === 'low' ? 'low' : 'high',
    lowFields: Array.isArray(row.low_fields) ? row.low_fields : [],
  }))
}

export async function upsertClasses(userId: string, classes: ClassEntry[]) {
  if (!classes.length) return
  const rows = classes.map(c => ({
    id: c.id, user_id: userId, subject: c.subject, code: c.code, instructor: c.instructor, room: c.room,
    days: c.days, start_time: c.start, end_time: c.end, color: c.color,
    confidence: c.confidence ?? 'high', low_fields: c.lowFields ?? [],
  }))
  await saveOwnedRows('classes', userId, rows, 'Could not save classes')
}

export async function deleteClass(userId: string, id: string) {
  const { error } = await supabase.from('classes').delete().eq('user_id', userId).eq('id', id)
  if (error) fail('Could not delete class', error)
}

// ─── Alarms ──────────────────────────────────────────────────────────────────

export async function getAlarms(userId: string): Promise<Alarm[]> {
  const { data, error } = await supabase.from('alarms').select('*').eq('user_id', userId).order('time')
  if (error) fail('Could not load alarms', error)
  return (data ?? []).map(row => ({
    id: row.id,
    classId: text(row.class_id),
    subject: text(row.subject),
    code: text(row.code),
    time: text(row.time).slice(0, 5),
    day: text(row.day) || 'Mon',
    lead: ([15, 30, 60].includes(row.lead) ? row.lead : 30) as Alarm['lead'],
    enabled: row.enabled === true,
    color: color(row.color),
  }))
}

export async function upsertAlarms(userId: string, alarms: Alarm[]) {
  if (!alarms.length) return
  const rows = alarms.map(a => ({
    id: a.id, user_id: userId, class_id: a.classId, subject: a.subject, code: a.code,
    time: a.time, day: a.day, lead: a.lead, enabled: a.enabled, color: a.color,
  }))
  await saveOwnedRows('alarms', userId, rows, 'Could not save alarms')
}

export async function deleteAlarmsForClass(userId: string, classId: string) {
  const { error } = await supabase.from('alarms').delete().eq('user_id', userId).eq('class_id', classId)
  if (error) fail('Could not delete alarms', error)
}

// ─── Deadlines ───────────────────────────────────────────────────────────────

export async function getDeadlines(userId: string): Promise<Deadline[]> {
  const { data, error } = await supabase.from('deadlines').select('*').eq('user_id', userId).order('due_date')
  if (error) fail('Could not load tasks', error)
  return (data ?? []).map(row => ({
    id: row.id,
    title: text(row.title) || 'Task',
    code: text(row.code),
    type: (text(row.type) || 'assignment') as DeadlineType,
    due: text(row.due_date),
    color: color(row.color),
    completed: Boolean(row.completed),
  }))
}

export async function upsertDeadline(userId: string, d: Deadline) {
  await saveOwnedRows('deadlines', userId, [{
    id: d.id, user_id: userId, title: d.title, code: d.code, type: d.type,
    due_date: new Date(d.due).toISOString(), color: d.color, completed: d.completed,
  }], 'Could not save task')
}

export async function deleteDeadline(userId: string, id: string) {
  const { error } = await supabase.from('deadlines').delete().eq('user_id', userId).eq('id', id)
  if (error) fail('Could not delete task', error)
}

// ─── Meal plan & grocery ─────────────────────────────────────────────────────

export type Meal = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
export const MEALS: Meal[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
export type MealPlanEntry = { day: string; meal: Meal; recipeSlug: string }
export type GroceryItem = { id: string; name: string; checked: boolean; custom?: boolean }

/** Upserts the full snapshot, then removes rows absent from it (same contract as web db.ts). */
async function replaceOwned(table: string, userId: string, rows: { id: string }[]) {
  const { data: existing, error: readError } = await supabase.from(table).select('id').eq('user_id', userId)
  if (readError) fail('Could not read saved items', readError)
  await saveOwnedRows(table, userId, rows, 'Could not save changes')
  const keep = new Set(rows.map(r => r.id))
  const removed = (existing ?? []).map(r => r.id as string).filter(id => !keep.has(id))
  if (removed.length) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId).in('id', removed)
    if (error) fail('Could not remove items', error)
  }
}

export async function getMealPlan(userId: string): Promise<MealPlanEntry[]> {
  const { data, error } = await supabase.from('meal_plan').select('*').eq('user_id', userId)
  if (error) fail('Could not load meal plan', error)
  return (data ?? []).map(row => ({ day: text(row.day), meal: text(row.meal) as Meal, recipeSlug: text(row.recipe_slug) }))
}

export async function setMealPlan(userId: string, plan: MealPlanEntry[]) {
  await replaceOwned('meal_plan', userId, plan.map(p => ({
    id: `mp-${userId}-${p.day}-${p.meal}`, user_id: userId, day: p.day, meal: p.meal, recipe_slug: p.recipeSlug,
  })))
}

export async function getGrocery(userId: string): Promise<GroceryItem[]> {
  const { data, error } = await supabase.from('grocery_items').select('*').eq('user_id', userId)
  if (error) fail('Could not load grocery list', error)
  return (data ?? []).map(row => ({ id: row.id, name: text(row.name), checked: Boolean(row.checked), custom: Boolean(row.custom) }))
}

export async function setGrocery(userId: string, items: GroceryItem[]) {
  await replaceOwned('grocery_items', userId, items.map(g => ({ id: g.id, user_id: userId, name: g.name, checked: g.checked, custom: g.custom ?? false })))
}
