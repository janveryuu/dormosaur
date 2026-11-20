import * as DocumentPicker from 'expo-document-picker'
import { File } from 'expo-file-system'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { Camera, Check, ClipboardType, FileText, FileUp, ImageUp, RotateCcw, Sparkles } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fade, layout, rise } from '@/design/motion'
import { elevation, radius, useTheme } from '@/design/theme'
import { parseSchedule } from '@/lib/api'
import { DAYS, uid, type ClassEntry, type SubjectColor } from '@/lib/repo'
import { formatRange } from '@/lib/time'
import { useApp } from '@/state/app'
import { Button, Field, NavHeader, Press, T, haptic } from '@/ui'

type Src = 'library' | 'camera' | 'text' | 'file'
type Phase = { k: 'pick' } | { k: 'scanning'; preview?: string; label: string } | { k: 'review'; found: ClassEntry[] }

const STEPS = ['Reading your schedule…', 'Finding subjects and rooms…', 'Lining up days and times…', 'Organizing everything…']

/** The main feature: messy schedule in, organized schedule out. */
export default function Scan() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const { src } = useLocalSearchParams<{ src?: Src }>()
  const { classes: existing, saveClasses } = useApp()
  const [phase, setPhase] = useState<Phase>({ k: 'pick' })
  const [text, setText] = useState('')
  const [textMode, setTextMode] = useState(src === 'text')
  const [skip, setSkip] = useState<Set<string>>(new Set())

  async function run(input: { text: string } | { image: string }, preview?: string, label = 'Schedule') {
    setPhase({ k: 'scanning', preview, label })
    try {
      const [parsed] = await Promise.all([parseSchedule(input), new Promise(r => setTimeout(r, 1600))])
      if (!parsed.length) throw new Error('No classes found. Try a clearer photo or paste the text.')
      const found = parsed.map((p, i) => ({
        ...p, id: uid(), code: p.code ?? '', instructor: p.instructor ?? '', room: p.room ?? '',
        days: (p.days ?? []).filter(d => DAYS.includes(d as never)),
        color: (((existing.length + i) % 5) + 1) as SubjectColor,
      }))
      haptic.success()
      setSkip(new Set())
      setPhase({ k: 'review', found })
    } catch (e) {
      haptic.warn()
      Alert.alert("Couldn't read that", e instanceof Error ? e.message : 'Try again.')
      setPhase({ k: 'pick' })
    }
  }

  async function pickImage(source: 'camera' | 'library') {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], base64: true, quality: 0.7 }
    if (source === 'camera' && !(await ImagePicker.requestCameraPermissionsAsync()).granted) return
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts)
    const a = res.assets?.[0]
    if (res.canceled || !a?.base64) return
    run({ image: `data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}` }, a.uri)
  }

  async function pickFile() {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true })
    const a = res.assets?.[0]
    if (res.canceled || !a) return
    try {
      const b64 = await new File(a.uri).base64()
      const mime = a.mimeType ?? (a.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
      run({ image: `data:${mime};base64,${b64}` }, mime.startsWith('image/') ? a.uri : undefined, a.name)
    } catch {
      Alert.alert("Couldn't open file", 'Try another PDF or image.')
    }
  }

  // Deep-linked from the + sheet: open the right picker straight away.
  useEffect(() => {
    if (src === 'library') pickImage('library')
    else if (src === 'camera') pickImage('camera')
    else if (src === 'file') pickFile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (phase.k === 'scanning') return <Scanning preview={phase.preview} label={phase.label} />

  if (phase.k === 'review') {
    const chosen = phase.found.filter(x => !skip.has(x.id))
    const unsure = phase.found.filter(x => x.confidence === 'low' || x.lowFields?.length).length
    return (
      <View style={{ flex: 1, backgroundColor: c.grouped }}>
        <NavHeader title="Review" right={<Press onPress={() => setPhase({ k: 'pick' })} accessibilityLabel="Scan again" style={{ padding: 8 }}><RotateCcw size={20} color={c.green} /></Press>} />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 130 + insets.bottom }}>
          <Animated.View entering={rise(0)} style={{ alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: c.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={30} color={c.green} />
            </View>
            <T v="title1" center>{phase.found.length} classes found</T>
            <T v="callout" color={c.ink2} center>{unsure ? `Double-check ${unsure} marked ones. Tap to skip any.` : 'Looks clean. Tap any to skip it.'}</T>
          </Animated.View>
          {phase.found.map((e, i) => <ReviewRow key={e.id} e={e} i={i} on={!skip.has(e.id)} toggle={() => setSkip(s => { const n = new Set(s); if (n.has(e.id)) n.delete(e.id); else n.add(e.id); return n })} />)}
        </ScrollView>
        <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 16 }}>
          <Button title={`Add ${chosen.length} ${chosen.length === 1 ? 'class' : 'classes'}`} icon={Check} disabled={!chosen.length}
            onPress={async () => { await saveClasses(chosen); haptic.success(); router.replace('/schedule') }} />
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
          <T v="callout" color={c.ink2} center>Screenshots, photos of printouts, PDFs or pasted text — we turn it into a clean weekly schedule.</T>
        </Animated.View>

        {textMode ? (
          <Animated.View entering={fade(0, 220)} style={{ gap: 12 }}>
            <Field value={text} onChangeText={setText} multiline autoFocus placeholder={'MATH101 MWF 8:30-9:50 Sci 204\nCHEM120 TTh 1-2:30 Lab B'} />
            <Button title="Organize schedule" icon={Sparkles} disabled={!text.trim()} onPress={() => run({ text }, undefined, 'Pasted text')} />
            <Button title="Use a photo instead" kind="ghost" size="md" onPress={() => setTextMode(false)} />
          </Animated.View>
        ) : (
          <Animated.View entering={rise(1)} style={{ gap: 12 }}>
            <Option icon={Camera} title="Take a photo" sub="Point at a printout or screen" hero onPress={() => pickImage('camera')} />
            <Option icon={ImageUp} title="Choose screenshot" sub="From your photo library" onPress={() => pickImage('library')} />
            <Option icon={FileUp} title="Import a file" sub="PDF or image" onPress={pickFile} />
            <Option icon={ClipboardType} title="Paste text" sub="Copied from your student portal" onPress={() => setTextMode(true)} />
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

function ReviewRow({ e, i, on, toggle }: { e: ClassEntry; i: number; on: boolean; toggle: () => void }) {
  const { c, subject } = useTheme()
  const tone = subject(e.color)
  const low = e.confidence === 'low' || !!e.lowFields?.length
  return (
    <Animated.View entering={rise(Math.min(i + 1, 10))} layout={layout}>
      <Press onPress={() => { haptic.select(); toggle() }} scale={0.98} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={e.subject}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md, backgroundColor: on ? tone.bg : c.card, opacity: on ? 1 : 0.55 }}>
        <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: tone.bar }} />
        <View style={{ flex: 1, gap: 2 }}>
          <T v="headline" color={tone.ink} numberOfLines={1}>{e.code || e.subject}</T>
          {e.code ? <T v="footnote" color={tone.ink} numberOfLines={1}>{e.subject}</T> : null}
          <T v="footnote" color={tone.ink} style={{ fontWeight: '600' }}>{e.days.join(' ')} · {formatRange(e.start, e.end)}{e.room ? ` · ${e.room}` : ''}</T>
          {low && <T v="caption" color={c.warn} style={{ fontWeight: '700' }}>Check details</T>}
        </View>
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: on ? tone.bar : c.fill, alignItems: 'center', justifyContent: 'center' }}>
          {on && <Check size={15} color="#fff" strokeWidth={3} />}
        </View>
      </Press>
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
    const id = setInterval(() => setStep(s => (s + 1) % STEPS.length), 1300)
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
