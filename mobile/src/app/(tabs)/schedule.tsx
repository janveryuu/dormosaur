import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { AlarmClock, ChevronRight, GraduationCap, NotebookText, Palette, ScanLine } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { rise } from '@/design/motion'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ClassRow } from '@/components/class-row'
import { TAB_CLEARANCE } from '@/components/tab-bar'
import { Empty, IconButton, Press, ScreenHeader, Stat, T } from '@/components/ui'
import { WeekStrip } from '@/components/week-strip'
import { color, font, radius, shadow } from '@/design/tokens'
import { classesOn, dayOf, minutesOf, nextClass } from '@/lib/time'
import { useApp } from '@/state/app'

const THEMES = [['#F6E7B8', '#7FB08A', '#2E6B47'], ['#F8C9C0', '#C98BB0', '#6E4A8C'], ['#1B2A4A', '#2E4470', '#F7D560']]

export default function Schedule() {
  const insets = useSafeAreaInsets()
  const { classes, deadlines, alarms } = useApp()
  const [day, setDay] = useState<string>(dayOf())
  const list = useMemo(() => classesOn(classes, day), [classes, day])
  const live = nextClass(classes)
  const hours = list.reduce((sum, c) => sum + (minutesOf(c.end) - minutesOf(c.start)), 0) / 60

  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.canvas }} contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 16, paddingBottom: TAB_CLEARANCE, gap: 18 }} showsVerticalScrollIndicator={false}>
      <Animated.View entering={rise(0)} style={{ paddingHorizontal: 4 }}>
        <ScreenHeader eyebrow="Schedule" title="Your week at a glance." subtitle="Classes, deadlines, and alarms in one place."
          right={<IconButton icon={ScanLine} label="Scan schedule" tone="soft" onPress={() => router.push('/import')} />} />
      </Animated.View>

      <Animated.View entering={rise(1)} style={{ flexDirection: 'row', gap: 8 }}>
        <Stat icon={GraduationCap} value={classes.length} label="classes" />
        <Stat icon={NotebookText} value={deadlines.filter(d => !d.completed).length} label="deadlines" onPress={() => router.push('/tasks')} bg={color.fill} tint={color.ink} />
        <Stat icon={AlarmClock} value={alarms.filter(a => a.enabled).length} label="alarms" onPress={() => router.push('/alarms')} />
      </Animated.View>

      <Animated.View entering={rise(2)}>
        <Press onPress={() => router.push('/wallpaper')} accessibilityRole="button" accessibilityLabel="Schedule themes"
          style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: '#C5DCCB', overflow: 'hidden' }, shadow]}>
          <LinearGradient colors={['#E4F0E6', '#F2F5EA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', inset: 0 }} />
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: color.green, alignItems: 'center', justifyContent: 'center' }}>
            <Palette size={22} color={color.white} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <T v="heading" style={{ fontSize: 15 }}>Schedule themes</T>
            <T v="meta" style={{ fontSize: 12 }}>Make your timetable a wallpaper.</T>
          </View>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {THEMES.map((t, i) => (
              <LinearGradient key={i} colors={t as [string, string, string]} style={{ width: 24, height: 40, borderRadius: 6, borderWidth: 1.5, borderColor: color.white }} />
            ))}
          </View>
          <ChevronRight size={16} color={color.inkSoft} />
        </Press>
      </Animated.View>

      <View style={[{ backgroundColor: color.card, borderRadius: radius.lg, borderWidth: 1, borderColor: color.line, padding: 8 }, shadow]}>
        <WeekStrip classes={classes} value={day} onChange={setDay} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 4 }}>
        <T style={{ fontFamily: font.serif, fontSize: 22, letterSpacing: -0.6, color: color.ink }}>{day === dayOf() ? 'Today' : fullDay(day)}</T>
        {list.length > 0 && <T v="meta">{list.length} {list.length === 1 ? 'class' : 'classes'} · {hours.toFixed(hours % 1 ? 1 : 0)} h</T>}
      </View>

      {list.length ? (
        <View style={{ gap: 10 }}>
          {list.map((c, i) => (
            <Animated.View key={c.id} entering={rise(i)}>
              <ClassRow entry={c}
                live={live?.live && live.entry.id === c.id && day === dayOf()}
                onPress={() => router.push({ pathname: '/class', params: { id: c.id } })} />
            </Animated.View>
          ))}
        </View>
      ) : classes.length ? (
        <Empty image={require('@/assets/mascots/dormosaur-comfy-time.png')} title="Free day" body="No classes on the route. Rest, catch up, or cook something good." />
      ) : (
        <Empty image={require('@/assets/images/student-dormosaur.png')} title="Add your classes" body="Snap your printed schedule and Dormo reads it for you." action={{ title: 'Scan schedule', onPress: () => router.push('/import') }} />
      )}
    </ScrollView>
  )
}

const fullDay = (d: string) => ({ Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' } as Record<string, string>)[d] ?? d
