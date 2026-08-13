/**
 * lib/db.ts
 * All Supabase CRUD helpers for Dormosaur.
 * Each function accepts a userId so data is always scoped correctly.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  classes as defaultClasses,
  alarms as defaultAlarms,
  profile as defaultProfile,
} from '@/lib/data'
import type { ClassEntry, Alarm, SubjectColor } from '@/lib/data'
import type { DeadlineItem, GroceryItem, MealPlanEntry } from '@/components/schedule-provider'

// ─── Types ───────────────────────────────────────────────────────────────────

export type DbProfile = {
  id: string
  name: string
  school: string
  dorm: string
  year: string
  initials: string
  is_dorm_student: boolean
  onboarding_completed: boolean
  country?: string
  timezone?: string
  appliances?: string[]
  dietary_preference?: string
  dietary_note?: string
}

export type PushSubscriptionRecord = {
  id?: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  device_label?: string
  last_seen_at?: string
  created_at?: string
}

// ─── Push Subscriptions ───────────────────────────────────────────────────────

export async function upsertPushSubscription(
  supabase: SupabaseClient,
  userId: string,
  sub: { endpoint: string; keys: { p256dh: string; auth: string }; deviceLabel?: string },
): Promise<PushSubscriptionRecord | null> {
  const now = new Date().toISOString()
  const payload = {
    user_id: userId,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
    device_label: sub.deviceLabel || 'Web Browser',
    last_seen_at: now,
  }

  const { data, error } = await supabase
    .from('push_subscriptions')
    .upsert(payload, { onConflict: 'endpoint' })
    .select('*')
    .single()

  if (error) {
    console.warn('Push subscription upsert notice:', error.message)
    return { ...payload, id: `sub-${Date.now()}` }
  }

  return data as PushSubscriptionRecord
}

export async function getUserPushSubscriptions(
  supabase: SupabaseClient,
  userId: string,
): Promise<PushSubscriptionRecord[]> {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('last_seen_at', { ascending: false })
  if (error || !data) return []
  return data as PushSubscriptionRecord[]
}

export async function updateSubscriptionLastSeen(
  supabase: SupabaseClient,
  endpoint: string,
) {
  await supabase
    .from('push_subscriptions')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('endpoint', endpoint)
}

export async function deletePushSubscriptionById(
  supabase: SupabaseClient,
  userId: string,
  id: string,
) {
  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
}

export async function deletePushSubscriptionByEndpoint(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
) {
  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
    .eq('user_id', userId)
}

export async function deletePushSubscription(
  supabase: SupabaseClient,
  endpoint: string,
) {
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<DbProfile | null> {
  console.log('[Dormosaur DB Read] Fetching profile for user:', userId)
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) {
    console.warn('[Dormosaur DB Read Notice] getUserProfile:', error.message)
    return null
  }
  console.log('[Dormosaur DB Read Success] Profile loaded:', data)
  return data as DbProfile
}

export async function upsertUserProfile(
  supabase: SupabaseClient,
  userId: string,
  profile: Partial<DbProfile> & Record<string, unknown>,
) {
  const ALLOWED_COLUMNS: Array<keyof DbProfile> = [
    'id',
    'name',
    'school',
    'dorm',
    'year',
    'initials',
    'is_dorm_student',
    'onboarding_completed',
    'country',
    'timezone',
    'appliances',
    'dietary_preference',
    'dietary_note',
  ]

  const filteredPayload: Record<string, unknown> = { id: userId }
  for (const key of ALLOWED_COLUMNS) {
    if (key in profile && profile[key] !== undefined) {
      filteredPayload[key] = profile[key]
    }
  }

  // If payload only contains id and no valid columns to update, return gracefully
  if (Object.keys(filteredPayload).length <= 1) {
    return null
  }

  console.log('[Dormosaur DB Write] Saving profile update for user:', userId, filteredPayload)
  const { data, error } = await supabase
    .from('profiles')
    .upsert(filteredPayload, { onConflict: 'id' })
    .select('*')

  if (error) {
    console.warn('[Dormosaur DB Write Notice] upsertUserProfile notice:', error.message, error.details)
    return null
  }

  console.log('[Dormosaur DB Write SUCCESS] Profile updated in Supabase:', data)
  return data
}

// ─── Classes ──────────────────────────────────────────────────────────────────

export async function getClasses(
  supabase: SupabaseClient,
  userId: string,
): Promise<ClassEntry[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('user_id', userId)
    .order('start_time')
  if (error || !data) return []
  return data.map(rowToClass)
}

export async function setClasses(
  supabase: SupabaseClient,
  userId: string,
  classes: ClassEntry[],
) {
  // Delete all then insert fresh (replaces entire schedule)
  await supabase.from('classes').delete().eq('user_id', userId)
  if (classes.length === 0) return
  const rows = classes.map((c) => classToRow(userId, c))
  const { error } = await supabase.from('classes').insert(rows)
  if (error) throw error
}

// ─── Alarms ───────────────────────────────────────────────────────────────────

export async function getAlarms(
  supabase: SupabaseClient,
  userId: string,
): Promise<Alarm[]> {
  const { data, error } = await supabase
    .from('alarms')
    .select('*')
    .eq('user_id', userId)
    .order('time')
  if (error || !data) return []
  return data.map(rowToAlarm)
}

export async function setAlarms(
  supabase: SupabaseClient,
  userId: string,
  alarms: Alarm[],
) {
  await supabase.from('alarms').delete().eq('user_id', userId)
  if (alarms.length === 0) return
  const rows = alarms.map((a) => alarmToRow(userId, a))
  const { error } = await supabase.from('alarms').insert(rows)
  if (error) throw error
}

// ─── Deadlines ────────────────────────────────────────────────────────────────

export async function getDeadlines(
  supabase: SupabaseClient,
  userId: string,
): Promise<DeadlineItem[]> {
  const { data, error } = await supabase
    .from('deadlines')
    .select('*')
    .eq('user_id', userId)
    .order('due_date')
  if (error || !data) return []
  return data.map(rowToDeadline)
}

export async function setDeadlines(
  supabase: SupabaseClient,
  userId: string,
  deadlines: DeadlineItem[],
) {
  const { error: delErr } = await supabase.from('deadlines').delete().eq('user_id', userId)
  if (delErr) {
    console.warn('[Dormosaur DB Notice] Deadlines cleanup:', delErr.message)
  }
  if (deadlines.length === 0) return

  const rows = deadlines.map((d) => deadlineToRow(userId, d))
  const { error } = await supabase.from('deadlines').insert(rows)
  if (error) {
    console.error('[Supabase DB Error] setDeadlines insert failed:', error.message)
    throw new Error(error.message)
  }
}

// ─── Meal Plan ────────────────────────────────────────────────────────────────

export async function getMealPlan(
  supabase: SupabaseClient,
  userId: string,
): Promise<MealPlanEntry[]> {
  const { data, error } = await supabase
    .from('meal_plan')
    .select('*')
    .eq('user_id', userId)
  if (error || !data) return []
  return data.map((row) => ({
    day: row.day,
    meal: row.meal as MealPlanEntry['meal'],
    recipeSlug: row.recipe_slug,
  }))
}

export async function setMealPlan(
  supabase: SupabaseClient,
  userId: string,
  plan: MealPlanEntry[],
) {
  await supabase.from('meal_plan').delete().eq('user_id', userId)
  if (plan.length === 0) return
  const rows = plan.map((p, i) => ({
    id: `mp-${userId}-${i}`,
    user_id: userId,
    day: p.day,
    meal: p.meal,
    recipe_slug: p.recipeSlug,
  }))
  const { error } = await supabase.from('meal_plan').insert(rows)
  if (error) throw error
}

// ─── Grocery ──────────────────────────────────────────────────────────────────

export async function getGrocery(
  supabase: SupabaseClient,
  userId: string,
): Promise<GroceryItem[]> {
  const { data, error } = await supabase
    .from('grocery_items')
    .select('*')
    .eq('user_id', userId)
  if (error || !data) return []
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    checked: row.checked,
    custom: row.custom,
  }))
}

export async function setGrocery(
  supabase: SupabaseClient,
  userId: string,
  items: GroceryItem[],
) {
  await supabase.from('grocery_items').delete().eq('user_id', userId)
  if (items.length === 0) return
  const rows = items.map((g) => ({
    id: g.id,
    user_id: userId,
    name: g.name,
    checked: g.checked,
    custom: g.custom ?? false,
  }))
  const { error } = await supabase.from('grocery_items').insert(rows)
  if (error) throw error
}

// ─── Seed new user ────────────────────────────────────────────────────────────

export async function seedNewUser(
  supabase: SupabaseClient,
  userId: string,
  partialProfile: Partial<DbProfile> = {},
) {
  console.log('[Dormosaur DB Seed] Seeding new user profile in database for user:', userId)
  const defaultMealPlan: MealPlanEntry[] = [
    { day: 'Mon', meal: 'Breakfast', recipeSlug: 'no-cook-overnight-oats' },
    { day: 'Wed', meal: 'Dinner', recipeSlug: 'rice-cooker-congee' },
    { day: 'Fri', meal: 'Lunch', recipeSlug: 'upgraded-instant-ramen' },
  ]

  await Promise.all([
    upsertUserProfile(supabase, userId, {
      name: defaultProfile.name,
      school: defaultProfile.school,
      dorm: defaultProfile.dorm,
      year: defaultProfile.year,
      initials: defaultProfile.initials,
      is_dorm_student: true,
      onboarding_completed: false,
      country: 'PH',
      timezone: 'Asia/Manila',
      ...partialProfile,
    }),
    setClasses(supabase, userId, []),
    setAlarms(supabase, userId, []),
    setDeadlines(supabase, userId, []),
    setMealPlan(supabase, userId, defaultMealPlan),
  ])
  console.log('[Dormosaur DB Seed SUCCESS] New user seeded successfully for user:', userId)
}

// ─── Row Mappers ──────────────────────────────────────────────────────────────

function rowToClass(row: Record<string, unknown>): ClassEntry {
  return {
    id: row.id as string,
    subject: row.subject as string,
    code: row.code as string,
    instructor: (row.instructor as string) || '',
    room: (row.room as string) || '',
    days: row.days as string[],
    start: row.start_time as string,
    end: row.end_time as string,
    color: (row.color as SubjectColor) || 1,
    confidence: (row.confidence as 'high' | 'low') || 'high',
    lowFields: (row.low_fields as string[]) || [],
  }
}

function classToRow(userId: string, c: ClassEntry) {
  return {
    id: c.id,
    user_id: userId,
    subject: c.subject,
    code: c.code,
    instructor: c.instructor,
    room: c.room,
    days: c.days,
    start_time: c.start,
    end_time: c.end,
    color: c.color,
    confidence: c.confidence || 'high',
    low_fields: c.lowFields || [],
  }
}

function rowToAlarm(row: Record<string, unknown>): Alarm {
  return {
    id: row.id as string,
    classId: row.class_id as string,
    subject: row.subject as string,
    code: row.code as string,
    time: row.time as string,
    day: (row.day as string) || 'Today',
    lead: (row.lead as 15 | 30 | 60) || 30,
    enabled: row.enabled as boolean,
    color: (row.color as SubjectColor) || 1,
  }
}

function alarmToRow(userId: string, a: Alarm) {
  return {
    id: a.id,
    user_id: userId,
    class_id: a.classId,
    subject: a.subject,
    code: a.code,
    time: a.time,
    day: a.day,
    lead: a.lead,
    enabled: a.enabled,
    color: a.color,
  }
}

function rowToDeadline(row: Record<string, unknown>): DeadlineItem {
  let dueDate = (row.due_date as string) || ''
  let dueTime = '23:59'

  if (dueDate.includes('T')) {
    const [dPart, tPart] = dueDate.split('T')
    dueDate = dPart
    if (tPart) {
      dueTime = tPart.slice(0, 5)
    }
  }

  return {
    id: row.id as string,
    title: (row.title as string) || 'Deadline',
    code: (row.code as string) || '',
    type: (row.type as DeadlineItem['type']) || 'assignment',
    dueDate,
    dueTime,
    color: (row.color as SubjectColor) || 1,
    completed: Boolean(row.completed),
    source: 'manual',
    confidence: 'high',
  }
}

function deadlineToRow(userId: string, d: DeadlineItem) {
  let isoDueDate = d.dueDate || new Date().toISOString().split('T')[0]
  if (!isoDueDate.includes('T')) {
    const timeStr = d.dueTime || '23:59'
    try {
      isoDueDate = new Date(`${isoDueDate}T${timeStr}:00`).toISOString()
    } catch {
      isoDueDate = new Date().toISOString()
    }
  }

  return {
    id: d.id,
    user_id: userId,
    title: d.title || 'Deadline',
    code: d.code || '',
    type: d.type || 'assignment',
    due_date: isoDueDate,
    color: typeof d.color === 'number' ? d.color : 1,
    completed: Boolean(d.completed),
  }
}
