import * as DocumentPicker from 'expo-document-picker'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { Camera, Check, FileUp, ImageUp, Sparkles } from 'lucide-react-native'
import { useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fade, layout, rise } from '@/design/motion'
import { radius, useTheme } from '@/design/theme'
import { parseDeadlines } from '@/lib/api'
import { openPaywall, pro } from '@/lib/pro'
import { useMyPro } from '@/ui/pro-gate'
import { uid, type Deadline, type DeadlineType } from '@/lib/repo'
import { formatTime } from '@/lib/time'
import { prepareFile, prepareImage } from '@/lib/upload'
import { useApp } from '@/state/app'
import { Button, Field, NavHeader, Press, Segmented, T, haptic } from '@/ui'
import { PickerField } from '@/ui/picker-field'

/** A found deadline. Date/time stay empty until the source (or the student) gives them. */
type Draft = { id: string; title: string; code: string; type: DeadlineType; date: string; time: string; color: Deadline['color']; include: boolean; check: string[] }
const TYPES: DeadlineType[] = ['exam', 'assignment', 'project', 'quiz', 'other']
const norm = (s?: string) => (s ?? '').replace(/\s/g, '').toLowerCase()

export default function ImportTasks() {
  const { c, subject } = useTheme()
  const insets = useSafeAreaInsets()
  const { classes, saveDeadlines } = useApp()
  const [mode, setMode] = useState<'photo' | 'text'>('photo')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const proGate = useMyPro()
  const [found, setFound] = useState<Draft[] | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  async function run(make: () => Promise<{ mode: 'text' | 'photo' | 'file'; content: string }>) {
    if (!proGate.canUse('syllabus_scan')) { openPaywall('syllabus_scan'); return }
    setBusy(true)
    try {
      const drafts = await parseDeadlines(await make())
      if (!drafts.length) throw new Error('No deadlines found.')
      setFound(drafts.map(d => {
        const cls = classes.find(x => x.code && d.code && norm(x.code) === norm(d.code))
        return {
          id: uid(), title: d.title || 'Task', code: cls?.code ?? d.code ?? '',
          type: (TYPES.includes(d.type as DeadlineType) ? d.type : 'assignment') as DeadlineType,
          date: d.dueDate ?? '', time: d.dueTime ?? '', color: cls?.color ?? 1, include: true,
          check: (d.lowFields ?? []).filter(f => f === 'dueDate' || f === 'dueTime'),
        }
      }))
      setOpen(null)
      haptic.success()
      if (proGate.userId) pro.refresh(proGate.userId, proGate.demo)
    } catch (e) {
      if (proGate.onError(e)) return
      haptic.warn()
      Alert.alert("Couldn't read tasks", e instanceof Error ? e.message : 'Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function pick(source: 'camera' | 'library') {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 }
    if (source === 'camera' && !(await ImagePicker.requestCameraPermissionsAsync()).granted) return
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts)
    const a = res.assets?.[0]
    if (res.canceled || !a) return
    run(async () => ({ mode: 'photo', content: await prepareImage(a) }))
  }

  async function pickFile() {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true })
    const a = res.assets?.[0]
    if (res.canceled || !a) return
    run(async () => ({ mode: 'file', content: (await prepareFile(a)).dataUrl }))
  }

  if (found) {
    const edit = (id: string, patch: Partial<Draft>, cleared: string[] = []) =>
      setFound(list => list && list.map(d => d.id === id ? { ...d, ...patch, check: d.check.filter(f => !cleared.includes(f)) } : d))
    const chosen = found.filter(d => d.include)
    const undated = chosen.filter(d => !d.date).length
    const unsure = chosen.filter(d => d.check.length).length
    return (
      <View style={{ flex: 1, backgroundColor: c.grouped }}>
        <NavHeader title="Review" />
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 10, paddingBottom: 140 + insets.bottom }} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 4, marginBottom: 10 }}>
            <T v="title1">{found.length} {found.length === 1 ? 'deadline' : 'deadlines'} found</T>
            <T v="callout" color={unsure ? c.warn : c.ink2}>{unsure ? `${unsure} ${unsure === 1 ? 'needs' : 'need'} a date or time check. Tap to fix.` : 'Every date was read from the source.'}</T>
          </View>
          {found.map((d, i) => {
            const tone = subject(d.color)
            const isOpen = open === d.id
            const due = d.date ? new Date(`${d.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'No date'
            return (
              <Animated.View key={d.id} entering={rise(Math.min(i, 10))} layout={layout} style={{ borderRadius: radius.md, backgroundColor: d.include ? tone.bg : c.card, opacity: d.include ? 1 : 0.55, overflow: 'hidden' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Press onPress={() => setOpen(o => (o === d.id ? null : d.id))} scale={0.99} accessibilityLabel={`${d.title}, ${due}${d.time ? ` ${formatTime(d.time)}` : ''}. Edit`}
                    style={{ flex: 1, padding: 14, paddingRight: 6, gap: 3 }}>
                    <T v="headline" color={tone.ink} numberOfLines={2}>{d.title}</T>
                    <T v="footnote" color={tone.ink} style={{ fontWeight: '600' }}>{[d.code, due, d.time ? formatTime(d.time) : 'No time (11:59 PM)'].filter(Boolean).join(' · ')}</T>
                    {(!d.date || d.check.length > 0) && (
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                        {(!d.date || d.check.includes('dueDate')) && <Pill text={d.date ? 'Check date' : 'Set a date'} />}
                        {d.check.includes('dueTime') && d.time && <Pill text="Check time" />}
                      </View>
                    )}
                  </Press>
                  <Press onPress={() => { haptic.select(); edit(d.id, { include: !d.include }) }} accessibilityRole="checkbox" accessibilityState={{ checked: d.include }} accessibilityLabel={`Include ${d.title}`} hitSlop={8} scale={0.85}
                    style={{ width: 52, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: d.include ? tone.ink : c.fill, alignItems: 'center', justifyContent: 'center' }}>
                      {d.include && <Check size={15} color={tone.bg} strokeWidth={3} />}
                    </View>
                  </Press>
                </View>
                {isOpen && (
                  <Animated.View entering={fade(0, 180)} style={{ padding: 14, paddingTop: 4, gap: 12, borderTopWidth: 1, borderColor: tone.bar + '40' }}>
                    <Field label="Title" value={d.title} onChangeText={v => edit(d.id, { title: v })} />
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1 }}><PickerField label="Due date" mode="date" value={d.date} onChange={v => edit(d.id, { date: v }, ['dueDate'])} /></View>
                      <View style={{ flex: 1 }}><PickerField label="Due time" mode="time" value={d.time || '23:59'} onChange={v => edit(d.id, { time: v }, ['dueTime'])} /></View>
                    </View>
                  </Animated.View>
                )}
              </Animated.View>
            )
          })}
        </ScrollView>
        <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 16, gap: 8 }}>
          {undated > 0 && <T v="footnote" color={c.warn} center>Set a date for {undated === 1 ? '1 deadline' : `${undated} deadlines`}, or untick it.</T>}
          <Button title={`Add ${chosen.length}`} icon={Check} disabled={!chosen.length || undated > 0} onPress={async () => {
            await saveDeadlines(chosen.map(d => ({
              id: d.id, title: d.title.trim() || 'Task', code: d.code, type: d.type, color: d.color, completed: false,
              due: new Date(`${d.date}T${d.time || '23:59'}:00`).toISOString(),
            })))
            haptic.success()
            router.replace('/tasks')
          }} />
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.grouped }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NavHeader title="Scan syllabus" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <Animated.View entering={rise(0)} style={{ alignItems: 'center', gap: 6 }}>
          <Image source={require('@/assets/mascots/dormosaur-you-got-this.png')} style={{ width: 130, height: 130 }} contentFit="contain" />
          <T v="title2" center>Never miss a deadline</T>
          <T v="callout" color={c.ink2} center>Snap a syllabus, import a PDF or paste an announcement. Dormo pulls out every due date.</T>
        </Animated.View>
        <Segmented value={mode} onChange={setMode} options={[{ value: 'photo', label: 'Photo or file' }, { value: 'text', label: 'Paste' }]} />
        {busy ? (
          <Animated.View entering={fade()} style={{ alignItems: 'center', gap: 12, padding: 30 }}>
            <ActivityIndicator color={c.green} size="large" />
            <T v="headline" color={c.ink2}>Finding deadlines…</T>
          </Animated.View>
        ) : mode === 'photo' ? (
          <Animated.View key="p" entering={fade(0, 200)} style={{ gap: 10 }}>
            <Button title="Choose image" icon={ImageUp} onPress={() => pick('library')} />
            <Button title="Import PDF or file" icon={FileUp} kind="secondary" onPress={pickFile} />
            <Button title="Take photo" icon={Camera} kind="secondary" onPress={() => pick('camera')} />
          </Animated.View>
        ) : (
          <Animated.View key="t" entering={fade(0, 200)} style={{ gap: 12 }}>
            <Field value={text} onChangeText={setText} multiline placeholder={'Lab report due Friday 5pm\nMidterm Dec 4, 9:00'} />
            <Button title="Find deadlines" icon={Sparkles} disabled={!text.trim()} onPress={() => run(async () => ({ mode: 'text', content: text }))} />
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Pill({ text }: { text: string }) {
  const { c } = useTheme()
  return (
    <View style={{ paddingHorizontal: 8, height: 22, borderRadius: 11, justifyContent: 'center', backgroundColor: c.warnSoft }}>
      <T v="caption" color={c.warn} style={{ fontWeight: '700' }}>{text}</T>
    </View>
  )
}
