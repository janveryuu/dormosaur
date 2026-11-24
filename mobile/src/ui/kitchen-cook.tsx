import AsyncStorage from '@react-native-async-storage/async-storage'
import { useKeepAwake } from 'expo-keep-awake'
import { Check, ChevronLeft, Timer, X } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, AppState, Modal, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { radius, useTheme } from '@/design/theme'
import { updateKitchenNotification } from '@/lib/notifications'
import { formatRecipeTime, type Recipe, type RecipeStep } from '@/lib/recipes'
import { Button, IconButton, Press, T, haptic } from '@/ui'

export function useIngredientChecklist(storageKey: string) {
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [ready, setReady] = useState(false)
  const current = useRef(new Set<number>())
  const queue = useRef(Promise.resolve())

  useEffect(() => {
    let live = true
    const load = async () => {
      let next = new Set<number>()
      try {
        const value = await AsyncStorage.getItem(storageKey)
        if (value) {
          const list: unknown = JSON.parse(value)
          if (Array.isArray(list)) next = new Set(list.filter(item => Number.isInteger(item) && item >= 0))
        }
      } catch { /* An unreadable local checklist starts empty. */ }
      if (live) {
        current.current = next
        setChecked(next)
        setReady(true)
      }
    }
    void load()
    return () => { live = false }
  }, [storageKey])

  function toggle(index: number) {
    const next = new Set(current.current)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    current.current = next
    setChecked(next)
    queue.current = queue.current
      .then(() => AsyncStorage.setItem(storageKey, JSON.stringify([...next])))
      .catch(() => {})
  }

  return { checked, toggle, ready }
}

type TimerState = { endsAt: number; seconds: number }
type Timers = Record<number, TimerState>
const secondsLeft = (timer: TimerState, now: number) => timer.endsAt ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000)) : timer.seconds

export function useKitchenTimers(storageKey: string, recipeTitle: string) {
  const [timers, setTimers] = useState<Timers>({})
  const [now, setNow] = useState(Date.now)
  const [ready, setReady] = useState(false)
  const current = useRef<Timers>({})
  const queue = useRef(Promise.resolve())
  const reported = useRef(new Set<number>())
  const running = Object.values(timers).some(timer => timer.endsAt > now)

  useEffect(() => {
    let live = true
    const load = async () => {
      let next: Timers = {}
      try {
        const value = await AsyncStorage.getItem(storageKey)
        if (value) {
          const saved = JSON.parse(value) as Timers | null
          next = Object.fromEntries(Object.entries(saved ?? {}).filter(([index, timer]) =>
            /^\d+$/.test(index) && timer && Number.isFinite(timer.endsAt) && Number.isFinite(timer.seconds) && timer.endsAt >= 0 && timer.seconds >= 0))
        }
      } catch { /* An unreadable local timer starts empty. */ }
      if (live) {
        const time = Date.now()
        for (const [index, timer] of Object.entries(next)) {
          if (timer.endsAt && timer.endsAt <= time) reported.current.add(Number(index))
        }
        current.current = next
        setTimers(next)
        setNow(time)
        setReady(true)
      }
    }
    void load()
    return () => { live = false }
  }, [storageKey])

  useEffect(() => {
    if (!running) return
    const tick = () => setNow(Date.now())
    const interval = setInterval(tick, 250)
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') tick() })
    return () => { clearInterval(interval); subscription.remove() }
  }, [running])

  useEffect(() => {
    const finished = Object.entries(timers).filter(([, timer]) => timer.endsAt && secondsLeft(timer, now) === 0)
    for (const [index] of finished) {
      const step = Number(index)
      if (reported.current.has(step)) continue
      reported.current.add(step)
      haptic.success()
      AccessibilityInfo.announceForAccessibility?.(`Step ${step + 1} timer finished`)
    }
  }, [now, timers])

  function save(index: number, timer: TimerState | null, time: number) {
    const next = { ...current.current }
    if (timer) next[index] = timer
    else delete next[index]
    current.current = next
    setTimers(next)
    setNow(time)
    queue.current = queue.current.then(() => AsyncStorage.setItem(storageKey, JSON.stringify(next))).catch(() => {})
    updateKitchenNotification(`${storageKey}:${index}`, recipeTitle, index, timer?.endsAt ?? 0)
  }

  function start(index: number, minutes: number) {
    const time = Date.now()
    const existing = current.current[index]
    const seconds = existing ? secondsLeft(existing, time) || minutes * 60 : minutes * 60
    reported.current.delete(index)
    save(index, { endsAt: time + seconds * 1000, seconds }, time)
  }

  function pause(index: number) {
    const time = Date.now()
    const existing = current.current[index]
    if (existing) save(index, { endsAt: 0, seconds: secondsLeft(existing, time) }, time)
  }

  function reset(index: number) {
    reported.current.delete(index)
    save(index, null, Date.now())
  }

  function state(index: number) {
    const timer = timers[index]
    if (!timer) return
    const seconds = secondsLeft(timer, now)
    return { seconds, running: Boolean(timer.endsAt && seconds > 0) }
  }

  return { start, pause, reset, state, ready }
}

type KitchenTimers = ReturnType<typeof useKitchenTimers>
export const phaseText = { prep: 'Prep', cook: 'Cook', rest: 'Rest' }

function displayCountdown(seconds: number) {
  const min = Math.floor(seconds / 60)
  const hours = Math.floor(min / 60)
  const second = String(seconds % 60).padStart(2, '0')
  return hours ? `${hours}:${String(min % 60).padStart(2, '0')}:${second}` : `${min}:${second}`
}

export function StepTimer({ timers, step, index }: { timers: KitchenTimers; step: RecipeStep; index: number }) {
  const { c } = useTheme()
  if (!step.timer) return null
  const timer = timers.state(index)
  const canPause = timer?.running
  const action = canPause ? 'Pause' : timer?.seconds ? 'Resume' : timer ? 'Restart' : `Start ${formatRecipeTime(step.minutes)} timer`
  return (
    <View style={{ alignItems: 'flex-start', gap: 7 }}>
      {timer && <T v="title3" color={c.green} style={{ fontVariant: ['tabular-nums'] }}>
        {timer.seconds ? displayCountdown(timer.seconds) : 'Time’s up'}
      </T>}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Button title={action} icon={Timer} kind="secondary" size="sm" disabled={!timers.ready} onPress={() => canPause ? timers.pause(index) : timers.start(index, step.minutes)} />
        {timer && <Press onPress={() => timers.reset(index)} style={{ justifyContent: 'center', minHeight: 44, paddingHorizontal: 7 }}><T v="footnote" color={c.ink2}>Reset</T></Press>}
      </View>
    </View>
  )
}

export function CookMode({ recipe, timers, initialStep, onClose }: { recipe: Recipe; timers: KitchenTimers; initialStep: number; onClose: () => void }) {
  useKeepAwake('dormosaur-kitchen')
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const [index, setIndex] = useState(initialStep)
  const [done, setDone] = useState(false)
  const step = recipe.steps[index]

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.grouped, paddingTop: insets.top + 10, paddingBottom: insets.bottom + 16 }}>
        <View style={{ flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <T v="footnote" color={c.ink2}>Cook mode</T>
              <T v="headline" numberOfLines={2}>{recipe.title}</T>
            </View>
            <IconButton icon={X} label="Close cook mode" onPress={onClose} />
          </View>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 14 }} aria-hidden>
            {recipe.steps.map((_, position) => <View key={position} style={{ height: 4, flex: 1, borderRadius: 4, backgroundColor: done || position <= index ? c.green : c.line }} />)}
          </View>

          <ScrollView key={done ? 'done' : index} style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 12, gap: 18 }} showsVerticalScrollIndicator={false}>
            {done ? (
              <View style={{ borderRadius: radius.xl, backgroundColor: c.greenSoft, padding: 24, gap: 12 }}>
                <Check size={28} color={c.green} />
                <T v="title2">All steps complete</T>
                <T v="callout" color={c.ink2}>Enjoy your {recipe.title}.</T>
              </View>
            ) : (
              <View style={{ borderRadius: radius.xl, backgroundColor: c.card, padding: 22, gap: 18 }}>
                <T v="overline" color={c.green} accessibilityLiveRegion="polite">STEP {index + 1} OF {recipe.steps.length} · {phaseText[step.phase]} · {formatRecipeTime(step.minutes)}</T>
                <T v="title3" style={{ lineHeight: 30 }}>{step.text}</T>
                <StepTimer timers={timers} step={step} index={index} />
              </View>
            )}
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 8, paddingTop: 10 }}>
            {!done && index > 0 && <Button icon={ChevronLeft} title="Previous" kind="secondary" onPress={() => setIndex(index - 1)} />}
            <Button style={{ flex: 1 }} title={done ? 'Back to recipe' : index < recipe.steps.length - 1 ? 'Next step' : 'Finish cooking'}
              onPress={() => {
                if (done) onClose()
                else if (index < recipe.steps.length - 1) setIndex(index + 1)
                else setDone(true)
              }} />
          </View>
        </View>
      </View>
    </Modal>
  )
}
