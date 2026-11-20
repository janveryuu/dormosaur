import { Image } from 'expo-image'
import { router } from 'expo-router'
import { BellRing, LayoutGrid, ScanLine, Sparkles, type LucideIcon } from 'lucide-react-native'
import { ScrollView, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { rise } from '@/design/motion'
import { elevation, radius, useTheme } from '@/design/theme'
import { recipes } from '@/lib/recipes'
import { classesOn, dayOf, greeting, minutesOf, nextClass } from '@/lib/time'
import { useApp } from '@/state/app'
import { Press, Section, T } from '@/ui'
import { AppIcon, ICON_TONES } from '@/ui/app-icon'
import { ClassRow, TaskRow, useNow } from '@/ui/blocks'
import { Dormo } from '@/ui/dormo'
import { NextCard } from '@/ui/next-card'
import { TAB_CLEARANCE } from '@/ui/tab-bar'

export default function Today() {
  const { c } = useTheme()
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
  const doneToday = todays.filter(t => minutesOf(t.end) <= nowMin).length

  const dateLabel = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: TAB_CLEARANCE + insets.bottom, paddingHorizontal: 20, gap: 28 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Animated.View entering={rise(0)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <T v="overline" color={c.green} style={{ textTransform: 'uppercase' }}>{dateLabel}</T>
          <T v="largeTitle" accessibilityRole="header">{greeting(now)}{profile?.name ? `,\n${profile.name.split(' ')[0]}` : ''}</T>
        </View>
        <Press onPress={() => router.push('/settings')} accessibilityLabel="Settings and profile" scale={0.9}
          style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: c.greenSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', marginTop: 18 }}>
          <T v="headline" color={c.greenInk} style={{ fontWeight: '800' }}>{profile?.initials || profile?.name?.[0] || 'D'}</T>
        </Press>
      </Animated.View>

      {/* Hero: next class */}
      <Animated.View entering={rise(1)} style={{ marginTop: next ? 26 : 0 }}>
        {next ? <NextCard next={next} now={now} /> : (
          <Press onPress={() => router.push('/scan')} scale={0.98} accessibilityLabel="Scan your schedule"
            style={[{ borderRadius: radius.xl, backgroundColor: c.card, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }, elevation(c, 2)]}>
            <Dormo mood="student" size={92} lines={['Snap your schedule!', 'I\u2019ll sort it for you.']} />
            <View style={{ flex: 1, gap: 6 }}>
              <T v="title3">Scan your schedule</T>
              <T v="subhead" color={c.ink2}>Snap any messy schedule. Dormo turns it into a clean week.</T>
            </View>
          </Press>
        )}
      </Animated.View>

      {/* Quick actions */}
      <Animated.View entering={rise(2)} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Quick icon={ScanLine} tone="green" label="Scan" onPress={() => router.push('/scan')} />
        <Quick icon={BellRing} tone="orange" label="Alarms" onPress={() => router.push('/alarms')} />
        <Quick icon={LayoutGrid} tone="blue" label="Widgets" onPress={() => router.push('/widgets')} />
        <Quick icon={Sparkles} tone="pink" label="Copilot" onPress={() => router.push('/copilot')} />
      </Animated.View>

      {/* Today timeline */}
      <Animated.View entering={rise(3)}>
        <Section title={todays.length ? `Today · ${doneToday}/${todays.length} done` : 'Today'} action="Week" onAction={() => router.navigate('/schedule')}>
          {todays.length ? (
            <View style={{ gap: 10 }}>
              {todays.map(e => {
                const live = minutesOf(e.start) <= nowMin && nowMin < minutesOf(e.end)
                return <ClassRow key={e.id} entry={e} live={live} past={minutesOf(e.end) <= nowMin} />
              })}
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.lg, backgroundColor: c.card }}>
              <Dormo mood="comfy" size={64} shadow={false} lines={['Rest day!', 'Maybe cook something?']} />
              <View style={{ flex: 1 }}>
                <T v="headline">Free day</T>
                <T v="footnote" color={c.ink2}>No classes today. Rest, cook, or get ahead.</T>
              </View>
            </View>
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
            <View style={{ padding: 16, borderRadius: radius.lg, backgroundColor: c.card, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Sparkles size={18} color={c.green} />
              <T v="subhead" color={c.ink2}>All caught up. Nice.</T>
            </View>
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

function Quick({ icon, tone, label, onPress }: { icon: LucideIcon; tone: keyof typeof ICON_TONES; label: string; onPress: () => void }) {
  const [from, to] = ICON_TONES[tone]
  return (
    <Press onPress={onPress} accessibilityLabel={label} scale={0.88} style={{ alignItems: 'center', gap: 8, width: 72 }}>
      <AppIcon icon={icon} from={from} to={to} size={58} />
      <T v="caption" style={{ fontWeight: '600' }}>{label}</T>
    </Press>
  )
}
