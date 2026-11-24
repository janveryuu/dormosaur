import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Session } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Alert } from 'react-native'
import { avatar } from '@/lib/avatar'
import { clearScheduledAlarms, registerForServerPush, syncAlarmNotifications, unregisterServerPush } from '@/lib/notifications'
import { pro } from '@/lib/pro'
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
  saveProfile: (patch: Partial<Profile>) => Promise<boolean>
  saveClasses: (entries: ClassEntry[]) => Promise<boolean>
  /** Saves several alarms in one write (one local update, one request). */
  saveAlarms: (list: Alarm[]) => Promise<boolean>
  removeClass: (id: string) => Promise<boolean>
  saveAlarm: (alarm: Alarm) => Promise<boolean>
  saveDeadline: (deadline: Deadline) => Promise<boolean>
  saveDeadlines: (deadlines: Deadline[]) => Promise<boolean>
  removeDeadline: (id: string) => Promise<boolean>
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

function emptyProfile(id: string): Profile {
  return {
    id, name: '', school: '', dorm: '', year: '', initials: '',
    is_dorm_student: true, onboarding_completed: false,
  }
}

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
  const dataRef = useRef<Data>(data)
  const userId = session?.user.id
  const activeUserRef = useRef<string | undefined>(userId)
  useEffect(() => {
    dataRef.current = data
    activeUserRef.current = userId
  }, [data, userId])
  const ready = demo || (authChecked && (!userId || loadedFor === userId))

  const commit = useCallback((updater: (prev: Data) => Data) => {
    const next = updater(dataRef.current)
    dataRef.current = next
    setData(next)
    return next
  }, [])

  const patch = useCallback((p: Partial<Data> | ((d: Data) => Partial<Data>)) => {
    commit(d => ({ ...d, ...(typeof p === 'function' ? p(d) : p) }))
  }, [commit])

  const patchPlan = useCallback((mealPlan: MealPlanEntry[]) => patch({ mealPlan }), [patch])
  const patchGrocery = useCallback((grocery: GroceryItem[]) => patch({ grocery }), [patch])
  const saveKitchenPlan = useKitchenSave(userId, data.mealPlan, patchPlan, repo.setMealPlan)
  const saveKitchenGrocery = useKitchenSave(userId, data.grocery, patchGrocery, repo.setGrocery)

  const load = useCallback(async (id: string) => {
    try {
      const [profile, classes, alarms, deadlines, mealPlan, grocery] = await Promise.all([
        repo.getProfile(id), repo.getClasses(id), repo.getAlarms(id), repo.getDeadlines(id), repo.getMealPlan(id), repo.getGrocery(id),
      ])
      if (activeUserRef.current !== id) return
      const loaded = { profile, classes, alarms, deadlines, mealPlan, grocery }
      dataRef.current = loaded
      setData(loaded)
    } catch (e) {
      report(e)
    } finally {
      if (activeUserRef.current === id) setLoadedFor(id)
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
      activeUserRef.current = id ?? undefined
      if (id) load(id)
      else {
        dataRef.current = EMPTY
        setData(EMPTY)
        setLoadedFor(null)
      }
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
    /** Optimistic slice write: apply locally, persist, roll back only touched keys on failure. */
    const persistSlices = async <K extends keyof Data>(
      keys: readonly K[],
      optimistic: (curr: Data) => Pick<Data, K>,
      fn: (id: string) => Promise<void>,
    ): Promise<boolean> => {
      const before = dataRef.current
      const snapshot = {} as Pick<Data, K>
      for (const k of keys) snapshot[k] = before[k]
      commit(curr => ({ ...curr, ...optimistic(curr) }))
      if (demo) return true
      if (!userId) return false
      const ownerAtStart = userId
      try {
        await fn(ownerAtStart)
        return true
      } catch (e) {
        if (activeUserRef.current === ownerAtStart) {
          commit(curr => ({ ...curr, ...snapshot }))
          report(e)
        }
        return false
      }
    }

    return {
      ready, demo, session, ...data,
      refresh: async () => { if (!demo && userId) await load(userId) },

      saveProfile(p) {
        return persistSlices(
          ['profile'],
          curr => {
            const base = curr.profile ?? (demo ? demoProfile : emptyProfile(userId ?? ''))
            return { profile: { ...base, ...p } }
          },
          async id => {
            const saved = await repo.saveProfile(id, p)
            if (activeUserRef.current === id) patch({ profile: saved })
          },
        )
      },

      saveClasses(entries) {
        const curr = dataRef.current
        const byId = new Map(curr.classes.map(c => [c.id, c]))
        entries.forEach(e => byId.set(e.id, e))
        const newAlarms: Alarm[] = entries
          .filter(e => !curr.alarms.some(a => a.classId === e.id))
          .map(e => ({ id: repo.uid(), classId: e.id, subject: e.subject, code: e.code, time: e.start, day: e.days[0] ?? 'Mon', lead: 15, enabled: true, color: e.color }))
        const synced = curr.alarms.map(a => {
          const e = entries.find(x => x.id === a.classId)
          return e ? { ...a, subject: e.subject, code: e.code, time: e.start, day: e.days[0] ?? a.day, color: e.color } : a
        })
        const nextClasses = [...byId.values()]
        const nextAlarms = [...synced, ...newAlarms]
        return persistSlices(
          ['classes', 'alarms'],
          () => ({ classes: nextClasses, alarms: nextAlarms }),
          async id => {
            await repo.upsertClasses(id, entries)
            await repo.upsertAlarms(id, [...synced.filter(a => entries.some(e => e.id === a.classId)), ...newAlarms])
          },
        )
      },

      removeClass(classId) {
        return persistSlices(
          ['classes', 'alarms'],
          curr => ({
            classes: curr.classes.filter(c => c.id !== classId),
            alarms: curr.alarms.filter(a => a.classId !== classId),
          }),
          async id => {
            await repo.deleteAlarmsForClass(id, classId)
            await repo.deleteClass(id, classId)
          },
        )
      },

      saveAlarm(alarm) {
        return persistSlices(
          ['alarms'],
          curr => ({ alarms: curr.alarms.map(a => (a.id === alarm.id ? alarm : a)) }),
          id => repo.upsertAlarms(id, [alarm]),
        )
      },

      saveAlarms(list) {
        const byId = new Map(list.map(a => [a.id, a]))
        return persistSlices(
          ['alarms'],
          curr => ({ alarms: curr.alarms.map(a => byId.get(a.id) ?? a) }),
          id => repo.upsertAlarms(id, list),
        )
      },

      saveDeadline(deadline) {
        return persistSlices(
          ['deadlines'],
          curr => ({
            deadlines: [...curr.deadlines.filter(d => d.id !== deadline.id), deadline].sort((a, b) => a.due.localeCompare(b.due)),
          }),
          id => repo.upsertDeadline(id, deadline),
        )
      },

      saveDeadlines(list) {
        const ids = new Set(list.map(d => d.id))
        return persistSlices(
          ['deadlines'],
          curr => ({
            deadlines: [...curr.deadlines.filter(d => !ids.has(d.id)), ...list].sort((a, b) => a.due.localeCompare(b.due)),
          }),
          id => repo.upsertDeadlines(id, list),
        )
      },

      removeDeadline(deadlineId) {
        return persistSlices(
          ['deadlines'],
          curr => ({ deadlines: curr.deadlines.filter(d => d.id !== deadlineId) }),
          id => repo.deleteDeadline(id, deadlineId),
        )
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
        if (demo) return
        const uidBeforeOut = activeUserRef.current
        await unregisterServerPush().catch(() => {})
        await clearScheduledAlarms().catch(() => {})
        avatar.clear()
        pro.clear()
        await AsyncStorage.multiRemove([
          'dormosaur.onboarding.draft',
          'dormosaur.pay.draft.v1',
          ...(uidBeforeOut ? [`dormosaur.onboarding.draft.${uidBeforeOut}`, `dormosaur.pay.draft.v1.${uidBeforeOut}`] : []),
        ]).catch(() => {})
        await supabase.auth.signOut()
        activeUserRef.current = undefined
        dataRef.current = EMPTY
        setData(EMPTY)
        setLoadedFor(null)
        setSession(null)
      },
    }
  }, [ready, demo, session, data, userId, load, commit, patch, saveKitchenPlan, saveKitchenGrocery])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
