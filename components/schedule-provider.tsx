'use client'

import * as React from 'react'
import {
  alarms as defaultAlarms,
  classes as defaultClasses,
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
  const [mealPlan, setMealPlanState] = React.useState<MealPlanDay[]>(defaultMealPlan)
  const [groceryItems, setGroceryItemsState] = React.useState<GroceryItem[]>([])
  const [deadlines, setDeadlinesState] = React.useState<DeadlineItem[]>([])
  const [isHydrated, setIsHydrated] = React.useState(false)
  const [isSyncing, setIsSyncing] = React.useState(false)
  const [userId, setUserId] = React.useState<string | null>(null)

  // ─── Sync grocery items automatically when meal plan changes ───────────────
  const syncGroceryFromMealPlan = React.useCallback(
    (currentMealPlan: MealPlanDay[], currentGrocery: GroceryItem[] = []) => {
      const existingMap = new Map(currentGrocery.map((g) => [g.name.toLowerCase(), g.checked]))
      const aggregated: Record<string, { category: GroceryCategory; amount: string }> = {}

      currentMealPlan.forEach((day) => {
        const types: (keyof MealPlanDay)[] = ['breakfast', 'lunch', 'dinner', 'snack']
        types.forEach((type) => {
          const recipe = day[type] as Recipe | undefined
          if (recipe) {
            recipe.ingredients.forEach((ing) => {
              const nameKey = ing.name.trim()
              if (!aggregated[nameKey]) {
                aggregated[nameKey] = { category: ing.category, amount: ing.amount }
              }
            })
          }
        })
      })

      return Object.entries(aggregated).map(([name, data], idx) => ({
        id: `groc-${idx}-${name.replace(/\s+/g, '-').toLowerCase()}`,
        name,
        amount: data.amount,
        category: data.category,
        checked: existingMap.get(name.toLowerCase()) ?? false,
      }))
    },
    [],
  )

  // ─── Hydration: localStorage first, then Supabase ────────────────────────────
  React.useEffect(() => {
    const supabase = createClient()

    async function hydrate() {
      // 1. Load from localStorage immediately (instant paint)
      try {
        const savedClasses = localStorage.getItem(STORAGE_KEYS.CLASSES) || localStorage.getItem('dormly_classes_v1')
        const savedAlarms = localStorage.getItem(STORAGE_KEYS.ALARMS) || localStorage.getItem('dormly_alarms_v1')
        const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE) || localStorage.getItem('dormly_profile_v1')
        const savedMealPlan = localStorage.getItem(STORAGE_KEYS.MEALPLAN) || localStorage.getItem('dormly_mealplan_v1')
        const savedGrocery = localStorage.getItem(STORAGE_KEYS.GROCERY) || localStorage.getItem('dormly_grocery_v1')
        const savedDeadlines = localStorage.getItem(STORAGE_KEYS.DEADLINES) || localStorage.getItem('dormly_deadlines_v1')

        if (savedClasses) setClassesState(JSON.parse(savedClasses))
        if (savedAlarms) setAlarmsState(JSON.parse(savedAlarms))
        if (savedProfile) setProfileState(JSON.parse(savedProfile))
        if (savedMealPlan) setMealPlanState(JSON.parse(savedMealPlan))
        if (savedDeadlines) setDeadlinesState(JSON.parse(savedDeadlines))
        if (savedGrocery) {
          setGroceryItemsState(JSON.parse(savedGrocery))
        } else {
          const mp = savedMealPlan ? JSON.parse(savedMealPlan) : defaultMealPlan
          setGroceryItemsState(syncGroceryFromMealPlan(mp, []))
        }
      } catch (err) {
        console.error('localStorage hydration error', err)
      }

      setIsHydrated(true)

      // 2. Get Supabase user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)
      setIsSyncing(true)

      try {
        // 3. Load from Supabase (source of truth)
        const [dbProfile, dbClasses, dbAlarms, dbDeadlines, dbMealPlan, dbGrocery] =
          await Promise.all([
            getUserProfile(supabase, user.id),
            getClasses(supabase, user.id),
            getAlarms(supabase, user.id),
            getDeadlines(supabase, user.id),
            getMealPlan(supabase, user.id),
            getGrocery(supabase, user.id),
          ])

        // If brand new user with no data, seed them
        if (!dbProfile) {
          await seedNewUser(supabase, user.id)
          return
        }

        // Map DB profile to local profile shape
        if (dbProfile) {
          setProfileState((prev) => ({
            ...prev,
            name: dbProfile.name || prev.name,
            school: dbProfile.school || prev.school,
            dorm: dbProfile.dorm || prev.dorm,
            year: dbProfile.year !== undefined && dbProfile.year !== null ? dbProfile.year : (prev.year || ''),
            avatar_url: dbProfile.avatar_url || prev.avatar_url || '',
            initials: dbProfile.initials || prev.initials,
            country: dbProfile.country || prev.country || 'PH',
            timezone: dbProfile.timezone || prev.timezone || 'Asia/Manila',
            appliances: (dbProfile.appliances as ApplianceType[]) || prev.appliances || ['microwave', 'kettle'],
            dietary_preference: (dbProfile.dietary_preference as DietaryPreference) || prev.dietary_preference || 'none',
            dietary_note: dbProfile.dietary_note ?? prev.dietary_note ?? '',
          }))
        }
        setClassesState(dbClasses)
        setAlarmsState(dbAlarms)
        setDeadlinesState(dbDeadlines)
        if (dbMealPlan.length > 0) setMealPlanState(dbMealPlan)
        if (dbGrocery.length > 0) {
          setGroceryItemsState(dbGrocery)
        }
      } catch (err) {
        console.warn('Supabase sync notice:', err)
      } finally {
        setIsSyncing(false)
      }
    }

    hydrate()

    // Listen for auth changes to re-sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') hydrate()
      if (event === 'SIGNED_OUT') {
        // Reset to defaults on sign out
        setClassesState([])
        setAlarmsState([])
        setProfileState(defaultProfile)
        setMealPlanState(defaultMealPlan)
        setDeadlinesState([])
        setGroceryItemsState(syncGroceryFromMealPlan(defaultMealPlan))
        setUserId(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [syncGroceryFromMealPlan])

  // ─── Sync grocery when meal plan changes ─────────────────────────────────────
  React.useEffect(() => {
    if (!isHydrated) return
    setGroceryItemsState((prev) => syncGroceryFromMealPlan(mealPlan, prev))
  }, [mealPlan, isHydrated, syncGroceryFromMealPlan])

  // ─── Save to localStorage (always, for offline/instant access) ───────────────
  React.useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes))
      localStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(alarms))
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile))
      localStorage.setItem(STORAGE_KEYS.MEALPLAN, JSON.stringify(mealPlan))
      localStorage.setItem(STORAGE_KEYS.GROCERY, JSON.stringify(groceryItems))
      localStorage.setItem(STORAGE_KEYS.DEADLINES, JSON.stringify(deadlines))
    } catch (e) {
      console.warn('LocalStorage save notice:', e)
    }
  }, [classes, alarms, profile, mealPlan, groceryItems, deadlines, isHydrated])

  // ─── Helpers to write to Supabase in the background ──────────────────────────
  function syncToCloud<T>(fn: () => Promise<T>) {
    if (!userId) return
    fn().catch((err) => console.warn('Cloud sync notice:', err))
  }

  // ─── Actions ─────────────────────────────────────────────────────────────────

  const addClasses = (newClasses: ClassEntry[]) => {
    setClassesState(newClasses)
    const newAlarms = generateAlarmsFromClasses(newClasses)
    setAlarmsState(newAlarms)
    syncToCloud(async () => {
      const supabase = createClient()
      await Promise.all([
        setClasses(supabase, userId!, newClasses),
        setAlarms(supabase, userId!, newAlarms),
      ])
    })
  }

  const addClass = (newClass: ClassEntry) => {
    setClassesState((prev) => {
      const next = [...prev, newClass]
      syncToCloud(async () => {
        const supabase = createClient()
        await setClasses(supabase, userId!, next)
      })
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
      syncToCloud(async () => {
        const supabase = createClient()
        await setAlarms(supabase, userId!, nextAlarms)
      })
      return nextAlarms
    })
  }

  const updateClass = (id: string, updated: Partial<ClassEntry>) => {
    setClassesState((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
      syncToCloud(async () => {
        const supabase = createClient()
        await setClasses(supabase, userId!, next)
      })
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
      syncToCloud(async () => {
        const supabase = createClient()
        await setAlarms(supabase, userId!, nextAlarms)
      })
      return nextAlarms
    })
  }

  const deleteClass = (id: string) => {
    setClassesState((prev) => {
      const next = prev.filter((c) => c.id !== id)
      syncToCloud(async () => {
        const supabase = createClient()
        await setClasses(supabase, userId!, next)
      })
      return next
    })
    setAlarmsState((prev) => {
      const nextAlarms = prev.filter((a) => a.classId !== id)
      syncToCloud(async () => {
        const supabase = createClient()
        await setAlarms(supabase, userId!, nextAlarms)
      })
      return nextAlarms
    })
  }

  const toggleAlarm = (id: string, enabled?: boolean) => {
    setAlarmsState((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, enabled: enabled ?? !a.enabled } : a))
      syncToCloud(async () => {
        const supabase = createClient()
        await setAlarms(supabase, userId!, next)
      })
      return next
    })
  }

  const updateAlarmLead = (id: string, lead: 15 | 30 | 60) => {
    setAlarmsState((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, lead } : a))
      syncToCloud(async () => {
        const supabase = createClient()
        await setAlarms(supabase, userId!, next)
      })
      return next
    })
  }

  const setMealPlanItem = (day: string, meal: MealPlanEntry['meal'], recipeSlug: string) => {
    setMealPlanState((prev) => {
      const filtered = prev.filter((p) => !(p.day === day && p.meal === meal))
      const next = [...filtered, { day, meal, recipeSlug }]
      syncToCloud(async () => {
        const supabase = createClient()
        await setMealPlan(supabase, userId!, next)
      })
      return next
    })
  }

  const removeMealPlanItem = (day: string, meal: MealPlanEntry['meal']) => {
    setMealPlanState((prev) => {
      const next = prev.filter((p) => !(p.day === day && p.meal === meal))
      syncToCloud(async () => {
        const supabase = createClient()
        await setMealPlan(supabase, userId!, next)
      })
      return next
    })
  }

  const toggleGroceryItem = (id: string) => {
    setGroceryItemsState((prev) => {
      const next = prev.map((g) => (g.id === id ? { ...g, checked: !g.checked } : g))
      syncToCloud(async () => {
        const supabase = createClient()
        await setGrocery(supabase, userId!, next)
      })
      return next
    })
  }

  const addCustomGroceryItem = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const newItem: GroceryItem = {
      id: `custom-${Date.now()}`,
      name: trimmed,
      checked: false,
      custom: true,
    }
    setGroceryItemsState((prev) => {
      const next = [...prev, newItem]
      syncToCloud(async () => {
        const supabase = createClient()
        await setGrocery(supabase, userId!, next)
      })
      return next
    })
  }

  const removeGroceryItem = (id: string) => {
    setGroceryItemsState((prev) => {
      const next = prev.filter((g) => g.id !== id)
      syncToCloud(async () => {
        const supabase = createClient()
        await setGrocery(supabase, userId!, next)
      })
      return next
    })
  }

  const addDeadline = (deadline: Omit<DeadlineItem, 'id' | 'completed'>) => {
    const newItem: DeadlineItem = {
      ...deadline,
      id: `dl-${Date.now()}`,
      completed: false,
    }
    setDeadlinesState((prev) => {
      const next = [...prev, newItem]
      syncToCloud(async () => {
        const supabase = createClient()
        await setDeadlinesCloud(supabase, userId!, next)
      })
      return next
    })
  }

  const toggleDeadlineCompleted = (id: string) => {
    setDeadlinesState((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, completed: !d.completed } : d))
      syncToCloud(async () => {
        const supabase = createClient()
        await setDeadlinesCloud(supabase, userId!, next)
      })
      return next
    })
  }

  const deleteDeadline = (id: string) => {
    setDeadlinesState((prev) => {
      const next = prev.filter((d) => d.id !== id)
      syncToCloud(async () => {
        const supabase = createClient()
        await setDeadlinesCloud(supabase, userId!, next)
      })
      return next
    })
  }

  const resetToDemo = () => {
    setClassesState(defaultClasses)
    setAlarmsState(defaultAlarms)
    setProfileState(defaultProfile)
    setMealPlanState(defaultMealPlan)
    setDeadlinesState(defaultDeadlines)
    setGroceryItemsState(syncGroceryFromMealPlan(defaultMealPlan))
    localStorage.clear()
    if (userId) {
      const supabase = createClient()
      seedNewUser(supabase, userId).catch((e) => console.warn('Seed notice:', e))
    }
  }

  const setDeadlines: React.Dispatch<React.SetStateAction<DeadlineItem[]>> = (value) => {
    setDeadlinesState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value
      syncToCloud(async () => {
        const supabase = createClient()
        await setDeadlinesCloud(supabase, userId!, next)
      })
      return next
    })
  }

  const setProfile: React.Dispatch<React.SetStateAction<UserProfile>> = (value) => {
    setProfileState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value
      syncToCloud(async () => {
        const supabase = createClient()
        await upsertUserProfile(supabase, userId!, {
          name: next.name,
          school: next.school,
          dorm: next.dorm,
          year: next.year,
          initials: next.initials,
          is_dorm_student: next.dorm === 'Dorm Room' || next.dorm.toLowerCase().includes('dorm'),
          onboarding_completed: true,
          country: next.country,
          timezone: next.timezone,
          appliances: next.appliances,
          dietary_preference: next.dietary_preference,
          dietary_note: next.dietary_note,
        })
      })
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
