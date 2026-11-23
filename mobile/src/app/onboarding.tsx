import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import {
  BellRing, Camera, Check, ChevronDown, ClipboardType, FileUp, PencilLine, Plus, School as SchoolIcon, Search, X, type LucideIcon,
} from 'lucide-react-native'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Pressable, TextInput, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { fade, layout } from '@/design/motion'
import { radius, useTheme } from '@/design/theme'
import { ensurePermission } from '@/lib/notifications'
import { DAYS, type Alarm } from '@/lib/repo'
import { searchSchools, type School } from '@/lib/schools'
import { classesOn, dayOf, formatTime, nextClass } from '@/lib/time'
import { useApp } from '@/state/app'
import { Button, Field, Press, T, haptic } from '@/ui'
import { ClassRow } from '@/ui/blocks'
import { Dormo } from '@/ui/dormo'
import { OnboardingFrame } from '@/ui/onboarding-frame'

const TOTAL = 6
const YEARS = ['1st year', '2nd year', '3rd year', '4th year', '5th+']
const LEADS: Alarm['lead'][] = [15, 30, 60]
const DRAFT_KEY = 'dormosaur.onboarding.draft'
const DAY_NAMES: Record<string, string> = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }

type Draft = { step: number; name: string; school: string; year: string; dorm: boolean; lead: Alarm['lead']; reminders: boolean }

/** First-run setup: name, school, schedule, review, reminders, done. Saves a draft at every step. */
export default function Onboarding() {
  const { profile, classes, alarms, saveProfile, saveAlarms } = useApp()
  const [d, setD] = useState<Draft>({
    step: 1, name: profile?.name ?? '', school: profile?.school ?? '', year: profile?.year ?? '',
    dorm: profile?.is_dorm_student ?? true, lead: 15, reminders: true,
  })
  const [busy, setBusy] = useState(false)
  const loaded = useRef(false)
  const set = (patch: Partial<Draft>) => setD(p => ({ ...p, ...patch }))

  // Restore the draft once, then keep it saved on every change.
  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY).then(v => { if (v) setD(p => ({ ...p, ...JSON.parse(v) })) }).catch(() => {}).finally(() => { loaded.current = true })
  }, [])
  useEffect(() => { if (loaded.current) AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(d)).catch(() => {}) }, [d])

  // Coming back from the scanner or class editor with new classes: move on to review.
  const seen = useRef(classes.length)
  useEffect(() => {
    if (d.step === 3 && classes.length > seen.current) set({ step: 4 })
    seen.current = classes.length
  }, [classes.length, d.step])

  const go = (step: number) => { haptic.select(); set({ step }) }
  const back = d.step > 1 && d.step < TOTAL ? () => set({ step: d.step - 1 }) : undefined

  async function saveAbout() {
    setBusy(true)
    try {
      const name = d.name.trim()
      const initials = name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
      await saveProfile({ name, school: d.school.trim(), year: d.year, is_dorm_student: d.dorm, initials })
      go(3)
    } finally { setBusy(false) }
  }

  async function reminders(on: boolean) {
    setBusy(true)
    try {
      const granted = on ? await ensurePermission() : false
      if (on && !granted) Alert.alert('Notifications are off', 'You can turn reminders on later in Settings > Class alarms.')
      if (alarms.length) await saveAlarms(alarms.map(a => ({ ...a, lead: d.lead, enabled: on && granted })))
      set({ reminders: on && granted, step: TOTAL })
      haptic.select()
    } finally { setBusy(false) }
  }

  async function finish() {
    setBusy(true)
    try {
      await saveProfile({ onboarding_completed: true })
      await AsyncStorage.removeItem(DRAFT_KEY).catch(() => {})
      haptic.success()
    } finally { setBusy(false) }
  }

  switch (d.step) {
    case 1: return <NameStep name={d.name} onName={name => set({ name })} onNext={() => go(2)} />
    case 2: return <SchoolStep d={d} set={set} onBack={back} busy={busy} onNext={saveAbout} />
    case 3: return <MethodStep hasClasses={classes.length > 0} onBack={back} onReview={() => go(4)} onSkip={() => go(TOTAL)} />
    case 4: return <ReviewStep onBack={back} onNext={() => go(5)} />
    case 5: return <ReminderStep lead={d.lead} onLead={lead => set({ lead })} busy={busy} onBack={back} onAnswer={reminders} />
    default: return <DoneStep lead={d.reminders ? d.lead : null} busy={busy} onFinish={finish} />
  }
}

// ─── 1. Name ─────────────────────────────────────────────────────────────────

function NameStep({ name, onName, onNext }: { name: string; onName: (v: string) => void; onNext: () => void }) {
  const ok = name.trim().length > 0
  return (
    <OnboardingFrame step={1} total={TOTAL} hero={<Dormo mood="hi" size={150} lines={['Hi there!', "I'm Dormo."]} />}
      title="Hi! What should we call you?" sub="Dormo likes to say hello properly."
      footer={<Button title="Continue" disabled={!ok} onPress={onNext} />}>
      <Field value={name} onChangeText={onName} placeholder="Your first name" autoFocus autoComplete="given-name" textContentType="givenName"
        autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => ok && onNext()} accessibilityLabel="Your first name" />
    </OnboardingFrame>
  )
}

// ─── 2. School, year, dorm ───────────────────────────────────────────────────

function SchoolStep({ d, set, onBack, onNext, busy }: { d: Draft; set: (p: Partial<Draft>) => void; onBack?: () => void; onNext: () => void; busy: boolean }) {
  const { c } = useTheme()
  const [query, setQuery] = useState(d.school)
  const [picking, setPicking] = useState(!d.school)
  const results = useMemo(() => searchSchools(query), [query])
  const exact = results.some(s => s.name.toLowerCase() === query.trim().toLowerCase())
  const pick = (name: string) => { haptic.select(); set({ school: name }); setQuery(name); setPicking(false) }

  return (
    <OnboardingFrame step={2} total={TOTAL} onBack={onBack} title="Where do you study?" sub="So your schedule and Kitchen feel like home."
      footer={<Button title="Continue" disabled={!d.school.trim()} loading={busy} onPress={onNext} />}>
      <View style={{ gap: 22 }}>
        {picking ? (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: c.fill }}>
              <Search size={19} color={c.ink3} />
              <TextInput value={query} onChangeText={setQuery} placeholder="Search your school" placeholderTextColor={c.ink3} autoFocus
                autoCorrect={false} returnKeyType="search" accessibilityLabel="Search your school"
                style={{ flex: 1, fontSize: 17, color: c.ink }} />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
                  <X size={18} color={c.ink3} />
                </Pressable>
              ) : null}
            </View>
            {results.map((s, i) => <SchoolRow key={s.name} s={s} i={i} onPress={() => pick(s.name)} />)}
            {query.trim().length > 1 && !exact && (
              <Press onPress={() => pick(query.trim())} scale={0.98} accessibilityLabel={`Use ${query.trim()} as my school`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={20} color={c.green} />
                </View>
                <T v="callout" color={c.green} style={{ flex: 1, fontWeight: '600' }} numberOfLines={2}>Use “{query.trim()}”</T>
              </Press>
            )}
            {!query && <T v="footnote" color={c.ink3} center>Type a name or city. Not listed? You can use any name.</T>}
          </View>
        ) : (
          <Press onPress={() => setPicking(true)} scale={0.98} accessibilityLabel={`School: ${d.school}. Tap to change`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: c.greenSoft, borderWidth: 1.5, borderColor: c.green }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center' }}>
              <Check size={20} color={c.onGreen} strokeWidth={3} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="headline" numberOfLines={2}>{d.school}</T>
              <T v="footnote" color={c.green} style={{ fontWeight: '600' }}>Change</T>
            </View>
          </Press>
        )}

        <View style={{ gap: 10 }}>
          <T v="footnote" color={c.ink3} style={{ fontWeight: '600', marginLeft: 4 }}>Year level</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {YEARS.map(y => {
              const on = d.year === y
              return (
                <Press key={y} onPress={() => set({ year: on ? '' : y })} scale={0.94} accessibilityState={{ selected: on }} accessibilityLabel={y}
                  style={{ paddingHorizontal: 16, height: 40, borderRadius: radius.pill, justifyContent: 'center', backgroundColor: on ? c.green : c.fill }}>
                  <T v="subhead" color={on ? c.onGreen : c.ink} style={{ fontWeight: '600' }}>{y}</T>
                </Press>
              )
            })}
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <T v="footnote" color={c.ink3} style={{ fontWeight: '600', marginLeft: 4 }}>Living in a dorm?</T>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[{ v: true, l: 'Yes, dorm life' }, { v: false, l: 'No, I commute' }].map(o => {
              const on = d.dorm === o.v
              return (
                <Press key={o.l} onPress={() => set({ dorm: o.v })} scale={0.96} accessibilityState={{ selected: on }} accessibilityLabel={o.l}
                  style={{ flex: 1, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.green : c.fill }}>
                  <T v="callout" color={on ? c.onGreen : c.ink} style={{ fontWeight: '600' }}>{o.l}</T>
                </Press>
              )
            })}
          </View>
          <T v="footnote" color={c.ink3} style={{ marginLeft: 4 }}>We tune Kitchen recipes to what you can cook.</T>
        </View>
      </View>
    </OnboardingFrame>
  )
}

function SchoolRow({ s, i, onPress }: { s: School; i: number; onPress: () => void }) {
  const { c } = useTheme()
  return (
    <Animated.View entering={fade(i * 30, 200)}>
      <Press onPress={onPress} scale={0.98} accessibilityLabel={`${s.name}, ${s.city}`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.fill, alignItems: 'center', justifyContent: 'center' }}>
          <SchoolIcon size={20} color={c.ink2} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="callout" style={{ fontWeight: '600' }} numberOfLines={2}>{s.name}</T>
          <T v="footnote" color={c.ink3}>{s.city}</T>
        </View>
      </Press>
    </Animated.View>
  )
}

// ─── 3. How to add the schedule ──────────────────────────────────────────────

function MethodStep({ hasClasses, onBack, onReview, onSkip }: { hasClasses: boolean; onBack?: () => void; onReview: () => void; onSkip: () => void }) {
  const { c } = useTheme()
  const scan = (src: string) => router.push({ pathname: '/scan', params: { src, from: 'onboarding' } })
  return (
    <OnboardingFrame step={3} total={TOTAL} onBack={onBack} title="Add your schedule" sub="Choose how you want to start."
      footer={hasClasses
        ? <Button title="Review my classes" onPress={onReview} />
        : <LinkButton title="Skip for now" onPress={onSkip} />}>
      <View style={{ gap: 12, paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Tile hero icon={Camera} title="Scan photo" sub="Fastest way in" onPress={() => scan('library')} />
          <Tile icon={ClipboardType} title="Paste text" sub="From your portal" onPress={() => scan('text')} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Tile icon={FileUp} title="Import a file" sub="PDF or image" onPress={() => scan('file')} />
          <Tile icon={PencilLine} title="Add manually" sub="Type it yourself" onPress={() => router.push('/class')} />
        </View>
        <T v="footnote" color={c.ink3} center style={{ marginTop: 6 }}>Your registration form or portal screenshot works best.</T>
      </View>
    </OnboardingFrame>
  )
}

function Tile({ icon: Icon, title, sub, onPress, hero }: { icon: LucideIcon; title: string; sub: string; onPress: () => void; hero?: boolean }) {
  const { c } = useTheme()
  const fg = hero ? c.onGreen : c.ink
  return (
    <Press onPress={onPress} scale={0.96} accessibilityLabel={`${title}. ${sub}`}
      style={{ flex: 1, minHeight: 148, padding: 18, borderRadius: radius.lg, justifyContent: 'space-between', backgroundColor: hero ? c.green : c.greenSoft }}>
      <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: hero ? 'rgba(255,255,255,0.18)' : c.card }}>
        <Icon size={22} color={hero ? c.onGreen : c.green} strokeWidth={2.2} />
      </View>
      <View style={{ gap: 2 }}>
        <T v="headline" color={fg} style={{ fontSize: 18, fontWeight: '700' }}>{title}</T>
        <T v="footnote" color={hero ? c.onGreen : c.ink2} style={{ opacity: hero ? 0.85 : 1 }}>{sub}</T>
      </View>
    </Press>
  )
}

// ─── 4. Review ───────────────────────────────────────────────────────────────

function ReviewStep({ onBack, onNext }: { onBack?: () => void; onNext: () => void }) {
  const { c } = useTheme()
  const { classes } = useApp()
  const [closed, setClosed] = useState<string[]>([])
  const days = DAYS.filter(day => classesOn(classes, day).length)
  const sub = classes.length
    ? `${count(classes.length, 'class', 'classes')} across ${count(days.length, 'day', 'days')}. Tap a class to fix anything.`
    : 'No classes yet. Add one to continue.'
  const toggle = (day: string) => { haptic.select(); setClosed(x => x.includes(day) ? x.filter(y => y !== day) : [...x, day]) }

  return (
    <OnboardingFrame step={4} total={TOTAL} onBack={onBack} title="Review schedule" sub={sub}
      action={<Press onPress={() => router.push('/class')} accessibilityLabel="Add a class" hitSlop={8} style={{ padding: 8 }}><Plus size={24} color={c.green} /></Press>}
      footer={
        <View style={{ gap: 10 }}>
          {days.length > 0 && days.length < 5 && (
            <T v="footnote" color={c.ink3} center>Found classes on {listOf(days.map(x => DAY_NAMES[x]))} only.</T>
          )}
          <Button title="Looks good" icon={Check} disabled={!classes.length} onPress={onNext} />
        </View>
      }>
      <View style={{ gap: 14 }}>
        {days.map(day => {
          const list = classesOn(classes, day)
          const open = !closed.includes(day)
          return (
            <Animated.View key={day} layout={layout} style={{ gap: 8 }}>
              <Pressable onPress={() => toggle(day)} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`${DAY_NAMES[day]}, ${list.length}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 4 }}>
                <ChevronDown size={18} color={c.ink3} style={{ transform: [{ rotate: open ? '0deg' : '-90deg' }] }} />
                <T v="headline" color={c.ink2} style={{ flex: 1 }}>{DAY_NAMES[day]}</T>
                <View style={{ minWidth: 26, height: 24, paddingHorizontal: 8, borderRadius: 12, backgroundColor: c.fill, alignItems: 'center', justifyContent: 'center' }}>
                  <T v="caption" color={c.ink2} style={{ fontWeight: '700' }}>{list.length}</T>
                </View>
              </Pressable>
              {open && list.map(e => <Animated.View key={e.id} entering={fade(0, 180)}><ClassRow entry={e} /></Animated.View>)}
            </Animated.View>
          )
        })}
        {!classes.length && (
          <Press onPress={() => router.push('/class')} scale={0.98} accessibilityLabel="Add class"
            style={{ height: 96, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.fillStrong, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
            <Plus size={20} color={c.ink2} />
            <T v="headline" color={c.ink2}>Add class</T>
          </Press>
        )}
      </View>
    </OnboardingFrame>
  )
}

// ─── 5. Reminders ────────────────────────────────────────────────────────────

function ReminderStep({ lead, onLead, onAnswer, onBack, busy }: { lead: Alarm['lead']; onLead: (l: Alarm['lead']) => void; onAnswer: (on: boolean) => void; onBack?: () => void; busy: boolean }) {
  const { c } = useTheme()
  return (
    <OnboardingFrame step={5} total={TOTAL} onBack={onBack} hero={<Dormo mood="thinking" size={140} hops={false} />}
      title="Never miss a class" sub="Dormo nudges you before each class starts, even offline."
      footer={
        <View style={{ gap: 2 }}>
          <Button title="Turn on reminders" icon={BellRing} loading={busy} onPress={() => onAnswer(true)} />
          <LinkButton title="Not now" onPress={() => onAnswer(false)} disabled={busy} />
        </View>
      }>
      <View style={{ gap: 10 }}>
        <T v="footnote" color={c.ink3} center style={{ fontWeight: '600' }}>Remind me</T>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {LEADS.map(l => {
            const on = lead === l
            return (
              <Press key={l} onPress={() => { haptic.select(); onLead(l) }} scale={0.95} accessibilityState={{ selected: on }} accessibilityLabel={`${l} minutes before`}
                style={{ flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', backgroundColor: on ? c.green : c.fill }}>
                <T v="title3" color={on ? c.onGreen : c.ink}>{l}</T>
                <T v="caption" color={on ? c.onGreen : c.ink2}>min before</T>
              </Press>
            )
          })}
        </View>
      </View>
    </OnboardingFrame>
  )
}

// ─── 6. Done ─────────────────────────────────────────────────────────────────

function DoneStep({ lead, onFinish, busy }: { lead: Alarm['lead'] | null; onFinish: () => void; busy: boolean }) {
  const { classes, profile } = useApp()
  const days = DAYS.filter(day => classesOn(classes, day).length).length
  const next = nextClass(classes)
  const parts = classes.length
    ? [
        `${count(classes.length, 'class', 'classes')} across ${count(days, 'day', 'days')}.`,
        next ? `Next: ${dayOf(next.startsAt)} ${formatTime(next.entry.start)}.` : '',
        lead ? `${lead}-min heads-up.` : '',
      ]
    : ['Add your classes any time with the + button.']
  const first = profile?.name?.split(/\s+/)[0]

  return (
    <OnboardingFrame step={TOTAL} total={TOTAL} centered
      hero={<Dormo mood="cheer" size={180} lines={['We did it!', 'See you in class!']} />}
      title={first ? `You're all set, ${first}!` : "You're all set!"} sub={parts.filter(Boolean).join(' ')}
      footer={<Button title="Go to Today" loading={busy} onPress={onFinish} />} />
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function LinkButton({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  const { c } = useTheme()
  return (
    <Pressable onPress={() => { haptic.select(); onPress() }} disabled={disabled} accessibilityRole="button" hitSlop={6}
      style={{ alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 20, opacity: disabled ? 0.4 : 1 }}>
      <T v="callout" color={c.ink2} style={{ fontWeight: '600' }}>{title}</T>
    </Pressable>
  )
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const listOf = (xs: string[]) => xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`
