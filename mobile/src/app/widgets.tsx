import { BlurView } from 'expo-blur'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { BatteryFull, Camera, Flashlight, GraduationCap, Image as ImageIcon, Info, Share as ShareIcon, Signal, Wifi } from 'lucide-react-native'
import { useState } from 'react'
import { Platform, Share, ScrollView, View, useWindowDimensions, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fade, rise } from '@/design/motion'
import { radius, subjectOn, useTheme } from '@/design/theme'
import { DAYS, type ClassEntry } from '@/lib/repo'
import { classesOn, dayOf, formatTime, minutesOf, nextClass, splitDuration } from '@/lib/time'
import { WALLPAPER_THEMES, type WallpaperTheme } from '@/lib/wallpapers'
import { useApp } from '@/state/app'
import { Button, NavHeader, Press, Segmented, T, haptic } from '@/ui'
import { useNow } from '@/ui/blocks'
import { scheduleText } from '@/ui/schedule-canvas'
import { Sym } from '@/ui/symbol'

const INK = '#141716'
const INK2 = 'rgba(20,23,22,0.56)'
const GREEN = '#0E7A4A'
const BACKDROPS = WALLPAPER_THEMES.filter(t => t.image)
const TEXT_SHADOW = { textShadowColor: 'rgba(0,0,0,0.28)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 }

/** Home and Lock Screen widgets, previewed on real wallpaper art with the student's own classes. */
export default function Widgets() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const { classes } = useApp()
  const [tab, setTab] = useState<'home' | 'lock'>('home')
  const [backdropId, setBackdropId] = useState('ocean-party')
  const backdrop = BACKDROPS.find(b => b.id === backdropId) ?? BACKDROPS[0]

  return (
    <View style={{ flex: 1, backgroundColor: c.grouped }}>
      <NavHeader title="Widgets" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 20, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={rise(0)} style={{ gap: 6 }}>
          <T v="title2">Your next class at a glance</T>
          <T v="subhead" color={c.ink2}>How the widgets look with your schedule.</T>
        </Animated.View>
        <Segmented value={tab} onChange={setTab} options={[{ value: 'home', label: 'Home Screen' }, { value: 'lock', label: 'Lock Screen' }]} />

        <Animated.View key={`${tab}-${backdropId}`} entering={fade(0, 240)}>
          {tab === 'home' ? <HomePreview backdrop={backdrop} /> : <LockPreview backdrop={backdrop} />}
        </Animated.View>

        {/* Backdrop picker */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}>
          {BACKDROPS.map(b => {
            const on = b.id === backdrop.id
            return (
              <Press key={b.id} onPress={() => { haptic.select(); setBackdropId(b.id) }} scale={0.9} accessibilityLabel={`${b.name} backdrop`} accessibilityState={{ selected: on }}
                style={{ padding: 2.5, borderRadius: 27, borderWidth: 2, borderColor: on ? c.green : 'transparent' }}>
                <Image source={b.image} style={{ width: 44, height: 44, borderRadius: 22 }} contentFit="cover" />
              </Press>
            )
          })}
        </ScrollView>

        <View style={{ gap: 12 }}>
          <Button title="Make a schedule wallpaper" icon={ImageIcon} onPress={() => router.push('/wallpaper')} />
          <Button title="Share schedule" icon={ShareIcon} kind="secondary" onPress={() => Share.share({ message: scheduleText(classes) }).catch(() => {})} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, padding: 16, borderRadius: radius.md, backgroundColor: c.card }}>
          <Sym name="info.circle" fallback={Info} size={18} color={c.ink3} />
          <T v="footnote" color={c.ink2} style={{ flex: 1 }}>
            Live Home & Lock Screen widgets are coming in a future update. For now, save a schedule wallpaper for your Lock Screen or share your week as text.
          </T>
        </View>
      </ScrollView>
    </View>
  )
}

// ─── Phone shell ─────────────────────────────────────────────────────────────

/** A phone sized to the screen, showing the chosen wallpaper art edge to edge. */
function Phone({ backdrop, children }: { backdrop: WallpaperTheme; children: (unit: number) => React.ReactNode }) {
  const { width } = useWindowDimensions()
  const now = useNow()
  const frame = Math.min(width - 40, 360)
  const inner = frame - 16
  const unit = (inner - 2 * 18 - 16) / 2 // small widget side, 16pt gutter like iOS
  const h = now.getHours() % 12 || 12
  return (
    <View style={{ borderRadius: 50, padding: 8, backgroundColor: '#0B0B0C', alignSelf: 'center', width: frame, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 }}>
      <View style={{ borderRadius: 42, overflow: 'hidden', height: inner * 2.05 }}>
        <Image source={backdrop.image} style={{ position: 'absolute', inset: 0 }} contentFit="cover" />
        {/* soft scrims keep white system text legible on bright art */}
        <LinearGradient colors={['rgba(0,0,0,0.22)', 'rgba(0,0,0,0)']} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 90 }} />
        <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.18)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 140 }} />

        {/* status bar */}
        <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 26 }}>
          <T color="#fff" style={{ flex: 1, fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'], ...TEXT_SHADOW }}>{h}:{String(now.getMinutes()).padStart(2, '0')}</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Sym name="cellularbars" fallback={Signal} size={14} color="#fff" weight="semibold" />
            <Sym name="wifi" fallback={Wifi} size={14} color="#fff" weight="semibold" />
            <Sym name="battery.100percent" fallback={BatteryFull} size={20} color="#fff" />
          </View>
        </View>
        <View style={{ flex: 1, paddingHorizontal: 18 }}>{children(unit)}</View>
      </View>
    </View>
  )
}

/** Widget surface: solid, rounded like iOS (radius ≈ 22% of a small widget). */
function Widget({ children, w, h, style, label = 'Dormosaur' }: { children: React.ReactNode; w: number; h: number; style?: ViewStyle; label?: string | null }) {
  return (
    <View style={{ width: w, gap: 6 }}>
      <View style={[{ width: w, height: h, borderRadius: 22, padding: 14, backgroundColor: 'rgba(255,255,255,0.96)', overflow: 'hidden' }, style]}>{children}</View>
      {label ? <T v="caption" color="#fff" center numberOfLines={1} style={{ fontSize: 11, fontWeight: '500', ...TEXT_SHADOW }}>{label}</T> : null}
    </View>
  )
}

// ─── Home Screen ─────────────────────────────────────────────────────────────

function HomePreview({ backdrop }: { backdrop: WallpaperTheme }) {
  const { classes } = useApp()
  const now = useNow()
  const next = nextClass(classes, now)
  const today = dayOf(now)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const leftToday = classesOn(classes, today).filter(e => minutesOf(e.end) > nowMin)
  const tomorrowDay = DAYS[(DAYS.indexOf(today) + 1) % 7]
  const tomorrow = classesOn(classes, tomorrowDay)
  const counts = DAYS.map(d => classesOn(classes, d).length)
  const max = Math.max(1, ...counts)
  const total = counts.reduce((a, b) => a + b, 0)
  const tone = subjectOn(false, next?.entry.color ?? 2)
  const until = next ? splitDuration((next.live ? next.endsAt : next.startsAt).getTime() - now.getTime()) : null
  const untilText = !until ? '' : until.days ? `${until.days}d` : until.hours ? `${until.hours}h ${until.minutes}m` : `${until.minutes}m`

  return (
    <Phone backdrop={backdrop}>
      {u => (
        <View style={{ gap: 14, paddingTop: 14 }}>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {/* Up next: washed in the subject's own colour */}
            <Widget w={u} h={u} style={{ backgroundColor: tone.bg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <T v="footnote" color={tone.ink} style={{ fontWeight: '700', flex: 1, opacity: 0.75 }} numberOfLines={1}>{next?.live ? 'Now' : 'Up next'}</T>
                {next && <T v="caption" color={tone.ink} style={{ fontWeight: '700', fontVariant: ['tabular-nums'] }}>{next.live ? `${untilText} left` : `in ${untilText}`}</T>}
              </View>
              <View style={{ flex: 1 }} />
              <T v="title3" color={tone.ink} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ fontSize: 22, letterSpacing: -0.4 }}>{next?.entry.code || next?.entry.subject || 'Free'}</T>
              <T v="caption" color={tone.ink} numberOfLines={1} style={{ opacity: 0.75 }}>{next ? `${formatTime(next.entry.start)}${next.entry.room ? ` · ${next.entry.room}` : ''}` : 'No classes this week'}</T>
            </Widget>
            {/* Today */}
            <Widget w={u} h={u}>
              <T v="footnote" color={GREEN} style={{ fontWeight: '700' }}>{now.toLocaleDateString(undefined, { weekday: 'long' })}</T>
              <View style={{ flex: 1 }} />
              <T color={INK} style={{ fontSize: 44, lineHeight: 46, fontWeight: '700', letterSpacing: -1.5, fontVariant: ['tabular-nums'] }}>{leftToday.length}</T>
              <T v="caption" color={INK2} numberOfLines={1}>{leftToday.length ? `${leftToday.length === 1 ? 'class' : 'classes'} left today` : 'Done for today'}</T>
            </Widget>
          </View>

          {/* Tomorrow */}
          <Widget w={u * 2 + 16} h={u}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 }}>
              <T v="footnote" color={GREEN} style={{ fontWeight: '700', flex: 1 }}>Tomorrow</T>
              <T v="caption" color={INK2}>{tomorrowDay} · {tomorrow.length} {tomorrow.length === 1 ? 'class' : 'classes'}</T>
            </View>
            <View style={{ gap: 5 }}>
              {tomorrow.slice(0, 3).map(e => <MiniRow key={e.id} e={e} />)}
            </View>
            {!tomorrow.length && <T v="subhead" color={INK2}>Free day</T>}
          </Widget>

          {/* This week */}
          <Widget w={u * 2 + 16} h={u}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <T v="footnote" color={GREEN} style={{ fontWeight: '700', flex: 1 }}>This week</T>
              <T v="caption" color={INK2}>{total} classes</T>
            </View>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 10 }}>
              {DAYS.map((d, i) => (
                <View key={d} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                  <T v="caption" color={d === today ? GREEN : INK2} style={{ fontSize: 10, fontWeight: '700', fontVariant: ['tabular-nums'], opacity: counts[i] ? 1 : 0 }}>{counts[i]}</T>
                  <View style={{ width: '100%', height: Math.max(3, (counts[i] / max) * (u - 100)), borderRadius: 5, backgroundColor: d === today ? GREEN : 'rgba(14,122,74,0.16)' }} />
                  <T v="caption" color={d === today ? GREEN : INK2} style={{ fontWeight: '700', fontSize: 11 }}>{d[0]}</T>
                </View>
              ))}
            </View>
          </Widget>
        </View>
      )}
    </Phone>
  )
}

/** A class in the Tomorrow widget: soft subject pill, then time and room. */
function MiniRow({ e }: { e: ClassEntry }) {
  const tone = subjectOn(false, e.color)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 28, paddingHorizontal: 10, borderRadius: 9, backgroundColor: tone.bg }}>
      <T v="footnote" color={tone.ink} style={{ fontWeight: '700', flex: 1 }} numberOfLines={1}>{e.code || e.subject}</T>
      <T v="caption" color={tone.ink} numberOfLines={1} style={{ fontWeight: '600', fontVariant: ['tabular-nums'] }}>{formatTime(e.start)}</T>
      {e.room ? <T v="caption" color={tone.ink} numberOfLines={1} style={{ maxWidth: 96, opacity: 0.7 }}>{e.room}</T> : null}
    </View>
  )
}

// ─── Lock Screen ─────────────────────────────────────────────────────────────

function Glass({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ overflow: 'hidden', borderRadius: 24 }, style]}>
      {Platform.OS === 'ios'
        ? <BlurView intensity={40} tint="systemUltraThinMaterialDark" style={{ position: 'absolute', inset: 0 }} />
        : <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(20,24,22,0.42)' }} />}
      {children}
    </View>
  )
}

function LockPreview({ backdrop }: { backdrop: WallpaperTheme }) {
  const { classes } = useApp()
  const now = useNow(1000 * 30)
  const next = nextClass(classes, now)
  const { days, hours, minutes } = next ? splitDuration((next.live ? next.endsAt : next.startsAt).getTime() - now.getTime()) : { days: 0, hours: 0, minutes: 0 }
  const h = now.getHours() % 12 || 12
  const left = days ? `${days}d ${hours}h` : hours ? `${hours}h ${minutes}m` : `${minutes} min`
  const today = classesOn(classes, dayOf(now))
  return (
    <Phone backdrop={backdrop}>
      {() => (
        <View style={{ flex: 1 }}>
          <View style={{ alignItems: 'center', marginTop: 6 }}>
            <T v="headline" color="#fff" style={TEXT_SHADOW}>{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</T>
            <T color="#fff" style={{ fontSize: 86, lineHeight: 94, fontWeight: '700', letterSpacing: -2, fontVariant: ['tabular-nums'], ...TEXT_SHADOW }}>{h}:{String(now.getMinutes()).padStart(2, '0')}</T>
          </View>

          {/* Lock Screen widget row under the clock */}
          {next && (
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 4 }}>
              <Glass style={{ borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, minWidth: 150 }}>
                <T v="caption" color="rgba(255,255,255,0.75)" style={{ fontWeight: '600' }}>{next.live ? 'Now' : formatTime(next.entry.start)}</T>
                <T v="subhead" color="#fff" style={{ fontWeight: '700' }} numberOfLines={1}>{next.entry.code || next.entry.subject}</T>
              </Glass>
              <Glass style={{ borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', minWidth: 70 }}>
                <T v="caption" color="rgba(255,255,255,0.75)" style={{ fontWeight: '600' }}>Today</T>
                <T v="subhead" color="#fff" style={{ fontWeight: '700', fontVariant: ['tabular-nums'] }}>{today.length}</T>
              </Glass>
            </View>
          )}

          <View style={{ flex: 1 }} />

          {/* Live Activity */}
          {next ? (
            <Glass style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: subjectOn(false, next.entry.color).bg, alignItems: 'center', justifyContent: 'center' }}>
                <Sym name="graduationcap.fill" fallback={GraduationCap} size={19} color={subjectOn(false, next.entry.color).ink} />
              </View>
              <View style={{ flex: 1 }}>
                <T v="caption" color="rgba(255,255,255,0.72)" style={{ fontWeight: '600' }}>{next.live ? 'Happening now' : 'Up next'}</T>
                <T v="headline" color="#fff" numberOfLines={1}>{next.entry.code || next.entry.subject}</T>
                <T v="caption" color="rgba(255,255,255,0.72)" numberOfLines={1}>{next.entry.room || next.entry.subject}</T>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T v="headline" color="#fff" style={{ fontVariant: ['tabular-nums'] }}>{left}</T>
                <T v="caption" color="rgba(255,255,255,0.72)">{next.live ? 'left' : 'to go'}</T>
              </View>
            </Glass>
          ) : <T v="subhead" color="#fff" center style={TEXT_SHADOW}>No upcoming classes</T>}

          {/* flashlight + camera */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 22, marginTop: 18, marginBottom: 26 }}>
            {[{ sf: 'flashlight.off.fill' as const, icon: Flashlight }, { sf: 'camera.fill' as const, icon: Camera }].map(b => (
              <Glass key={b.sf} style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' }}>
                <Sym name={b.sf} fallback={b.icon} size={19} color="#fff" />
              </Glass>
            ))}
          </View>
        </View>
      )}
    </Phone>
  )
}
