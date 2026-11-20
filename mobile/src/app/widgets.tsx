import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { GraduationCap, Image as ImageIcon, Info } from 'lucide-react-native'
import { ScrollView, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { rise } from '@/design/motion'
import { radius, useTheme } from '@/design/theme'
import { DAYS, type ClassEntry } from '@/lib/repo'
import { classesOn, dayOf, formatTime, minutesOf, nextClass, splitDuration } from '@/lib/time'
import { useApp } from '@/state/app'
import { Button, NavHeader, Segmented, T } from '@/ui'
import { useNow } from '@/ui/blocks'
import { useState } from 'react'

/** Home & Lock Screen glanceables, previewed live with the user's data. */
export default function Widgets() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<'home' | 'lock'>('home')
  return (
    <View style={{ flex: 1, backgroundColor: c.grouped }}>
      <NavHeader title="Home & Lock Screen" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: insets.bottom + 32 }}>
        <Animated.View entering={rise(0)} style={{ gap: 4 }}>
          <T v="title1">{tab === 'home' ? 'Your schedule.\nRight on your Home Screen.' : 'Your next class.\nLive on your Lock Screen.'}</T>
        </Animated.View>
        <Segmented value={tab} onChange={setTab} options={[{ value: 'home', label: 'Home Screen' }, { value: 'lock', label: 'Lock Screen' }]} />
        <Animated.View key={tab} entering={rise(1)}>{tab === 'home' ? <HomePreview /> : <LockPreview />}</Animated.View>
        <Button title="Make a schedule wallpaper" icon={ImageIcon} onPress={() => router.push('/wallpaper')} />
        <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: c.card }}>
          <Info size={18} color={c.ink2} />
          <T v="footnote" color={c.ink2} style={{ flex: 1 }}>
            Live widgets and Lock Screen activities ship with the installed Dormosaur app (not Expo Go). Until then, save a schedule wallpaper and set it from Photos.
          </T>
        </View>
      </ScrollView>
    </View>
  )
}

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ borderRadius: 44, padding: 8, backgroundColor: '#0B0B0C', alignSelf: 'center', width: '100%', maxWidth: 360 }}>
      <LinearGradient colors={['#1F3B2D', '#0B1A12', '#132A1F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 36, padding: 16, gap: 12, overflow: 'hidden', minHeight: 520 }}>
        <View style={{ position: 'absolute', width: 400, height: 400, borderRadius: 200, borderWidth: 40, borderColor: 'rgba(125,240,181,0.06)', top: 120, left: -120 }} />
        {children}
      </LinearGradient>
    </View>
  )
}

function Widget({ children, wide, tint }: { children: React.ReactNode; wide?: boolean; tint?: string }) {
  return <View style={{ flex: wide ? undefined : 1, borderRadius: 22, padding: 14, backgroundColor: tint ?? 'rgba(255,255,255,0.94)', minHeight: 140, gap: 4 }}>{children}</View>
}

function HomePreview() {
  const { subject } = useTheme()
  const { classes } = useApp()
  const now = useNow()
  const next = nextClass(classes, now)
  const today = dayOf(now)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const freeRest = !classesOn(classes, today).some(e => minutesOf(e.end) > nowMin)
  const tomorrowDay = DAYS[(DAYS.indexOf(today) + 1) % 7]
  const tomorrow = classesOn(classes, tomorrowDay)
  const counts = DAYS.map(d => classesOn(classes, d).length)
  const max = Math.max(1, ...counts)
  const tone = next ? subject(next.entry.color) : subject(2)

  return (
    <Phone>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
        <Widget>
          <T v="subhead" color="#111" style={{ fontWeight: '700' }}>Up next</T>
          <T v="title3" color={tone.bar} numberOfLines={1} style={{ marginTop: 6 }}>{next?.entry.code || next?.entry.subject || '—'}</T>
          <T v="caption" color="#555" numberOfLines={1}>{next?.entry.subject ?? 'No classes'}</T>
          <View style={{ flex: 1 }} />
          {next && <T v="caption" color="#555">{dayOf(next.startsAt)} · {formatTime(next.entry.start)}</T>}
        </Widget>
        <Widget tint="rgba(225,246,234,0.96)">
          <T v="subhead" color="#111" style={{ fontWeight: '700' }}>{freeRest ? 'Free now' : 'Today'}</T>
          <T v="title3" color="#16A36A" style={{ marginTop: 6 }}>{freeRest ? 'Rest of\nthe day' : `${classesOn(classes, today).filter(e => minutesOf(e.end) > nowMin).length} left`}</T>
          <View style={{ flex: 1 }} />
          <T v="caption" color="#555">{freeRest ? 'No more classes' : 'Keep going'}</T>
        </Widget>
      </View>
      <Widget wide>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <T v="subhead" color="#111" style={{ fontWeight: '700' }}>Tomorrow</T>
          <T v="caption" color="#666">{tomorrowDay} · {tomorrow.length} classes</T>
        </View>
        {tomorrow.slice(0, 2).map(e => <MiniRow key={e.id} e={e} />)}
        {!tomorrow.length && <T v="footnote" color="#666">Free day 🎉</T>}
      </Widget>
      <Widget wide>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <T v="subhead" color="#111" style={{ fontWeight: '700' }}>This week</T>
          <T v="caption" color="#666">{counts.reduce((a, b) => a + b, 0)} classes</T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 64, marginTop: 8 }}>
          {DAYS.map((d, i) => (
            <View key={d} style={{ flex: 1, alignItems: 'center', gap: 4, justifyContent: 'flex-end', height: '100%' }}>
              <View style={{ width: '100%', height: Math.max(4, (counts[i] / max) * 44), borderRadius: 6, backgroundColor: d === today ? '#16A36A' : 'rgba(22,163,106,0.25)' }} />
              <T v="caption" color={d === today ? '#16A36A' : '#666'} style={{ fontWeight: '700', fontSize: 10 }}>{d[0]}</T>
            </View>
          ))}
        </View>
      </Widget>
    </Phone>
  )
}

function MiniRow({ e }: { e: ClassEntry }) {
  const { subject } = useTheme()
  const tone = subject(e.color)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 10, backgroundColor: tone.bg, marginTop: 4 }}>
      <T v="caption" color="#444" style={{ width: 54 }}>{formatTime(e.start)}</T>
      <T v="footnote" color={tone.bar} style={{ flex: 1, fontWeight: '800' }} numberOfLines={1}>{e.code || e.subject}</T>
      <T v="caption" color="#666" numberOfLines={1}>{e.room}</T>
    </View>
  )
}

function LockPreview() {
  const { classes } = useApp()
  const now = useNow(1000 * 30)
  const next = nextClass(classes, now)
  const { days, hours, minutes } = next ? splitDuration((next.live ? next.endsAt : next.startsAt).getTime() - now.getTime()) : { days: 0, hours: 0, minutes: 0 }
  const h = now.getHours() % 12 || 12
  return (
    <Phone>
      <View style={{ alignItems: 'center', marginTop: 20 }}>
        <T v="subhead" color="rgba(255,255,255,0.8)" style={{ fontWeight: '600' }}>{now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</T>
        <T color="rgba(220,255,236,0.92)" style={{ fontSize: 92, lineHeight: 100, fontWeight: '200', letterSpacing: -4, fontVariant: ['tabular-nums'] }}>{h}:{String(now.getMinutes()).padStart(2, '0')}</T>
      </View>
      <View style={{ flex: 1 }} />
      {next ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22, backgroundColor: 'rgba(30,60,45,0.75)', borderWidth: 1, borderColor: 'rgba(125,240,181,0.2)' }}>
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(125,240,181,0.18)', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={20} color="#7DF0B5" />
          </View>
          <View style={{ flex: 1 }}>
            <T v="caption" color="rgba(255,255,255,0.7)">{next.live ? 'Now' : 'Up next'}</T>
            <T v="headline" color="#7DF0B5" numberOfLines={1}>{next.entry.code || next.entry.subject}</T>
            <T v="caption" color="rgba(255,255,255,0.7)" numberOfLines={1}>{next.entry.subject}</T>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <T v="headline" color="#7DF0B5">{days ? `${days}d ${hours}h` : `${hours} hr, ${minutes} min`}</T>
            <T v="caption" color="rgba(255,255,255,0.6)">{next.live ? 'left' : 'to go'}</T>
          </View>
        </View>
      ) : <T v="subhead" color="rgba(255,255,255,0.7)" center>No upcoming classes</T>}
      <View style={{ height: 30 }} />
    </Phone>
  )
}
