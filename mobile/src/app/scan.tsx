import * as DocumentPicker from 'expo-document-picker'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { AlertTriangle, Camera, Check, ChevronDown, ClipboardType, FileText, FileUp, ImageUp, RotateCcw, Sparkles } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fade, layout, rise } from '@/design/motion'
import { elevation, radius, useTheme } from '@/design/theme'
import { parseSchedule } from '@/lib/api'
import { DAYS, uid, type ClassEntry, type SubjectColor } from '@/lib/repo'
import { formatRange } from '@/lib/time'
import { prepareFile, prepareImage } from '@/lib/upload'
import { useApp } from '@/state/app'
import { Button, Field, NavHeader, Press, T, haptic } from '@/ui'
import { PickerField } from '@/ui/picker-field'

type Src = 'library' | 'camera' | 'text' | 'file'
type Draft = ClassEntry & { include: boolean }
type Phase = { k: 'pick' } | { k: 'scanning'; preview?: string; label: string } | { k: 'review'; found: Draft[]; duplicates: number; hint: string | null }

const STEPS = ['Reading your schedule…', 'Finding subjects and rooms…', 'Lining up days and times…', 'Organizing everything…']
const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const needs = (d: ClassEntry, f: string) => !!d.lowFields?.includes(f)
const incomplete = (d: ClassEntry) => !d.days.length || !d.start || !d.end || d.end <= d.start

/** The main feature: messy schedule in, organized schedule out. */
export default function Scan() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const { src, from } = useLocalSearchParams<{ src?: Src; from?: 'onboarding' }>()
  const { classes: existing, saveClasses } = useApp()
  const [phase, setPhase] = useState<Phase>({ k: 'pick' })
  const [text, setText] = useState('')
  const [textMode, setTextMode] = useState(src === 'text')
  const [open, setOpen] = useState<string | null>(null)

  async function run(prepare: () => Promise<{ text: string } | { image: string }>, preview?: string, label = 'Schedule') {
    setPhase({ k: 'scanning', preview, label })
    try {
      const res = await parseSchedule(await prepare())
      if (!res.classes.length) throw new Error('No classes found. Try a sharper screenshot or the original PDF.')
      // Keep the colour a subject already has; otherwise use the scanner's per-subject colour.
      const known = new Map(existing.map(e => [key(e.code || e.subject), e.color]))
      const same = (a: ClassEntry, b: ClassEntry) => key(a.code || a.subject) === key(b.code || b.subject) && a.start === b.start && a.end === b.end && a.days.join() === b.days.join()
      const all: Draft[] = res.classes.map(p => ({
        ...p, id: uid(), code: p.code ?? '', subject: p.subject || p.code || '', instructor: p.instructor ?? '', room: p.room ?? '',
        days: (p.days ?? []).filter(d => DAYS.includes(d as never)),
        color: (known.get(key(p.code || p.subject)) ?? p.color ?? 1) as SubjectColor,
        include: true,
      }))
      const fresh = all.filter(d => !existing.some(e => same(e, d)))
      if (!fresh.length) throw new Error('Every class in this schedule is already saved.')
      haptic.success()
      setOpen(null)
      setPhase({ k: 'review', found: fresh, duplicates: all.length - fresh.length, hint: res.hint })
    } catch (e) {
      haptic.warn()
      Alert.alert("Couldn't read that", e instanceof Error ? e.message : 'Try again.')
      setPhase({ k: 'pick' })
    }
  }

  async function pickImage(source: 'camera' | 'library') {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 }
    if (source === 'camera' && !(await ImagePicker.requestCameraPermissionsAsync()).granted) return
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts)
    const a = res.assets?.[0]
    if (res.canceled || !a) return
    run(async () => ({ image: await prepareImage(a) }), a.uri)
  }

  async function pickFile() {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true })
    const a = res.assets?.[0]
    if (res.canceled || !a) return
    run(async () => ({ image: (await prepareFile(a)).dataUrl }), a.mimeType?.startsWith('image/') ? a.uri : undefined, a.name)
  }

  // Deep-linked from the + sheet: open the right picker straight away.
  useEffect(() => {
    const t = setTimeout(() => {
      if (src === 'library') pickImage('library')
      else if (src === 'camera') pickImage('camera')
      else if (src === 'file') pickFile()
    }, 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (phase.k === 'scanning') return <Scanning preview={phase.preview} label={phase.label} />

  if (phase.k === 'review') {
    const update = (id: string, patch: Partial<Draft>, cleared?: string[]) => setPhase(p => p.k !== 'review' ? p : {
      ...p, found: p.found.map(d => d.id !== id ? d : {
        ...d, ...patch,
        lowFields: (d.lowFields ?? []).filter(f => !cleared?.includes(f)),
      }),
    })
    const chosen = phase.found.filter(d => d.include)
    const flagged = chosen.filter(d => d.lowFields?.length).length
    const blocked = chosen.filter(incomplete).length
    return (
      <View style={{ flex: 1, backgroundColor: c.grouped }}>
        <NavHeader title="Review" right={<Press onPress={() => setPhase({ k: 'pick' })} accessibilityLabel="Scan again" hitSlop={8} style={{ padding: 8 }}><RotateCcw size={20} color={c.green} /></Press>} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 10, paddingBottom: 130 + insets.bottom }} keyboardShouldPersistTaps="handled">
          <Animated.View entering={rise(0)} style={{ gap: 4, marginBottom: 10 }}>
            <T v="title1">{phase.found.length} {phase.found.length === 1 ? 'class' : 'classes'} found</T>
            <T v="callout" color={flagged ? c.warn : c.ink2}>
              {flagged ? `${flagged} ${flagged === 1 ? 'needs' : 'need'} a quick check. Tap to fix.` : 'Everything read clearly. Tap any class to edit.'}
            </T>
            {phase.duplicates > 0 && <T v="footnote" color={c.ink3}>{phase.duplicates} already in your schedule, skipped.</T>}
          </Animated.View>
          {phase.hint === 'grid_text' && (
            <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: c.warnSoft }}>
              <AlertTriangle size={18} color={c.warn} />
              <T v="footnote" color={c.ink} style={{ flex: 1 }}>Text copied from a timetable loses its columns, so days and times are guesses. For an exact read, upload the PDF or a screenshot.</T>
            </View>
          )}
          {phase.found.map((d, i) => (
            <ReviewRow key={d.id} d={d} i={i} open={open === d.id}
              onOpen={() => setOpen(o => (o === d.id ? null : d.id))}
              onToggle={() => update(d.id, { include: !d.include })}
              onChange={(patch, cleared) => update(d.id, patch, cleared)} />
          ))}
        </ScrollView>
        <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 16, gap: 8 }}>
          {blocked > 0 && <T v="footnote" color={c.warn} center>Add the missing day or time to {blocked === 1 ? '1 class' : `${blocked} classes`} first.</T>}
          <Button title={`Add ${chosen.length} ${chosen.length === 1 ? 'class' : 'classes'}`} icon={Check} disabled={!chosen.length || blocked > 0}
            onPress={async () => {
              await saveClasses(chosen.map(({ include: _i, ...d }) => ({ ...d, confidence: 'high', lowFields: [] })))
              haptic.success()
              // Onboarding waits on its review step; everywhere else lands on the schedule.
              if (from === 'onboarding') router.back()
              else router.replace('/schedule')
            }} />
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.grouped }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NavHeader title="Schedule scanner" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <Animated.View entering={rise(0)} style={{ alignItems: 'center', gap: 8 }}>
          <Image source={require('@/assets/mascots/dormosaur-thinking.png')} style={{ width: 140, height: 140 }} contentFit="contain" />
          <T v="title1" center>Messy schedule?{'\n'}Dormo sorts it.</T>
          <T v="callout" color={c.ink2} center>Screenshots, photos, PDFs or pasted text. For portal timetables, the PDF or a screenshot reads most exactly.</T>
        </Animated.View>

        {textMode ? (
          <Animated.View entering={fade(0, 220)} style={{ gap: 12 }}>
            <Field value={text} onChangeText={setText} multiline autoFocus placeholder={'MATH 101 MWF 8:30-9:50am Sci Hall 204\nCHEM 120 TTh 1-2:30pm Lab B11'} />
            <Button title="Organize schedule" icon={Sparkles} disabled={!text.trim()} onPress={() => run(async () => ({ text }), undefined, 'Pasted text')} />
            <Button title="Use a photo instead" kind="ghost" size="md" onPress={() => setTextMode(false)} />
          </Animated.View>
        ) : (
          <Animated.View entering={rise(1)} style={{ gap: 12 }}>
            <Option icon={ImageUp} title="Choose screenshot" sub="Best for portal schedules" hero onPress={() => pickImage('library')} />
            <Option icon={FileUp} title="Import PDF or file" sub="Exact read of portal PDFs" onPress={pickFile} />
            <Option icon={Camera} title="Take a photo" sub="Hold the phone level over the page" onPress={() => pickImage('camera')} />
            <Option icon={ClipboardType} title="Paste text" sub="Lists like MATH 101 MWF 8:30-9:50" onPress={() => setTextMode(true)} />
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Option({ icon: Icon, title, sub, hero, onPress }: { icon: typeof Camera; title: string; sub: string; hero?: boolean; onPress: () => void }) {
  const { c } = useTheme()
  return (
    <Press onPress={onPress} accessibilityLabel={title} scale={0.97}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.lg, backgroundColor: hero ? c.green : c.card }, hero && elevation(c, 2)]}>
      <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: hero ? 'rgba(255,255,255,0.18)' : c.greenSoft }}>
        <Icon size={22} color={hero ? c.onGreen : c.green} />
      </View>
      <View style={{ flex: 1 }}>
        <T v="headline" color={hero ? c.onGreen : c.ink}>{title}</T>
        <T v="footnote" color={hero ? c.onGreen : c.ink2} style={{ opacity: hero ? 0.85 : 1 }}>{sub}</T>
      </View>
    </Press>
  )
}

/** One scanned class: summary row, flagged fields called out, inline editor on tap. */
function ReviewRow({ d, i, open, onOpen, onToggle, onChange }: {
  d: Draft; i: number; open: boolean; onOpen: () => void; onToggle: () => void
  onChange: (patch: Partial<Draft>, cleared?: string[]) => void
}) {
  const { c, subject } = useTheme()
  const tone = subject(d.color)
  const checks = [needs(d, 'time') || !d.start || !d.end ? 'time' : '', needs(d, 'days') || !d.days.length ? 'days' : '', needs(d, 'room') ? 'room' : '', needs(d, 'code') || needs(d, 'subject') ? 'name' : ''].filter(Boolean)
  const when = d.start && d.end ? formatRange(d.start, d.end) : 'Time missing'
  return (
    <Animated.View entering={rise(Math.min(i + 1, 10))} layout={layout} style={{ borderRadius: radius.md, backgroundColor: d.include ? tone.bg : c.card, opacity: d.include ? 1 : 0.55, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Press onPress={onOpen} scale={0.99} accessibilityLabel={`${d.code || d.subject}, ${d.days.join(' ')} ${when}. ${open ? 'Close editor' : 'Edit'}`}
          style={{ flex: 1, padding: 14, paddingRight: 6, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <T v="headline" color={tone.ink} numberOfLines={1} style={{ flexShrink: 1 }}>{d.code || d.subject}</T>
            <ChevronDown size={16} color={tone.ink} style={{ opacity: 0.6, transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
          </View>
          {d.subject && d.subject !== d.code ? <T v="footnote" color={tone.ink} numberOfLines={1} style={{ opacity: 0.8 }}>{d.subject}</T> : null}
          <T v="footnote" color={tone.ink} style={{ fontWeight: '600', fontVariant: ['tabular-nums'] }}>
            {d.days.length ? d.days.join(' · ') : 'Day missing'}  ·  {when}{d.room ? `  ·  ${d.room}` : ''}
          </T>
          {checks.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {checks.map(f => (
                <View key={f} style={{ paddingHorizontal: 8, height: 22, borderRadius: 11, justifyContent: 'center', backgroundColor: c.warnSoft }}>
                  <T v="caption" color={c.warn} style={{ fontWeight: '700' }}>Check {f}</T>
                </View>
              ))}
            </View>
          )}
        </Press>
        <Press onPress={() => { haptic.select(); onToggle() }} accessibilityRole="checkbox" accessibilityState={{ checked: d.include }} accessibilityLabel={`Include ${d.code || d.subject}`} hitSlop={8} scale={0.85}
          style={{ width: 52, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: d.include ? tone.ink : c.fill, alignItems: 'center', justifyContent: 'center' }}>
            {d.include && <Check size={15} color={tone.bg} strokeWidth={3} />}
          </View>
        </Press>
      </View>

      {open && (
        <Animated.View entering={fade(0, 180)} style={{ padding: 14, paddingTop: 4, gap: 12, borderTopWidth: 1, borderColor: tone.bar + '40' }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Field label="Code" value={d.code} onChangeText={v => onChange({ code: v }, ['code'])} autoCapitalize="characters" /></View>
            <View style={{ flex: 1 }}><Field label="Room" value={d.room} onChangeText={v => onChange({ room: v }, ['room'])} placeholder="Optional" /></View>
          </View>
          <Field label="Subject" value={d.subject} onChangeText={v => onChange({ subject: v }, ['subject'])} />
          <View style={{ gap: 6 }}>
            <T v="footnote" color={c.ink2} style={{ fontWeight: '600', marginLeft: 4 }}>Days</T>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {DAYS.map(day => {
                const on = d.days.includes(day)
                return (
                  <Press key={day} scale={0.88} accessibilityLabel={day} accessibilityState={{ selected: on }}
                    onPress={() => onChange({ days: on ? d.days.filter(x => x !== day) : DAYS.filter(x => x === day || d.days.includes(x)) }, ['days'])}
                    style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? tone.ink : c.card }}>
                    <T v="caption" color={on ? tone.bg : c.ink2} style={{ fontWeight: '700' }}>{day.slice(0, 2)}</T>
                  </Press>
                )
              })}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><PickerField label="Starts" mode="time" value={d.start || '08:00'} onChange={v => onChange({ start: v }, ['time'])} /></View>
            <View style={{ flex: 1 }}><PickerField label="Ends" mode="time" value={d.end || '09:00'} onChange={v => onChange({ end: v }, ['time'])} /></View>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  )
}

/** Animated scan: laser sweep over the image, rotating status lines. */
function Scanning({ preview, label }: { preview?: string; label: string }) {
  const { c } = useTheme()
  const [h, setH] = useState(360)
  const [step, setStep] = useState(0)
  const y = useSharedValue(0)
  const pulse = useSharedValue(0)

  useEffect(() => {
    y.set(withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.cubic), reduceMotion: ReduceMotion.System }), -1, true))
    pulse.set(withRepeat(withTiming(1, { duration: 900, reduceMotion: ReduceMotion.System }), -1, true))
    // Advance through the stages and hold on the last one instead of looping.
    const id = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 1800)
    return () => clearInterval(id)
  }, [y, pulse])

  const laser = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() * (h - 60) }] }))
  const glow = useAnimatedStyle(() => ({ opacity: 0.5 + pulse.get() * 0.5 }))

  return (
    <View style={{ flex: 1, backgroundColor: '#04110A', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 28 }}>
      <View onLayout={ev => setH(ev.nativeEvent.layout.height)} style={{ width: '100%', maxWidth: 360, aspectRatio: 0.78, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: '#0D2418', borderWidth: 1, borderColor: 'rgba(125,240,181,0.25)' }}>
        {preview ? <Image source={{ uri: preview }} style={{ position: 'absolute', inset: 0, opacity: 0.85 }} contentFit="cover" /> : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <FileText size={64} color="rgba(125,240,181,0.6)" strokeWidth={1.4} />
            <T v="subhead" color="rgba(255,255,255,0.6)" numberOfLines={1}>{label}</T>
          </View>
        )}
        <Animated.View style={[{ position: 'absolute', left: 0, right: 0, height: 60 }, laser]}>
          <LinearGradient colors={['rgba(61,214,140,0)', 'rgba(61,214,140,0.35)', 'rgba(125,240,181,1)']} style={{ flex: 1 }} />
          <View style={{ height: 2, backgroundColor: '#B7FFD8', shadowColor: '#3DD68C', shadowOpacity: 1, shadowRadius: 12 }} />
        </Animated.View>
        {(['tl', 'tr', 'bl', 'br'] as const).map(k => (
          <View key={k} style={{ position: 'absolute', width: 28, height: 28, borderColor: '#7DF0B5', [k[0] === 't' ? 'top' : 'bottom']: 14, [k[1] === 'l' ? 'left' : 'right']: 14,
            [k[0] === 't' ? 'borderTopWidth' : 'borderBottomWidth']: 3, [k[1] === 'l' ? 'borderLeftWidth' : 'borderRightWidth']: 3, borderRadius: 6 }} />
        ))}
      </View>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, glow]}>
          <Sparkles size={18} color={c.mint} />
          <T v="overline" color="#7DF0B5" style={{ textTransform: 'uppercase' }}>Dormo is scanning</T>
        </Animated.View>
        <Animated.View key={step} entering={fade(0, 260)}>
          <T v="title3" color="#fff" center>{STEPS[step]}</T>
        </Animated.View>
      </View>
    </View>
  )
}
