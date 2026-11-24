import { router } from 'expo-router'
import { Search, Smartphone } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Platform, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fade, rise } from '@/design/motion'
import { radius, type, useTheme } from '@/design/theme'
import { DAYS } from '@/lib/repo'
import { classesOn, dayOf, formatTime, minutesOf } from '@/lib/time'
import { useApp } from '@/state/app'
import { Empty, IconButton, LargeTitle, Press, Segmented, T, haptic } from '@/ui'
import { ClassRow, useNow } from '@/ui/blocks'
import { TAB_CLEARANCE } from '@/ui/tab-bar'

const HOUR = 78
const DAY_NAMES: Record<string, string> = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }

export default function Schedule() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const { classes } = useApp()
  const now = useNow(60000)
  const [view, setView] = useState<'week' | 'day'>('week')
  const [day, setDay] = useState<string>(dayOf(now))
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? classes.filter(e => [e.subject, e.code, e.room, e.instructor].some(v => v?.toLowerCase().includes(s))) : classes
  }, [classes, q])

  const meetings = classes.reduce((n, e) => n + e.days.length, 0)

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <LargeTitle title="Schedule" eyebrow={`${classes.length} courses · ${meetings} meetings`} right={<IconButton icon={Smartphone} label="Home screen widgets" onPress={() => router.push('/widgets')} />} />
      <View style={{ paddingHorizontal: 20, gap: 12, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, borderRadius: radius.pill, backgroundColor: c.fill, paddingHorizontal: 14 }}>
          <Search size={18} color={c.ink3} />
          <TextInput value={q} onChangeText={setQ} placeholder="Search classes, rooms, instructors" placeholderTextColor={c.ink3} selectionColor={c.green}
            style={[type.callout, { flex: 1, color: c.ink, height: '100%' }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]} />
        </View>
        <Segmented value={view} onChange={setView} options={[{ value: 'week', label: 'Week' }, { value: 'day', label: 'Day' }]} />
      </View>

      {!classes.length ? (
        <Empty image={require('@/assets/images/student-dormosaur.png')} title="No classes yet" body="Scan a photo of your schedule and Dormo will organize it for you." action="Scan schedule" onAction={() => router.push('/scan')} />
      ) : view === 'week' ? (
        <WeekGrid key="week" classes={filtered} today={dayOf(now)} selected={day} onPickDay={d => { haptic.select(); setDay(d); setView('day') }} nowMin={now.getHours() * 60 + now.getMinutes()} bottom={TAB_CLEARANCE + insets.bottom} />
      ) : (
        <Animated.View key="day" entering={fade(0, 220)} style={{ flex: 1 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingBottom: 12 }} style={{ flexGrow: 0 }}>
            {DAYS.map(d => {
              const on = d === day
              const n = classesOn(filtered, d).length
              return (
                <Press key={d} onPress={() => { haptic.select(); setDay(d) }} scale={0.92} accessibilityState={{ selected: on }}
                  style={{ width: 52, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center', gap: 6, backgroundColor: on ? c.green : c.card }}>
                  <T v="footnote" color={on ? c.onGreen : c.ink2} style={{ fontWeight: '700' }}>{d}</T>
                  <T v="caption" color={on ? c.onGreen : c.ink3} style={{ fontWeight: '600', fontVariant: ['tabular-nums'], opacity: n ? 1 : 0 }}>{n}</T>
                </Press>
              )
            })}
          </ScrollView>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: TAB_CLEARANCE + insets.bottom }}>
            {classesOn(filtered, day).map((e, i) => <Animated.View key={e.id} entering={rise(i)}><ClassRow entry={e} /></Animated.View>)}
            {!classesOn(filtered, day).length && <Empty image={require('@/assets/images/sleeping-dino.png')} title="Nothing here" body={`No classes on ${day}.`} />}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  )
}

function WeekGrid({ classes, today, selected, onPickDay, nowMin, bottom }: { classes: ReturnType<typeof useApp>['classes']; today: string; selected: string; onPickDay: (d: string) => void; nowMin: number; bottom: number }) {
  const { c, subject, dark } = useTheme()
  const { width } = useWindowDimensions()
  const used = DAYS.filter(d => classes.some(e => e.days.includes(d)))
  const days = DAYS.filter((d, i) => i < 5 || used.includes(d))
  const starts = classes.map(e => minutesOf(e.start))
  const ends = classes.map(e => minutesOf(e.end))
  const first = Math.min(7, Math.floor((starts.length ? Math.min(...starts) : 420) / 60))
  const last = Math.max(17, Math.ceil((ends.length ? Math.max(...ends) : 1020) / 60))
  const hours = Array.from({ length: last - first + 1 }, (_, i) => first + i)
  const top = (m: number) => ((m - first * 60) / 60) * HOUR
  const TIME_W = 38
  const colW = (Math.min(width, 700) - TIME_W - 20) / days.length
  // date numbers for this week (Mon-based)
  const base = new Date()
  const monday = new Date(base); monday.setDate(base.getDate() - ((base.getDay() + 6) % 7))
  const dateOf = (d: string) => { const x = new Date(monday); x.setDate(monday.getDate() + DAYS.indexOf(d as never)); return x.getDate() }
  const nowVisible = nowMin >= first * 60 && nowMin <= last * 60

  return (
    <Animated.View entering={fade(0, 220)} style={{ flex: 1 }}>
      {/* day header */}
      <View style={{ flexDirection: 'row', paddingLeft: TIME_W + 10, paddingRight: 10, paddingBottom: 10 }}>
        {days.map(d => {
          const on = d === today
          const picked = d === selected && !on
          const n = classes.filter(e => e.days.includes(d)).length
          return (
            <Press key={d} onPress={() => onPickDay(d)} scale={0.9} haptics={false} hitSlop={4}
              accessibilityRole="button" accessibilityLabel={`${DAY_NAMES[d] ?? d} ${dateOf(d)}, ${n ? `${n} ${n === 1 ? 'class' : 'classes'}` : 'no classes'}. Open day view`}
              style={{ width: colW, alignItems: 'center', gap: 4, paddingVertical: 4, borderRadius: 14 }}>
              <T v="caption" color={on ? c.green : c.ink3} style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 10.5 }}>{d}</T>
              <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.green : picked ? c.greenSoft : 'transparent', borderWidth: picked ? 1.5 : 0, borderColor: c.green }}>
                <T v="subhead" color={on ? c.onGreen : c.ink} style={{ fontWeight: '700', fontVariant: ['tabular-nums'] }}>{dateOf(d)}</T>
              </View>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: n ? (on ? c.green : c.ink3) : 'transparent' }} />
            </Press>
          )
        })}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: bottom, paddingRight: 10, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', height: hours.length * HOUR }}>
          {/* hour labels */}
          <View style={{ width: TIME_W + 10 }}>
            {hours.map(h => (
              <T key={h} v="caption" color={c.ink3} style={{ position: 'absolute', top: top(h * 60) - 7, right: 8, fontSize: 10, fontVariant: ['tabular-nums'] }}>
                {h % 12 || 12}{h < 12 ? 'a' : 'p'}
              </T>
            ))}
          </View>

          <View style={{ flexDirection: 'row' }}>
            {/* hour lines */}
            {hours.map(h => <View key={h} style={{ position: 'absolute', left: 0, right: 0, top: top(h * 60), height: StyleSheet.hairlineWidth, backgroundColor: c.line }} />)}

            {days.map(d => {
              const on = d === today
              return (
                <View key={d} style={{ width: colW, backgroundColor: on ? (dark ? 'rgba(61,214,140,0.06)' : 'rgba(14,122,74,0.045)') : 'transparent', borderRadius: 12 }}>
                  {classes.filter(e => e.days.includes(d)).map(e => {
                    const tone = subject(e.color)
                    const y = top(minutesOf(e.start))
                    const h = Math.max(34, top(minutesOf(e.end)) - y - 3)
                    const live = on && minutesOf(e.start) <= nowMin && nowMin < minutesOf(e.end)
                    const roomLines = h > 96 ? 3 : h > 64 ? 2 : 1
                    return (
                      <Press key={e.id} onPress={() => router.push({ pathname: '/class', params: { id: e.id } })} scale={0.94} accessibilityLabel={`${e.subject}, ${formatTime(e.start)}${e.room ? `, ${e.room}` : ''}`}
                        style={{ position: 'absolute', top: y + 1.5, left: 2, right: 2, height: h, borderRadius: 10, backgroundColor: tone.bg, overflow: 'hidden',
                          borderWidth: live ? 1.5 : 0, borderColor: tone.bar, shadowColor: tone.bar, shadowOpacity: dark ? 0 : 0.16, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 1 }}>
                        <View style={{ height: 3, backgroundColor: tone.bar }} />
                        <View style={{ paddingHorizontal: 5, paddingTop: 4, gap: 2, flex: 1 }}>
                          <T color={tone.ink} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ fontSize: 11.5, lineHeight: 14, fontWeight: '800', letterSpacing: -0.2 }}>
                            {e.code || e.subject}
                          </T>
                          {h > 46 && e.room ? (
                            <T color={tone.ink} numberOfLines={roomLines} style={{ fontSize: 9.5, lineHeight: 12, opacity: 0.85 }}>{e.room}</T>
                          ) : null}
                          {h > 80 ? <T color={tone.ink} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontSize: 9, lineHeight: 11, opacity: 0.6, marginTop: 'auto', marginBottom: 4, fontWeight: '600' }}>{formatTime(e.start).replace(' ', '')}</T> : null}
                        </View>
                      </Press>
                    )
                  })}
                </View>
              )
            })}

            {/* now line across the whole week */}
            {nowVisible && (
              <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: top(nowMin) - 1, height: 2, backgroundColor: c.danger, opacity: 0.85 }} />
            )}
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  )
}
