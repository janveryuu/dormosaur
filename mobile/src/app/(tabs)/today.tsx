import { Image } from 'expo-image'
import { router } from 'expo-router'
import type { SFSymbol } from 'expo-symbols'
import { AlarmClock, CheckCircle2, LayoutGrid, ScanLine, Settings, Sparkles, Sun, type LucideIcon } from 'lucide-react-native'
import { ScrollView, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { rise } from '@/design/motion'
import { elevation, radius, useTheme } from '@/design/theme'
import type { ClassEntry } from '@/lib/repo'
import { recipes } from '@/lib/recipes'
import { classesOn, dayOf, formatTime, greeting, minutesOf, nextClass } from '@/lib/time'
import { useApp } from '@/state/app'
import { Press, Section, T } from '@/ui'
import { TaskRow, useNow } from '@/ui/blocks'
import { NextCard } from '@/ui/next-card'
import { Sym } from '@/ui/symbol'
import { TAB_CLEARANCE } from '@/ui/tab-bar'

export default function Today() {
  const { c, dark } = useTheme()
  const insets = useSafeAreaInsets()
  const { profile, classes, deadlines, mealPlan, saveDeadline } = useApp()
  const now = useNow()
  const today = dayOf(now)
  const todays = classesOn(classes, today)
  const next = nextClass(classes, now)
  const due = deadlines.filter(d => !d.completed).slice(0, 3)
  const meal = mealPlan.find(m => m.day === today)
  const recipe = meal ? recipes.find(r => r.slug === meal.recipeSlug) : recipes[now.getDate() % recipes.length]
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const left = todays.filter(t => minutesOf(t.end) > nowMin).length
  const first = profile?.name?.split(' ')[0]

  const dateLabel = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  const dayLine = !todays.length ? 'No classes today' : left === 0 ? 'Classes done for today' : `${left} ${left === 1 ? 'class' : 'classes'} left today`

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: TAB_CLEARANCE + insets.bottom, paddingHorizontal: 20, gap: 32 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Animated.View entering={rise(0)} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <T v="largeTitle" accessibilityRole="header">{greeting(now)}{first ? `,\n${first}` : ''}</T>
          <T v="subhead" color={c.ink2}>{dateLabel} · {dayLine}</T>
        </View>
        <Press onPress={() => router.push('/settings')} accessibilityLabel="Settings" scale={0.9} hitSlop={4}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: dark ? c.fill : c.card, alignItems: 'center', justifyContent: 'center', marginTop: 2, borderWidth: dark ? 0 : 0.5, borderColor: c.line }}>
          <Sym name="gearshape" fallback={Settings} size={21} color={c.ink} />
        </Press>
      </Animated.View>

      {/* Next class */}
      <Animated.View entering={rise(1)}>
        {next ? <NextCard next={next} now={now} /> : (
          <Press onPress={() => router.push('/scan')} scale={0.98} accessibilityLabel="Scan your schedule"
            style={[{ borderRadius: radius.lg, backgroundColor: c.card, padding: 20, gap: 14 }, elevation(c, 2)]}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: c.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Sym name="viewfinder" fallback={ScanLine} size={22} color={c.green} />
            </View>
            <View style={{ gap: 4 }}>
              <T v="title3">Add your schedule</T>
              <T v="subhead" color={c.ink2}>Take a photo of your class schedule and it becomes your week here.</T>
            </View>
          </Press>
        )}
      </Animated.View>

      {/* Shortcuts */}
      <Animated.View entering={rise(2)} style={{ flexDirection: 'row', gap: 10 }}>
        <Shortcut sf="viewfinder" icon={ScanLine} label="Scan" onPress={() => router.push('/scan')} />
        <Shortcut sf="alarm" icon={AlarmClock} label="Alarms" onPress={() => router.push('/alarms')} />
        <Shortcut sf="square.grid.2x2" icon={LayoutGrid} label="Widgets" onPress={() => router.push('/widgets')} />
        <Shortcut sf="sparkles" icon={Sparkles} label="Copilot" onPress={() => router.push('/copilot')} />
      </Animated.View>

      {/* Today */}
      <Animated.View entering={rise(3)}>
        <Section title="Today" action="Week" onAction={() => router.navigate('/schedule')}>
          {todays.length ? (
            <View style={{ gap: 8 }}>
              {todays.map(e => <Slot key={e.id} entry={e} nowMin={nowMin} />)}
            </View>
          ) : (
            <Quiet sf="sun.max" icon={Sun} title="Free day" body="No classes today. Rest, cook, or get ahead." />
          )}
        </Section>
      </Animated.View>

      {/* Deadlines */}
      <Animated.View entering={rise(4)}>
        <Section title="Due soon" action="All tasks" onAction={() => router.navigate('/tasks')}>
          {due.length ? (
            <View style={{ gap: 10 }}>
              {due.map(d => <TaskRow key={d.id} task={d} onToggle={() => saveDeadline({ ...d, completed: !d.completed })} />)}
            </View>
          ) : (
            <Quiet sf="checkmark.circle" icon={CheckCircle2} title="All caught up" body="Nothing due. New tasks show up here." />
          )}
        </Section>
      </Animated.View>

      {/* Meal */}
      {recipe && (
        <Animated.View entering={rise(5)}>
          <Section title={meal ? `${meal.meal} today` : 'Try today'} action="Kitchen" onAction={() => router.navigate('/kitchen')}>
            <Press onPress={() => router.push({ pathname: '/recipe/[slug]', params: { slug: recipe.slug } })} scale={0.98}
              style={[{ borderRadius: radius.lg, overflow: 'hidden', backgroundColor: c.card }, elevation(c, 1)]}>
              <Image source={recipe.image} style={{ height: 150 }} contentFit="cover" transition={250} />
              <View style={{ padding: 16, gap: 4 }}>
                <T v="headline">{recipe.title}</T>
                <T v="footnote" color={c.ink2}>{recipe.minutes} min · {recipe.appliance} · {recipe.cost}</T>
              </View>
            </Press>
          </Section>
        </Animated.View>
      )}
    </ScrollView>
  )
}

/** Quiet tile: one tint for every glyph, the label carries the meaning. */
function Shortcut({ sf, icon, label, onPress }: { sf: SFSymbol; icon: LucideIcon; label: string; onPress: () => void }) {
  const { c, dark } = useTheme()
  return (
    <Press onPress={onPress} accessibilityLabel={label} scale={0.94}
      style={[{ flex: 1, height: 80, borderRadius: radius.md, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: dark ? 1 : 0, borderColor: c.line }, elevation(c, 1)]}>
      <Sym name={sf} fallback={icon} size={22} color={c.green} />
      <T v="footnote" style={{ fontWeight: '600' }}>{label}</T>
    </Press>
  )
}

/** One class in today's list, washed in the subject's colour. */
function Slot({ entry: e, nowMin }: { entry: ClassEntry; nowMin: number }) {
  const { subject } = useTheme()
  const tone = subject(e.color)
  const past = minutesOf(e.end) <= nowMin
  const live = minutesOf(e.start) <= nowMin && !past
  return (
    <Press onPress={() => router.push({ pathname: '/class', params: { id: e.id } })} scale={0.985}
      accessibilityLabel={`${e.code || e.subject}, ${formatTime(e.start)} to ${formatTime(e.end)}${e.room ? `, ${e.room}` : ''}${live ? ', happening now' : past ? ', finished' : ''}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderRadius: radius.md, backgroundColor: tone.bg, borderWidth: live ? 1.5 : 0, borderColor: tone.bar, opacity: past ? 0.55 : 1 }}>
      <View style={{ width: 76 }}>
        <T v="subhead" color={tone.ink} numberOfLines={1} style={{ fontWeight: '700', fontVariant: ['tabular-nums'] }}>{formatTime(e.start)}</T>
        <T v="caption" color={tone.ink} numberOfLines={1} style={{ opacity: 0.7, fontVariant: ['tabular-nums'] }}>{formatTime(e.end)}</T>
      </View>
      <View style={{ flex: 1 }}>
        <T v="headline" color={tone.ink} numberOfLines={1}>{e.code || e.subject}</T>
        <T v="footnote" color={tone.ink} numberOfLines={1} style={{ opacity: 0.75 }}>{[e.code ? e.subject : '', e.room].filter(Boolean).join(' · ')}</T>
      </View>
      {live && (
        <View style={{ paddingHorizontal: 9, height: 24, borderRadius: 12, backgroundColor: tone.ink, justifyContent: 'center' }}>
          <T v="caption" color={tone.bg} style={{ fontWeight: '700' }}>Now</T>
        </View>
      )}
    </Press>
  )
}

function Quiet({ sf, icon, title, body }: { sf: SFSymbol; icon: LucideIcon; title: string; body: string }) {
  const { c, dark } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.lg, backgroundColor: c.card, borderWidth: dark ? 1 : 0, borderColor: c.line }}>
      <Sym name={sf} fallback={icon} size={22} color={c.ink3} />
      <View style={{ flex: 1, gap: 2 }}>
        <T v="headline">{title}</T>
        <T v="footnote" color={c.ink2}>{body}</T>
      </View>
    </View>
  )
}
