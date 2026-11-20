import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import {
  AlarmClock, ArrowRight, BellRing, CalendarClock, Check, CheckCircle2, ChevronRight, Clock3, Coffee, MapPin, MessageCircle, Navigation, Utensils,
} from 'lucide-react-native'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { RefreshControl, ScrollView, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { rise } from '@/design/motion'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TAB_CLEARANCE } from '@/components/tab-bar'
import { IconButton, Press, SectionHeader, T } from '@/components/ui'
import { color, font, radius, shadow, shadowFloat, subject } from '@/design/tokens'
import type { ClassEntry } from '@/lib/repo'
import { recipes } from '@/lib/recipes'
import { classesOn, dayOf, formatTime, greeting, minutesOf, nextClass, relativeDue } from '@/lib/time'
import { useApp } from '@/state/app'

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function countdownLabel(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  return `${m}m ${String(sec).padStart(2, '0')}s`
}


export default function Today() {
  const insets = useSafeAreaInsets()
  const { profile, classes, alarms, deadlines, saveDeadline, refresh, demo } = useApp()
  const [refreshing, setRefreshing] = useState(false)
  const now = useNow()
  const minute = Math.floor(now.getTime() / 60000)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const next = useMemo(() => nextClass(classes, now), [classes, minute])
  const todayClasses = useMemo(() => classesOn(classes, dayOf(now)), [classes, minute]) // eslint-disable-line react-hooks/exhaustive-deps
  const open = useMemo(() => deadlines.filter(d => !d.completed), [deadlines])
  const activeAlarms = alarms.filter(a => a.enabled).length
  const meal = useMemo(() => {
    const h = new Date().getHours()
    const type = h < 10 ? 'breakfast' : h < 15 ? 'lunch' : h < 21 ? 'dinner' : 'snack'
    const pool = recipes.filter(r => r.mealType === type || r.mealTypes?.includes(type))
    return pool.length ? pool : recipes
  }, [])

  const firstName = profile?.name?.split(' ')[0] || 'there'
  const dateLabel = now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
  const cls = todayClasses.length

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.canvas }}
      contentContainerStyle={{ paddingBottom: TAB_CLEARANCE }}
      showsVerticalScrollIndicator={false}
      refreshControl={demo ? undefined : <RefreshControl tintColor={color.green} refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refresh(); setRefreshing(false) }} />}
    >
      {/* Campus context header */}
      <View style={{ paddingTop: insets.top + 8, paddingBottom: 26, paddingHorizontal: 20, overflow: 'hidden' }}>
        <Image source={require('@/assets/images/campus-daylight.jpg')} style={{ position: 'absolute', inset: 0 }} contentFit="cover" contentPosition={{ top: '40%', left: '70%' }} />
        <LinearGradient colors={[color.canvas, 'rgba(244,244,235,0.86)', 'rgba(244,244,235,0.2)']} locations={[0, 0.45, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: 'absolute', inset: 0 }} />
        <LinearGradient colors={['rgba(244,244,235,0)', color.canvas]} locations={[0.55, 1]} style={{ position: 'absolute', inset: 0 }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Press haptic onPress={() => router.push('/profile')} accessibilityLabel="Profile"
            style={[{ width: 44, height: 44, borderRadius: 22, backgroundColor: color.green, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: color.card }, shadow]}>
            <T style={{ fontFamily: font.black, color: color.white, fontSize: 16 }}>{(profile?.initials || profile?.name?.[0] || 'D').toUpperCase()}</T>
          </Press>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <IconButton icon={MessageCircle} label="Ask Dormo" tone="soft" onPress={() => router.push('/copilot')} />
            <IconButton icon={BellRing} label="Alarms" tone="soft" onPress={() => router.push('/alarms')} />
          </View>
        </View>

        <Animated.View entering={rise(0)} style={{ marginTop: 40, gap: 8, maxWidth: 300 }}>
          <T v="label">{dateLabel}</T>
          <T v="display" style={{ fontSize: 40, lineHeight: 44 }} accessibilityRole="header">Today</T>
          <T v="meta" style={{ fontSize: 14, lineHeight: 20, color: color.inkSoft }}>
            {greeting(now)}, {firstName}. {cls} {cls === 1 ? 'class' : 'classes'} and {activeAlarms} active {activeAlarms === 1 ? 'alarm' : 'alarms'}.
          </T>
        </Animated.View>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 24 }}>
        {/* Next departure */}
        <Animated.View entering={rise(1)}>
          {next ? <DepartureCard entry={next.entry} live={next.live} target={next.live ? next.endsAt : next.startsAt} now={now} /> : <ClearBoard hasClasses={classes.length > 0} />}
        </Animated.View>

        {/* Briefing */}
        <Animated.View entering={rise(2)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }} style={{ marginHorizontal: -16 }}>
            <Briefing icon={CalendarClock} title={open[0]?.title || 'No deadlines due'} body={open[0] ? `${relativeDue(open[0].due, now)} · ${open[0].code || open[0].type}` : 'Your board is clear for now'} onPress={() => router.push('/tasks')} />
            <Briefing icon={activeAlarms ? CheckCircle2 : AlarmClock} title={activeAlarms ? 'Alarms ready' : 'Set a class alarm'} body={activeAlarms ? `${activeAlarms} watching your schedule` : 'Add a lead time before class'} onPress={() => router.push('/alarms')} />
            <Briefing icon={Utensils} title={meal[0].title} body={`${meal[0].minutes} min · ${meal[0].appliance}`} image={meal[0].image}
              onPress={() => router.push({ pathname: '/recipe/[slug]', params: { slug: meal[0].slug } })} />
          </ScrollView>
        </Animated.View>

        {/* Mascot callout */}
        <Animated.View entering={rise(3)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECEEE0', borderRadius: radius.xl, borderWidth: 1, borderColor: '#D3DECF', paddingLeft: 6, paddingRight: 18, overflow: 'hidden', minHeight: 132 }}>
          <Image source={require('@/assets/mascots/dormosaur-you-got-this.png')} style={{ width: 118, height: 128, alignSelf: 'flex-end' }} contentFit="contain" accessibilityIgnoresInvertColors />
          <View style={{ flex: 1, gap: 6, paddingVertical: 16 }}>
            <T v="label">Same campus. Bigger you.</T>
            <T style={{ fontFamily: font.serif, fontSize: 22, lineHeight: 24, letterSpacing: -0.7, color: color.ink }}>Show up for a brighter you.</T>
            <T v="meta" style={{ fontSize: 12 }}>Small steps, better days.</T>
          </View>
        </Animated.View>

        {/* Today's route */}
        {todayClasses.length > 0 && (
          <Animated.View entering={rise(4)} style={{ gap: 14 }}>
            <SectionHeader title="Today's route" action="Full timetable" onAction={() => router.push('/schedule')} />
            <Route classes={todayClasses} nextId={next?.entry.id} />
          </Animated.View>
        )}

        {/* Deadlines */}
        {open.length > 0 && (
          <View style={{ gap: 12 }}>
            <SectionHeader title="Upcoming deadlines" action="View all" onAction={() => router.push('/tasks')} />
            {open.slice(0, 3).map(d => {
              const tone = subject[d.color]
              const overdue = relativeDue(d.due, now) === 'Overdue'
              return (
                <View key={d.id} style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: color.card, borderRadius: radius.lg, borderWidth: 1, borderColor: color.line, padding: 14 }]}>
                  <Press haptic accessibilityRole="checkbox" accessibilityLabel={`Complete ${d.title}`} onPress={() => saveDeadline({ ...d, completed: true })}
                    style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: tone.dot, alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={13} color={color.line} strokeWidth={3} />
                  </Press>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T v="strong" numberOfLines={1}>{d.title}</T>
                    <T v="meta" style={{ fontSize: 12 }}>{[d.code, d.type[0].toUpperCase() + d.type.slice(1)].filter(Boolean).join(' · ')}</T>
                  </View>
                  <View style={{ backgroundColor: overdue ? color.coralSoft : color.sunSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <T style={{ fontFamily: font.bold, fontSize: 12, color: overdue ? color.coral : '#6B5200' }}>{relativeDue(d.due, now)}</T>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {/* Quick dorm bites */}
        <View style={{ gap: 14 }}>
          <SectionHeader title="Quick dorm bites" action="Explore kitchen" onAction={() => router.push('/kitchen')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }} style={{ marginHorizontal: -16 }}>
            {meal.slice(0, 5).map(r => (
              <Press key={r.slug} onPress={() => router.push({ pathname: '/recipe/[slug]', params: { slug: r.slug } })} accessibilityRole="button" accessibilityLabel={r.title}
                style={[{ width: 220, backgroundColor: color.card, borderRadius: radius.lg, borderWidth: 1, borderColor: color.line, overflow: 'hidden' }, shadow]}>
                <Image source={r.image} style={{ width: '100%', aspectRatio: 16 / 10 }} contentFit="cover" transition={200} />
                <View style={{ padding: 12, gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Utensils size={11} color={color.green} strokeWidth={2.4} />
                    <T style={{ fontFamily: font.bold, fontSize: 11, color: color.green }}>{r.minutes} min · {r.appliance}</T>
                  </View>
                  <T v="heading" style={{ fontSize: 15 }} numberOfLines={1}>{r.title}</T>
                  <T v="meta" style={{ fontSize: 12 }} numberOfLines={1}>{r.blurb}</T>
                </View>
              </Press>
            ))}
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  )
}

// ─── Departure card ──────────────────────────────────────────────────────────

function DepartureCard({ entry, live, target, now }: { entry: ClassEntry; live: boolean; target: Date; now: Date }) {
  const guide = entry.instructor && !['TBA', 'None'].includes(entry.instructor) ? entry.instructor.split(' ').slice(-1)[0] : 'Campus'
  const subtitle = [entry.code && entry.code !== entry.subject ? entry.code : null, entry.instructor && !['TBA', 'None'].includes(entry.instructor) ? entry.instructor : null].filter(Boolean).join(' · ')
  return (
    <Press onPress={() => router.push({ pathname: '/class', params: { id: entry.id } })} accessibilityRole="button" accessibilityLabel={`Next class ${entry.subject}`}
      style={[{ borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: '#1C4F35' }, shadowFloat]}>
      <LinearGradient colors={[color.night, '#0B3A23']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20 }}>
        <Grid />
        <Image source={require('@/assets/images/student-dormosaur.png')} style={{ position: 'absolute', right: -4, top: 64, width: 112, height: 132 }} contentFit="contain" />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(247,213,96,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRight size={20} color={color.highlight} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <T v="label" style={{ color: color.highlight }}>{live ? 'On the route now' : 'Next departure'}</T>
            <T style={{ fontFamily: font.medium, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>{live ? 'You are in class' : 'Same direction, one less thing to remember'}</T>
          </View>
        </View>

        <View style={{ marginTop: 26, maxWidth: '68%' }}>
          <T style={{ fontFamily: font.bold, fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.5)' }}>CLASS</T>
          <T style={{ fontFamily: font.black, fontSize: 30, lineHeight: 31, letterSpacing: -1.5, color: color.white, marginTop: 6 }} numberOfLines={2}>{entry.subject || entry.code}</T>
          {!!subtitle && <T style={{ fontFamily: font.medium, fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6 }} numberOfLines={1}>{subtitle}</T>}
        </View>

        <View style={{ flexDirection: 'row', marginTop: 22, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }}>
          <DField label="Time" value={formatTime(entry.start)} grow={1.2} />
          <DField label="Room" value={entry.room || 'Online'} divider />
          <DField label="Guide" value={guide} divider />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 }}>
            <Navigation size={15} color={color.highlight} strokeWidth={2.2} />
            <T style={{ fontFamily: font.bold, fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>{live ? 'Ends in' : 'Leave in'}</T>
            <T style={{ fontFamily: font.black, fontSize: 22, letterSpacing: -1, color: color.highlight, fontVariant: ['tabular-nums'] }}>{countdownLabel(target.getTime() - now.getTime())}</T>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: color.green, borderRadius: radius.pill, paddingHorizontal: 14, height: 40 }}>
            <T style={{ fontFamily: font.black, fontSize: 13, color: color.white }}>View</T>
            <ArrowRight size={15} color={color.white} strokeWidth={2.4} />
          </View>
        </View>
      </LinearGradient>
    </Press>
  )
}

function DField({ label, value, divider, grow = 1 }: { label: string; value: string; divider?: boolean; grow?: number }) {
  return (
    <View style={{ flex: grow, minWidth: 0, paddingVertical: 14, paddingLeft: divider ? 12 : 0, paddingRight: 10, borderLeftWidth: divider ? 1 : 0, borderColor: 'rgba(255,255,255,0.18)' }}>
      <T style={{ fontFamily: font.bold, fontSize: 9.5, letterSpacing: 1.6, color: 'rgba(255,255,255,0.62)' }}>{label.toUpperCase()}</T>
      <T style={{ fontFamily: font.black, fontSize: 17, letterSpacing: -0.7, color: color.white, marginTop: 8 }} numberOfLines={2}>{value}</T>
    </View>
  )
}

/** Faint 24px wayfinding grid. */
function Grid() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, opacity: 0.07, flexDirection: 'row' }}>
      {Array.from({ length: 18 }).map((_, i) => <View key={i} style={{ width: 24, borderRightWidth: 1, borderColor: color.white }} />)}
    </View>
  )
}

function ClearBoard({ hasClasses }: { hasClasses: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 8, padding: 24, borderRadius: radius.xl, borderWidth: 1.5, borderStyle: 'dashed', borderColor: color.lineStrong, backgroundColor: color.field }}>
      <Image source={require('@/assets/mascots/dormosaur-comfy-time.png')} style={{ width: 112, height: 112 }} contentFit="contain" />
      <T v="heading" style={{ fontSize: 18 }}>{hasClasses ? 'Your board is clear today' : 'Bring in your timetable'}</T>
      <T v="meta" style={{ textAlign: 'center', maxWidth: 280 }}>{hasClasses ? 'Take the break, or plan ahead for the week.' : 'Snap your class schedule and Dormo sets up the rest.'}</T>
      <Press haptic onPress={() => router.push(hasClasses ? '/schedule' : '/import')} accessibilityRole="button"
        style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: color.green, borderRadius: radius.pill, paddingHorizontal: 18, height: 46 }}>
        <T style={{ fontFamily: font.bold, fontSize: 14, color: color.white }}>{hasClasses ? 'Open weekly schedule' : 'Scan schedule'}</T>
        <ChevronRight size={16} color={color.white} />
      </Press>
    </View>
  )
}

// ─── Briefing card ───────────────────────────────────────────────────────────

function Briefing({ icon: Icon, title, body, image, onPress }: { icon: typeof Clock3; title: string; body: string; image?: number; onPress: () => void }) {
  return (
    <Press onPress={onPress} accessibilityRole="button" accessibilityLabel={title}
      style={{ width: 172, minHeight: 150, backgroundColor: color.card, borderRadius: radius.lg, borderWidth: 1, borderColor: color.line, padding: 15, overflow: 'hidden' }}>
      {image && (
        <View style={{ position: 'absolute', right: 0, bottom: 0, width: '62%', height: '58%' }}>
          <Image source={image} style={{ width: '100%', height: '100%', opacity: 0.95 }} contentFit="cover" />
          <LinearGradient colors={[color.card, 'rgba(254,254,251,0.6)', 'rgba(254,254,251,0)']} locations={[0, 0.35, 0.85]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: 'absolute', inset: 0 }} />
          <LinearGradient colors={[color.card, 'rgba(254,254,251,0)']} locations={[0, 0.5]} style={{ position: 'absolute', inset: 0 }} />
        </View>
      )}
      <Icon size={21} color={color.green} strokeWidth={2.1} />
      <T v="heading" style={{ fontSize: 15, marginTop: 20, maxWidth: image ? '70%' : undefined }} numberOfLines={2}>{title}</T>
      <T v="meta" style={{ fontSize: 12, marginTop: 4, maxWidth: image ? '62%' : undefined }} numberOfLines={2}>{body}</T>
      <View style={{ flex: 1 }} />
      <ChevronRight size={16} color={color.inkMute} style={{ alignSelf: 'flex-end', marginTop: 8 }} />
    </Press>
  )
}

// ─── Route rail ──────────────────────────────────────────────────────────────

function Route({ classes, nextId }: { classes: ClassEntry[]; nextId?: string }) {
  return (
    <View style={{ marginLeft: 6, paddingLeft: 18, borderLeftWidth: 1, borderColor: color.lineStrong }}>
      {classes.map((c, i) => {
        const tone = subject[c.color]
        const nextC = classes[i + 1]
        const gap = nextC ? minutesOf(nextC.start) - minutesOf(c.end) : 0
        const current = c.id === nextId
        return (
          <Fragment key={c.id}>
            <Press onPress={() => router.push({ pathname: '/class', params: { id: c.id } })} accessibilityRole="button"
              style={{ flexDirection: 'row', gap: 12, paddingVertical: 14, paddingRight: 8, borderRadius: radius.md, backgroundColor: current ? 'rgba(227,226,213,0.6)' : 'transparent', paddingLeft: current ? 8 : 0, marginLeft: current ? -8 : 0 }}>
              <View style={{ position: 'absolute', left: current ? -17 : -25, top: 19, width: 13, height: 13, borderRadius: 7, backgroundColor: tone.dot, borderWidth: 3, borderColor: color.canvas }} />
              <View style={{ width: 4, height: 34, borderRadius: 2, backgroundColor: tone.dot, marginTop: 2 }} />
              <View style={{ flex: 1, gap: 5 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <T v="heading" style={{ fontSize: 15, flexShrink: 1 }} numberOfLines={1}>{c.subject}</T>
                  {!!c.code && <View style={{ backgroundColor: color.fill, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2 }}><T style={{ fontFamily: font.bold, fontSize: 10, color: color.inkSoft }}>{c.code}</T></View>}
                </View>
                <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Clock3 size={12} color={color.inkMute} /><T v="meta" style={{ fontSize: 12 }}>{formatTime(c.start)} – {formatTime(c.end)}</T></View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><MapPin size={12} color={color.inkMute} /><T v="meta" style={{ fontSize: 12 }}>{c.room || 'Room not recorded'}</T></View>
                </View>
              </View>
              {current && <T v="label" style={{ fontSize: 10, marginTop: 3 }}>Next</T>}
            </Press>
            {gap >= 20 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderStyle: 'dashed', borderColor: color.line }}>
                <Coffee size={13} color="#C9A21E" />
                <T style={{ fontFamily: font.bold, fontSize: 12, color: color.ink }}>{gap >= 60 ? `${Math.floor(gap / 60)}h ${gap % 60}m` : `${gap}m`} break</T>
                <T v="meta" style={{ fontSize: 12 }}>· room to reset</T>
              </View>
            )}
          </Fragment>
        )
      })}
    </View>
  )
}
