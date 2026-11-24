import type { Session } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Alert } from 'react-native'
import { registerForServerPush, syncAlarmNotifications } from '@/lib/notifications'
import * as repo from '@/lib/repo'
import type { Alarm, ClassEntry, Deadline, GroceryItem, Meal, MealPlanEntry, Profile } from '@/lib/repo'
import { isConfigured, supabase } from '@/lib/supabase'
import { demoAlarms, demoClasses, demoDeadlines, demoGrocery, demoMealPlan, demoProfile } from './demo'

type AppState = {
  ready: boolean
  demo: boolean
  session: Session | null
  profile: Profile | null
  classes: ClassEntry[]
  alarms: Alarm[]
  deadlines: Deadline[]
  mealPlan: MealPlanEntry[]
  grocery: GroceryItem[]
  refresh: () => Promise<void>
  saveProfile: (patch: Partial<Profile>) => Promise<void>
  saveClasses: (entries: ClassEntry[]) => Promise<void>
  /** Saves several alarms in one write (one local update, one request). */
  saveAlarms: (list: Alarm[]) => Promise<void>
  removeClass: (id: string) => Promise<void>
  saveAlarm: (alarm: Alarm) => Promise<void>
  saveDeadline: (deadline: Deadline) => Promise<void>
  saveDeadlines: (deadlines: Deadline[]) => Promise<void>
  removeDeadline: (id: string) => Promise<void>
  setMeal: (day: string, meal: Meal, recipeSlug: string | null) => Promise<boolean>
  fillMealPlan: (entries: MealPlanEntry[]) => Promise<boolean>
  saveGrocery: (items: GroceryItem[] | ((current: GroceryItem[]) => GroceryItem[])) => Promise<boolean>
  signOut: () => Promise<void>
}

const Ctx = createContext<AppState | null>(null)

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}

const report = (e: unknown) => Alert.alert('Not saved', e instanceof Error ? e.message : 'Try again.')

type Data = {
  profile: Profile | null
  classes: ClassEntry[]
  alarms: Alarm[]
  deadlines: Deadline[]
  mealPlan: MealPlanEntry[]
  grocery: GroceryItem[]
}

const EMPTY: Data = { profile: null, classes: [], alarms: [], deadlines: [], mealPlan: [], grocery: [] }
const DEMO: Data = { profile: demoProfile, classes: demoClasses, alarms: demoAlarms, deadlines: demoDeadlines, mealPlan: demoMealPlan, grocery: demoGrocery }

function useKitchenSave<T>(owner: string | undefined, items: T[], apply: (items: T[]) => void, write: (owner: string, items: T[]) => Promise<void>) {
  const current = useRef({ owner, shown: items, persisted: items, pending: 0, queue: Promise.resolve() })
  useEffect(() => {
    const store = current.current
    if (store.owner !== owner) {
      current.current = { owner, shown: items, persisted: items, pending: 0, queue: Promise.resolve() }
    } else if (store.pending === 0) {
      store.shown = items
      store.persisted = items
    }
  }, [items, owner])

  return useCallback((update: (items: T[]) => T[]) => {
    const active = current.current
    if (owner !== active.owner) return Promise.resolve(false)
    const next = update(active.shown)
    if (next === active.shown) return Promise.resolve(true)
    active.shown = next
    apply(next)
    if (!owner) {
      active.persisted = next
      return Promise.resolve(true)
    }
    active.pending += 1
    const save = active.queue.then(async () => {
      try {
        await write(owner, next)
        active.persisted = next
        return true
      } catch (error) {
        if (current.current === active) {
          if (active.pending === 1) {
            active.shown = active.persisted
            apply(active.persisted)
          }
          report(error)
        }
        return false
      } finally {
        active.pending -= 1
      }
    })
    active.queue = save.then(() => undefined)
    return save
  }, [apply, owner, write])
}

export function AppProvider({ children }: { children: ReactNode }) {
  const demo = !isConfigured
  const [authChecked, setAuthChecked] = useState(demo)
  const [session, setSession] = useState<Session | null>(null)
  const [data, setData] = useState<Data>(demo ? DEMO : EMPTY)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const userId = session?.user.id
  const ready = demo || (authChecked && (!userId || loadedFor === userId))

  const patch = useCallback((p: Partial<Data> | ((d: Data) => Partial<Data>)) =>
    setData(d => ({ ...d, ...(typeof p === 'function' ? p(d) : p) })), [])
  const patchPlan = useCallback((mealPlan: MealPlanEntry[]) => patch({ mealPlan }), [patch])
  const patchGrocery = useCallback((grocery: GroceryItem[]) => patch({ grocery }), [patch])
  const saveKitchenPlan = useKitchenSave(userId, data.mealPlan, patchPlan, repo.setMealPlan)
  const saveKitchenGrocery = useKitchenSave(userId, data.grocery, patchGrocery, repo.setGrocery)

  const load = useCallback(async (id: string) => {
    try {
      const [profile, classes, alarms, deadlines, mealPlan, grocery] = await Promise.all([
        repo.getProfile(id), repo.getClasses(id), repo.getAlarms(id), repo.getDeadlines(id), repo.getMealPlan(id), repo.getGrocery(id),
      ])
      setData({ profile, classes, alarms, deadlines, mealPlan, grocery })
    } catch (e) {
      report(e)
    } finally {
      setLoadedFor(id)
    }
  }, [])

  // Data loads from the auth callbacks (not a render-driven effect) when the user changes.
  useEffect(() => {
    if (demo) return
    let current: string | null = null
    const apply = (next: Session | null) => {
      setSession(next)
      const id = next?.user.id ?? null
      if (id === current) return
      current = id
      if (id) load(id)
      else { setData(EMPTY); setLoadedFor(null) }
    }
    supabase.auth.getSession().then(({ data: { session: s } }) => { apply(s); setAuthChecked(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => apply(next))
    return () => sub.subscription.unsubscribe()
  }, [demo, load])

  // Local class alarms follow the data; rescheduling is idempotent.
  useEffect(() => {
    if (ready) syncAlarmNotifications(data.alarms, data.classes).catch(() => {})
  }, [ready, data.alarms, data.classes])

  useEffect(() => {
    if (!demo && userId && ready) registerForServerPush()
  }, [demo, userId, ready])

  const value = useMemo<AppState>(() => {
    const { profile, classes, alarms, deadlines } = data
    /** Optimistic write: apply locally, persist, roll back to the snapshot on failure. */
    const persist = async (fn: (id: string) => Promise<unknown>) => {
      if (demo || !userId) return
      const snapshot = data
      try { await fn(userId) } catch (e) { setData(snapshot); report(e) }
    }

    return {
      ready, demo, session, ...data,
      refresh: async () => { if (!demo && userId) await load(userId) },

      async saveProfile(p) {
        patch({ profile: { ...(profile ?? demoProfile), ...p } })
        await persist(async id => patch({ profile: await repo.saveProfile(id, p) }))
      },

      async saveClasses(entries) {
        const byId = new Map(classes.map(c => [c.id, c]))
        entries.forEach(e => byId.set(e.id, e))
        const newAlarms: Alarm[] = entries
          .filter(e => !alarms.some(a => a.classId === e.id))
          .map(e => ({ id: repo.uid(), classId: e.id, subject: e.subject, code: e.code, time: e.start, day: e.days[0] ?? 'Mon', lead: 30, enabled: true, color: e.color }))
        const synced = alarms.map(a => {
          const e = entries.find(x => x.id === a.classId)
          return e ? { ...a, subject: e.subject, code: e.code, time: e.start, day: e.days[0] ?? a.day, color: e.color } : a
        })
        patch({ classes: [...byId.values()], alarms: [...synced, ...newAlarms] })
        await persist(async id => {
          await repo.upsertClasses(id, entries)
          await repo.upsertAlarms(id, [...synced.filter(a => entries.some(e => e.id === a.classId)), ...newAlarms])
        })
      },

      async removeClass(classId) {
        patch({ classes: classes.filter(c => c.id !== classId), alarms: alarms.filter(a => a.classId !== classId) })
        await persist(async id => { await repo.deleteAlarmsForClass(id, classId); await repo.deleteClass(id, classId) })
      },

      async saveAlarm(alarm) {
        patch({ alarms: alarms.map(a => (a.id === alarm.id ? alarm : a)) })
        await persist(id => repo.upsertAlarms(id, [alarm]))
      },

      async saveAlarms(list) {
        const byId = new Map(list.map(a => [a.id, a]))
        patch({ alarms: alarms.map(a => byId.get(a.id) ?? a) })
        await persist(id => repo.upsertAlarms(id, list))
      },

      async saveDeadline(deadline) {
        patch({ deadlines: [...deadlines.filter(d => d.id !== deadline.id), deadline].sort((a, b) => a.due.localeCompare(b.due)) })
        await persist(id => repo.upsertDeadline(id, deadline))
      },

      async saveDeadlines(list) {
        const ids = new Set(list.map(d => d.id))
        patch({ deadlines: [...deadlines.filter(d => !ids.has(d.id)), ...list].sort((a, b) => a.due.localeCompare(b.due)) })
        await persist(async id => { for (const d of list) await repo.upsertDeadline(id, d) })
      },

      async removeDeadline(deadlineId) {
        patch({ deadlines: deadlines.filter(d => d.id !== deadlineId) })
        await persist(id => repo.deleteDeadline(id, deadlineId))
      },

      setMeal(day, meal, recipeSlug) {
        return saveKitchenPlan(current => {
          const next = current.filter(item => !(item.day === day && item.meal === meal))
          if (recipeSlug) next.push({ day, meal, recipeSlug })
          return next
        })
      },

      fillMealPlan(entries) {
        return saveKitchenPlan(current => [
          ...current,
          ...entries.filter(entry => !current.some(saved => saved.day === entry.day && saved.meal === entry.meal)),
        ])
      },

      saveGrocery(items) {
        return saveKitchenGrocery(current => typeof items === 'function' ? items(current) : items)
      },

      async signOut() {
        if (!demo) await supabase.auth.signOut()
      },
    }
  }, [ready, demo, session, data, userId, load, patch, saveKitchenPlan, saveKitchenGrocery])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
