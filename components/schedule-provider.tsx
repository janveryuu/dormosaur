'use client'

import * as React from 'react'
import {
  profile as defaultProfile,
  recipes,
  type Alarm,
  type ClassEntry,
  type SubjectColor,
  type ApplianceType,
  type DietaryPreference,
} from '@/lib/data'
import { createClient } from '@/lib/supabase/client'
import {
  getClasses,
  getAlarms,
  getDeadlines,
  getMealPlan,
  getGrocery,
  getUserProfile,
  setClasses,
  setAlarms,
  setDeadlines as setDeadlinesCloud,
  setMealPlan,
  setGrocery,
  upsertUserProfile,
  seedNewUser,
} from '@/lib/db'

type UserProfile = typeof defaultProfile

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

const defaultMealPlan: MealPlanEntry[] = [
  { day: 'Mon', meal: 'Breakfast', recipeSlug: 'no-cook-overnight-oats' },
  { day: 'Wed', meal: 'Dinner', recipeSlug: 'rice-cooker-congee' },
  { day: 'Fri', meal: 'Lunch', recipeSlug: 'upgraded-instant-ramen' },
]


interface ScheduleContextType {
  classes: ClassEntry[]
  alarms: Alarm[]
  profile: UserProfile
  mealPlan: MealPlanEntry[]
  groceryItems: GroceryItem[]
  deadlines: DeadlineItem[]
  isSyncing: boolean
  syncError: string | null
  retrySync: () => void
  saveClasses: (entries: ClassEntry[]) => Promise<void>
  saveDeadlines: (entries: DeadlineItem[]) => Promise<void>
  setClasses: React.Dispatch<React.SetStateAction<ClassEntry[]>>
  setAlarms: React.Dispatch<React.SetStateAction<Alarm[]>>
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>
  setDeadlines: React.Dispatch<React.SetStateAction<DeadlineItem[]>>
  addClasses: (newClasses: ClassEntry[]) => void
  addClass: (newClass: ClassEntry) => void
  updateClass: (id: string, updated: Partial<ClassEntry>) => void
  deleteClass: (id: string) => void
  toggleAlarm: (id: string, enabled?: boolean) => void
  updateAlarmLead: (id: string, lead: 15 | 30 | 60) => void
  setMealPlanItem: (day: string, meal: MealPlanEntry['meal'], recipeSlug: string) => void
  removeMealPlanItem: (day: string, meal: MealPlanEntry['meal']) => void
  toggleGroceryItem: (id: string) => void
  addCustomGroceryItem: (name: string) => void
  removeGroceryItem: (id: string) => void
  addDeadline: (deadline: Omit<DeadlineItem, 'id' | 'completed'>) => void
  toggleDeadlineCompleted: (id: string) => void
  deleteDeadline: (id: string) => void
  resetToDemo: () => void
  isHydrated: boolean
}

const ScheduleContext = React.createContext<ScheduleContextType | undefined>(undefined)

const STORAGE_KEYS = {
  CLASSES: 'dormosaur_classes_v1',
  ALARMS: 'dormosaur_alarms_v1',
  PROFILE: 'dormosaur_profile_v1',
  MEALPLAN: 'dormosaur_mealplan_v1',
  GROCERY: 'dormosaur_grocery_v1',
  DEADLINES: 'dormosaur_deadlines_v1',
}

function generateAlarmsFromClasses(classList: ClassEntry[]): Alarm[] {
  let alarmCount = 1
  return classList.map((cls) => ({
    id: `alarm-${cls.id}-${alarmCount++}`,
    classId: cls.id,
    subject: cls.subject,
    code: cls.code,
    time: cls.start,
    day: 'Today',
    lead: 30 as const,
    enabled: true,
    color: cls.color,
  }))
}

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [classes, setClassesState] = React.useState<ClassEntry[]>([])
  const [alarms, setAlarmsState] = React.useState<Alarm[]>([])
  const [profile, setProfileState] = React.useState<UserProfile>(defaultProfile)
  const [mealPlan, setMealPlanState] = React.useState<MealPlanEntry[]>([])
  const [groceryItems, setGroceryItemsState] = React.useState<GroceryItem[]>([])
  const [deadlines, setDeadlinesState] = React.useState<DeadlineItem[]>([])
  const [isHydrated, setIsHydrated] = React.useState(false)
  const [isSyncing, setIsSyncing] = React.useState(false)
  const [userId, setUserId] = React.useState<string | null>(null)
  const [syncError, setSyncError] = React.useState<string | null>(null)
  const [retryVersion, reloadSaved] = React.useReducer((n: number) => n + 1, 0)
  const retrySync = () => {
    if (syncError?.includes('load') || syncError?.includes('session')) reloadSaved()
    else setSyncError(null)
  }
  const activeOwner = React.useRef<string | null>(null)
  const saved = React.useRef<Record<string, string>>({})
  const scheduled = React.useRef<Record<string, string>>({})
  const writeQueue = React.useRef<Promise<void>>(Promise.resolve())

  // ─── Sync grocery items automatically when meal plan changes ───────────────
  const syncGroceryFromMealPlan = React.useCallback(
    (currentMealPlan: MealPlanEntry[], currentGrocery: GroceryItem[] = []) => {
      const existingMap = new Map(currentGrocery.map((g) => [g.name.toLowerCase(), g]))
      const aggregated = new Set<string>()

      currentMealPlan.forEach((plan) => {
        const recipe = recipes.find((r) => r.slug === plan.recipeSlug)
        if (recipe && Array.isArray(recipe.ingredients)) {
          recipe.ingredients.forEach((ing) => {
            if (typeof ing === 'string') {
              aggregated.add(ing.trim())
            }
          })
        }
      })

      return [...Array.from(aggregated).map((name) => ({
        id: existingMap.get(name.toLowerCase())?.id || crypto.randomUUID(),
        name, checked: existingMap.get(name.toLowerCase())?.checked ?? false,
      })), ...currentGrocery.filter(g => g.custom)]
    },
    [],
  )

  // Resolve ownership before reading a cache. Old unscoped caches remain available
  // to guests, but must never be attributed to another signed-in student.
  React.useEffect(() => {
    const supabase = createClient()
    let generation = 0
    let disposed = false
    let authChanged = false
    let currentOwner: string | null | undefined
    async function hydrate(user: { id: string; user_metadata?: Record<string, unknown> } | null, force = false) {
      const owner = user?.id ?? null
      if (!force && currentOwner === owner) return
      currentOwner = owner
      const version = ++generation
      if (activeOwner.current !== owner) {
        // Clear the previous account before any network wait can expose it.
        setClassesState([]); setAlarmsState([]); setDeadlinesState([])
        setMealPlanState([]); setGroceryItemsState([])
        setProfileState({ ...defaultProfile, name: '', school: '', dorm: '', year: '', initials: '', avatar_url: '', appliances: [] })
      }
      activeOwner.current = owner
      setIsHydrated(false)
      setIsSyncing(Boolean(owner))
      setUserId(owner)
      setSyncError(null)
      const cached: Record<string, unknown> = {}
      for (const [name, key] of Object.entries(STORAGE_KEYS)) {
        try {
          const raw = localStorage.getItem(owner ? `${key}:${owner}` : key)
          const value: unknown = raw ? JSON.parse(raw) : null
          if (name === 'PROFILE' ? value && typeof value === 'object' && !Array.isArray(value) : Array.isArray(value)) cached[name] = value
        } catch { /* Corrupt or unavailable browser cache does not replace cloud data. */ }
      }
      let nextProfile: UserProfile = { ...defaultProfile, ...(cached.PROFILE as Partial<UserProfile> || {}) }
      let nextClasses = cached.CLASSES as ClassEntry[] || []
      let nextAlarms = cached.ALARMS as Alarm[] || []
      let nextDeadlines = cached.DEADLINES as DeadlineItem[] || []
      let nextMealPlan = cached.MEALPLAN as MealPlanEntry[] || []
      let nextGrocery = cached.GROCERY as GroceryItem[] || []
      if (user) {
        try {
          const dbProfile = await getUserProfile(supabase, user.id)
          if (!dbProfile) await seedNewUser(supabase, user.id, { name: typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '' })
          nextProfile = { ...defaultProfile,
            name: dbProfile?.name || '', school: dbProfile?.school || '', dorm: dbProfile?.dorm || '',
            year: dbProfile?.year || '', initials: dbProfile?.initials || '',
            avatar_url: typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : '',
            country: dbProfile?.country || 'PH', timezone: dbProfile?.timezone || 'Asia/Manila',
            appliances: (dbProfile?.appliances as ApplianceType[]) || [],
            dietary_preference: (dbProfile?.dietary_preference as DietaryPreference) || 'none', dietary_note: dbProfile?.dietary_note || '',
          }
          ;[nextClasses, nextAlarms, nextDeadlines, nextMealPlan, nextGrocery] = await Promise.all([
            getClasses(supabase, user.id), getAlarms(supabase, user.id), getDeadlines(supabase, user.id, nextProfile.timezone),
            getMealPlan(supabase, user.id), getGrocery(supabase, user.id),
          ])
        } catch {
          if (disposed || version !== generation) return
          setSyncError('We could not load your saved data. Your existing data is still saved. Please retry.')
        }
      }
      if (disposed || version !== generation) return
      const snapshots = { CLASSES: nextClasses, ALARMS: nextAlarms, PROFILE: nextProfile, DEADLINES: nextDeadlines, MEALPLAN: nextMealPlan, GROCERY: nextGrocery }
      saved.current = Object.fromEntries(Object.entries(snapshots).map(([key, value]) => [key, JSON.stringify(value)]))
      scheduled.current = { ...saved.current }
      setClassesState(nextClasses); setAlarmsState(nextAlarms); setProfileState(nextProfile)
      setDeadlinesState(nextDeadlines); setMealPlanState(nextMealPlan); setGroceryItemsState(nextGrocery)
      setIsSyncing(false); setIsHydrated(true)
    }
    void supabase.auth.getUser().then(({ data }) => { if (!authChanged) return hydrate(data.user, true) }).catch(() => {
      if (!disposed) { setIsHydrated(true); setSyncError('We could not check your session. Please reconnect and retry.') }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        authChanged = true
        // Leave the auth callback before requesting Supabase data (avoids auth locks).
        queueMicrotask(() => { if (!disposed) void hydrate(session?.user ?? null) })
      }
    })
    return () => { disposed = true; generation++; subscription.unsubscribe() }
  }, [retryVersion])

  // Persist committed React state, once, rather than doing I/O inside state
  // updater callbacks (which React may invoke more than once).
  React.useEffect(() => {
    if (!isHydrated || activeOwner.current !== userId) return
    const snapshots = { CLASSES: classes, ALARMS: alarms, PROFILE: profile, DEADLINES: deadlines, MEALPLAN: mealPlan, GROCERY: groceryItems }
    const owner = userId
    for (const [name, value] of Object.entries(snapshots)) {
      const serialized = JSON.stringify(value)
      try { localStorage.setItem(owner ? `${STORAGE_KEYS[name as keyof typeof STORAGE_KEYS]}:${owner}` : STORAGE_KEYS[name as keyof typeof STORAGE_KEYS], serialized) } catch {}
      if (!owner || syncError || serialized === scheduled.current[name]) continue
      scheduled.current[name] = serialized
      writeQueue.current = writeQueue.current.then(async () => {
        if (activeOwner.current !== owner) return
        const supabase = createClient()
        if (name === 'CLASSES') await setClasses(supabase, owner, value as ClassEntry[])
        if (name === 'ALARMS') await setAlarms(supabase, owner, value as Alarm[])
        if (name === 'DEADLINES') await setDeadlinesCloud(supabase, owner, value as DeadlineItem[], profile.timezone)
        if (name === 'MEALPLAN') await setMealPlan(supabase, owner, value as MealPlanEntry[])
        if (name === 'GROCERY') await setGrocery(supabase, owner, value as GroceryItem[])
        if (name === 'PROFILE') {
          await upsertUserProfile(supabase, owner, { name: profile.name, school: profile.school, dorm: profile.dorm,
            year: profile.year, initials: profile.initials, country: profile.country, timezone: profile.timezone,
            appliances: profile.appliances, dietary_preference: profile.dietary_preference, dietary_note: profile.dietary_note })
        }
        if (activeOwner.current === owner) saved.current[name] = serialized
      }).catch(() => {
        if (activeOwner.current === owner) {
          scheduled.current[name] = saved.current[name]
          setSyncError('We could not save your latest changes online. They remain on this device. Please reconnect and try again.')
        }
      })
    }
  }, [classes, alarms, profile, deadlines, mealPlan, groceryItems, isHydrated, userId, syncError])

  // ─── Actions ─────────────────────────────────────────────────────────────────

  const saveClasses = async (entries: ClassEntry[]) => {
    const owner = userId
    const newAlarms = generateAlarmsFromClasses(entries).map(a => ({ ...a, ...(alarms.find(old => old.classId === a.classId) || {}), time: a.time, subject: a.subject, code: a.code }))
    if (owner) {
      if (syncError) throw new Error('Please reconnect before saving.')
      const work = writeQueue.current.then(async () => {
        if (activeOwner.current !== owner) throw new Error('Your session changed. Please sign in again.')
        const supabase = createClient()
        await setClasses(supabase, owner, entries)
        await setAlarms(supabase, owner, newAlarms)
      })
      writeQueue.current = work.catch(() => {})
      await work
    }
    if (activeOwner.current !== owner) throw new Error('Your session changed. Please sign in again.')
    saved.current.CLASSES = scheduled.current.CLASSES = JSON.stringify(entries)
    saved.current.ALARMS = scheduled.current.ALARMS = JSON.stringify(newAlarms)
    setClassesState(entries); setAlarmsState(newAlarms)
  }
  const saveDeadlines = async (entries: DeadlineItem[]) => {
    const owner = userId
    if (owner) {
      if (syncError) throw new Error('Please reconnect before saving.')
      const work = writeQueue.current.then(async () => {
        if (activeOwner.current !== owner) throw new Error('Your session changed. Please sign in again.')
        await setDeadlinesCloud(createClient(), owner, entries, profile.timezone)
      })
      writeQueue.current = work.catch(() => {})
      await work
    }
    if (activeOwner.current !== owner) throw new Error('Your session changed. Please sign in again.')
    saved.current.DEADLINES = scheduled.current.DEADLINES = JSON.stringify(entries)
    setDeadlinesState(entries)
  }

  const addClasses = (newClasses: ClassEntry[]) => {
    setClassesState(newClasses)
    const generated = generateAlarmsFromClasses(newClasses)
    const newAlarms = generated.map(a => ({ ...a, ...(alarms.find(existing => existing.classId === a.classId) || {}), time: a.time, subject: a.subject, code: a.code }))
    setAlarmsState(newAlarms)
  }

  const addClass = (newClass: ClassEntry) => {
    setClassesState((prev) => {
      const next = [...prev, newClass]
      return next
    })

    const newAlarm: Alarm = {
      id: `alarm-${newClass.id}-${Date.now()}`,
      classId: newClass.id,
      subject: newClass.subject,
      code: newClass.code,
      time: newClass.start,
      day: 'Today',
      lead: 30,
      enabled: true,
      color: newClass.color,
    }

    setAlarmsState((prev) => {
      const nextAlarms = [...prev, newAlarm]
      return nextAlarms
    })
  }

  const updateClass = (id: string, updated: Partial<ClassEntry>) => {
    setClassesState((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
      return next
    })
    setAlarmsState((prev) => {
      const nextAlarms = prev.map((a) =>
        a.classId === id
          ? {
              ...a,
              subject: updated.subject ?? a.subject,
              code: updated.code ?? a.code,
              time: updated.start ?? a.time,
              color: updated.color ?? a.color,
            }
          : a,
      )
      return nextAlarms
    })
  }

  const deleteClass = (id: string) => {
    setClassesState((prev) => {
      const next = prev.filter((c) => c.id !== id)
      return next
    })
    setAlarmsState((prev) => {
      const nextAlarms = prev.filter((a) => a.classId !== id)
      return nextAlarms
    })
  }

  const toggleAlarm = (id: string, enabled?: boolean) => {
    setAlarmsState((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, enabled: enabled ?? !a.enabled } : a))
      return next
    })
  }

  const updateAlarmLead = (id: string, lead: 15 | 30 | 60) => {
    setAlarmsState((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, lead } : a))
      return next
    })
  }

  const setMealPlanItem = (day: string, meal: MealPlanEntry['meal'], recipeSlug: string) => {
    setMealPlanState((prev) => {
      const filtered = prev.filter((p) => !(p.day === day && p.meal === meal))
      const next = [...filtered, { day, meal, recipeSlug }]
      return next
    })
    setGroceryItemsState(prev => syncGroceryFromMealPlan([...mealPlan.filter(p => !(p.day === day && p.meal === meal)), { day, meal, recipeSlug }], prev))
  }

  const removeMealPlanItem = (day: string, meal: MealPlanEntry['meal']) => {
    setMealPlanState((prev) => {
      const next = prev.filter((p) => !(p.day === day && p.meal === meal))
      return next
    })
    setGroceryItemsState(prev => syncGroceryFromMealPlan(mealPlan.filter(p => !(p.day === day && p.meal === meal)), prev))
  }

  const toggleGroceryItem = (id: string) => {
    setGroceryItemsState((prev) => {
      const next = prev.map((g) => (g.id === id ? { ...g, checked: !g.checked } : g))
      return next
    })
  }

  const addCustomGroceryItem = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const newItem: GroceryItem = {
      id: crypto.randomUUID(),
      name: trimmed,
      checked: false,
      custom: true,
    }
    setGroceryItemsState((prev) => {
      const next = [...prev, newItem]
      return next
    })
  }

  const removeGroceryItem = (id: string) => {
    setGroceryItemsState((prev) => {
      const next = prev.filter((g) => g.id !== id)
      return next
    })
  }

  const addDeadline = (deadline: Omit<DeadlineItem, 'id' | 'completed'>) => {
    const newItem: DeadlineItem = {
      ...deadline,
      id: crypto.randomUUID(),
      completed: false,
    }
    setDeadlinesState((prev) => {
      const next = [...prev, newItem]
      return next
    })
  }

  const toggleDeadlineCompleted = (id: string) => {
    setDeadlinesState((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, completed: !d.completed } : d))
      return next
    })
  }

  const deleteDeadline = (id: string) => {
    setDeadlinesState((prev) => {
      const next = prev.filter((d) => d.id !== id)
      return next
    })
  }

  const resetToDemo = () => {
    // Reset the local guest workspace only; authenticated data needs an explicit
    // account-management operation, not a seed helper or localStorage.clear().
    if (userId) return
    setClassesState([]); setAlarmsState([]); setProfileState(defaultProfile)
    setMealPlanState([]); setDeadlinesState([]); setGroceryItemsState([])
    for (const key of Object.values(STORAGE_KEYS)) localStorage.removeItem(key)
  }

  const setDeadlines: React.Dispatch<React.SetStateAction<DeadlineItem[]>> = (value) => {
    setDeadlinesState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value
      return next
    })
  }

  const setProfile: React.Dispatch<React.SetStateAction<UserProfile>> = (value) => {
    setProfileState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value
      return next
    })
  }

  return (
    <ScheduleContext.Provider
      value={{
        classes,
        alarms,
        profile,
        mealPlan,
        groceryItems,
        deadlines,
        isSyncing,
        syncError,
        retrySync,
        saveClasses,
        saveDeadlines,
        setClasses: setClassesState,
        setAlarms: setAlarmsState,
        setProfile,
        setDeadlines,
        addClasses,
        addClass,
        updateClass,
        deleteClass,
        toggleAlarm,
        updateAlarmLead,
        setMealPlanItem,
        removeMealPlanItem,
        toggleGroceryItem,
        addCustomGroceryItem,
        removeGroceryItem,
        addDeadline,
        toggleDeadlineCompleted,
        deleteDeadline,
        resetToDemo,
        isHydrated,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  )
}

export function useSchedule() {
  const context = React.useContext(ScheduleContext)
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider')
  }
  return context
}
