/**
 * lib/db.ts
 * All Supabase CRUD helpers for Dormosaur.
 * Each function accepts a userId so data is always scoped correctly.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { deadlineFields, localDateTimeToIso, validTime } from '@/lib/date-time'
import { DAYS } from '@/lib/copilot/time'
import type { ClassEntry, Alarm, SubjectColor } from '@/lib/data'
import type { DeadlineItem, GroceryItem, MealPlanEntry } from '@/components/schedule-provider'

// ─── Types ───────────────────────────────────────────────────────────────────

export type DbProfile = {
  id: string
  name: string
  school: string
  dorm: string
  year: string
  avatar_url?: string | null
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
    throw new Error('We could not save this device. Please try enabling notifications again.')
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
  if (error) throw new Error('We could not load your notification devices. Please try again.')
  if (!data) return []
  return data as PushSubscriptionRecord[]
}

export async function updateSubscriptionLastSeen(
  supabase: SupabaseClient,
  endpoint: string,
  userId: string,
) {
  await supabase
    .from('push_subscriptions')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('endpoint', endpoint)
    .eq('user_id', userId)
}

export async function deletePushSubscriptionById(
  supabase: SupabaseClient,
  userId: string,
  id: string,
) {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw new Error('We could not remove this device. Please try again.')
}

export async function deletePushSubscriptionByEndpoint(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
) {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
    .eq('user_id', userId)
  if (error) throw new Error('We could not remove this device. Please try again.')
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<DbProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    throw new Error('We could not load your profile. Please try again.')
  }
  return data as DbProfile
}

export async function upsertUserProfile(
  supabase: SupabaseClient,
  userId: string,
  profile: Partial<DbProfile> & Record<string, unknown>,
) {
  const ALLOWED_COLUMNS: Array<keyof DbProfile> = [
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

  const { data, error } = await supabase
    .from('profiles')
    .upsert(filteredPayload, { onConflict: 'id' })
    .select('*')

  if (error) {
    throw new Error('We could not save your profile. Please try again.')
  }
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
  if (error) throw new Error('We could not load your classes. Please try again.')
  if (!data) return []
  return data.map(rowToClass)
}

export async function setClasses(
  supabase: SupabaseClient,
  userId: string,
  classes: ClassEntry[],
) {
  await replaceOwnedRows(supabase, 'classes', userId, classes.map(c => classToRow(userId, c)))
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
  if (error) throw new Error('We could not load your alarms. Please try again.')
  if (!data) return []
  return data.map(rowToAlarm)
}

export async function setAlarms(
  supabase: SupabaseClient,
  userId: string,
  alarms: Alarm[],
) {
  await replaceOwnedRows(supabase, 'alarms', userId, alarms.map(a => alarmToRow(userId, a)))
}

// ─── Deadlines ────────────────────────────────────────────────────────────────

export async function getDeadlines(
  supabase: SupabaseClient,
  userId: string,
  timezone = 'Asia/Manila',
): Promise<DeadlineItem[]> {
  const { data, error } = await supabase
    .from('deadlines')
    .select('*')
    .eq('user_id', userId)
    .order('due_date')
  if (error) throw new Error('We could not load your deadlines. Please try again.')
  if (!data) return []
  return data.map(row => rowToDeadline(row, timezone))
}

export async function setDeadlines(
  supabase: SupabaseClient,
  userId: string,
  deadlines: DeadlineItem[],
  timezone = 'Asia/Manila',
) {
  await replaceOwnedRows(supabase, 'deadlines', userId, deadlines.map(d => deadlineToRow(userId, d, timezone)))
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
  if (error) throw new Error('We could not load your meal plan. Please try again.')
  if (!data) return []
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
  const rows = plan.map((p, i) => ({
    id: `mp-${userId}-${i}`,
    user_id: userId,
    day: p.day,
    meal: p.meal,
    recipe_slug: p.recipeSlug,
  }))
  await replaceOwnedRows(supabase, 'meal_plan', userId, rows)
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
  if (error) throw new Error('We could not load your grocery list. Please try again.')
  if (!data) return []
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
  const rows = items.map((g) => ({
    id: g.id,
    user_id: userId,
    name: g.name,
    checked: g.checked,
    custom: g.custom ?? false,
  }))
  await replaceOwnedRows(supabase, 'grocery_items', userId, rows)
}

// Write first, then remove only rows explicitly absent from this saved snapshot.
// A rejected insert/upsert must never erase the student's existing collection.
async function replaceOwnedRows(supabase: SupabaseClient, table: string, userId: string, rows: { id: string }[]) {
  if (!userId || new Set(rows.map(r => r.id)).size !== rows.length || rows.some(r => !r.id)) {
    throw new Error('We could not save these entries. Please review them and try again.')
  }
  const { data: existing, error: readError } = await supabase.from(table).select('id').eq('user_id', userId)
  if (readError) throw new Error('We could not check your saved entries. Please try again.')
  if (rows.length) {
    const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' })
    if (error) throw new Error('We could not save your changes. Your existing entries are still saved.')
  }
  const ids = new Set(rows.map(r => r.id))
  const removed = (existing || []).map(r => r.id as string).filter(id => !ids.has(id))
  if (removed.length) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId).in('id', removed)
    if (error) throw new Error('Your changes were saved, but some removed entries need another try.')
  }
}

// ─── Seed new user ────────────────────────────────────────────────────────────

export async function seedNewUser(
  supabase: SupabaseClient,
  userId: string,
  partialProfile: Partial<DbProfile> = {},
) {
  // Ignore an existing profile and never replace student collections here.
  // This is also safe when callback and hydration run concurrently.
  const { error } = await supabase.from('profiles').upsert({
    id: userId, name: partialProfile.name || '', school: partialProfile.school || '',
    dorm: partialProfile.dorm || '', year: partialProfile.year || '',
    initials: partialProfile.initials || '', is_dorm_student: true,
    onboarding_completed: false, country: 'PH', timezone: 'Asia/Manila',
  }, { onConflict: 'id', ignoreDuplicates: true })
  if (error) throw new Error('We could not prepare your profile. Please try again.')
}

// ─── Row Mappers ──────────────────────────────────────────────────────────────

function rowToClass(row: Record<string, unknown>): ClassEntry {
  const text = (value: unknown) => typeof value === 'string' ? value : ''
  const days = Array.isArray(row.days) ? row.days.filter(day => typeof day === 'string' && DAYS.includes(day)) : []
  const start = text(row.start_time).slice(0, 5)
  const end = text(row.end_time).slice(0, 5)
  const missing = [!text(row.subject) && 'subject', !days.length && 'days', !validTime(start) && 'start', !validTime(end) && 'end'].filter(Boolean) as string[]
  return {
    id: row.id as string,
    subject: text(row.subject),
    code: text(row.code),
    instructor: text(row.instructor),
    room: text(row.room),
    days,
    start: validTime(start) ? start : '',
    end: validTime(end) ? end : '',
    color: (row.color as SubjectColor) || 1,
    confidence: missing.length || row.confidence === 'low' ? 'low' : 'high',
    lowFields: [...new Set([...(Array.isArray(row.low_fields) ? row.low_fields.filter(field => typeof field === 'string') : []), ...missing])],
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
    classId: typeof row.class_id === 'string' ? row.class_id : '',
    subject: typeof row.subject === 'string' ? row.subject : '',
    code: typeof row.code === 'string' ? row.code : '',
    time: typeof row.time === 'string' ? row.time.slice(0, 5) : '',
    day: (row.day as string) || 'Today',
    lead: (row.lead as 15 | 30 | 60) || 30,
    enabled: row.enabled === true,
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

function rowToDeadline(row: Record<string, unknown>, timezone: string): DeadlineItem {
  const fields = deadlineFields(typeof row.due_date === 'string' ? row.due_date : '', timezone)
  return {
    id: row.id as string, title: (row.title as string) || 'Deadline',
    code: (row.code as string) || '', type: (row.type as DeadlineItem['type']) || 'assignment',
    ...fields, color: (row.color as SubjectColor) || 1, completed: Boolean(row.completed),
    source: 'manual', confidence: 'high',
  }
}

function deadlineToRow(userId: string, d: DeadlineItem, timezone: string) {
  const dueDate = /[Zz]$|[+-]\d{2}:\d{2}$/.test(d.dueDate)
    ? new Date(d.dueDate).toISOString()
    : localDateTimeToIso(d.dueDate.slice(0, 10), d.dueTime || d.dueDate.split('T')[1]?.slice(0, 5) || '23:59', timezone)
  return {
    id: d.id, user_id: userId, title: d.title, code: d.code || '', type: d.type || 'assignment',
    due_date: dueDate, color: typeof d.color === 'number' ? d.color : 1, completed: Boolean(d.completed),
  }
}
