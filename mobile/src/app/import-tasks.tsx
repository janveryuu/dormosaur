import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { Camera, Check, ImageUp, Sparkles } from 'lucide-react-native'
import { useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fade, rise } from '@/design/motion'
import { radius, useTheme } from '@/design/theme'
import { parseDeadlines } from '@/lib/api'
import { uid, type Deadline, type DeadlineType } from '@/lib/repo'
import { clockOf, relativeDue } from '@/lib/time'
import { useApp } from '@/state/app'
import { Button, Field, NavHeader, Press, Segmented, T, haptic } from '@/ui'

type Draft = Deadline & { unsure: boolean }
const TYPES: DeadlineType[] = ['exam', 'assignment', 'project', 'quiz', 'other']

export default function ImportTasks() {
  const { c, subject } = useTheme()
  const insets = useSafeAreaInsets()
  const { classes, saveDeadlines } = useApp()
  const [mode, setMode] = useState<'photo' | 'text'>('photo')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [found, setFound] = useState<Draft[] | null>(null)
  const [skip, setSkip] = useState<Set<string>>(new Set())

  async function run(input: { mode: 'text' | 'photo'; content: string }) {
    setBusy(true)
    try {
      const drafts = await parseDeadlines(input)
      if (!drafts.length) throw new Error('No deadlines found.')
      setFound(drafts.map(d => {
        const norm = (s?: string) => (s ?? '').replace(/\s/g, '').toLowerCase()
        const cls = classes.find(x => x.code && d.code && norm(x.code) === norm(d.code))
        const fb = new Date(); fb.setDate(fb.getDate() + 1)
        const date = d.dueDate || `${fb.getFullYear()}-${String(fb.getMonth() + 1).padStart(2, '0')}-${String(fb.getDate()).padStart(2, '0')}`
        const due = new Date(`${date}T${d.dueTime || '23:59'}:00`)
        return {
          id: uid(), title: d.title || 'Task', code: cls?.code ?? d.code ?? '',
          type: (TYPES.includes(d.type as DeadlineType) ? d.type : 'assignment') as DeadlineType,
          due: (Number.isNaN(due.getTime()) ? fb : due).toISOString(), color: cls?.color ?? 1, completed: false,
          unsure: !d.dueDate || Boolean(d.lowFields?.length),
        }
      }))
      haptic.success()
      setSkip(new Set())
    } catch (e) {
      haptic.warn()
      Alert.alert("Couldn't read tasks", e instanceof Error ? e.message : 'Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function pick(source: 'camera' | 'library') {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], base64: true, quality: 0.7 }
    if (source === 'camera' && !(await ImagePicker.requestCameraPermissionsAsync()).granted) return
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts)
    const a = res.assets?.[0]
    if (res.canceled || !a?.base64) return
    run({ mode: 'photo', content: `data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}` })
  }

  if (found) {
    const chosen = found.filter(d => !skip.has(d.id))
    return (
      <View style={{ flex: 1, backgroundColor: c.grouped }}>
        <NavHeader title={`${found.length} found`} />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 120 + insets.bottom }}>
          {found.map((d, i) => {
            const on = !skip.has(d.id)
            return (
              <Animated.View key={d.id} entering={rise(i)}>
                <Press scale={0.98} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                  onPress={() => setSkip(s => { const n = new Set(s); if (on) n.add(d.id); else n.delete(d.id); return n })}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md, backgroundColor: c.card, opacity: on ? 1 : 0.5 }}>
                  <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: subject(d.color).bar }} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <T v="headline">{d.title}</T>
                    <T v="footnote" color={c.ink2}>{[d.code, relativeDue(d.due), clockOf(d.due)].filter(Boolean).join(' · ')}</T>
                    {d.unsure && <T v="caption" color={c.warn} style={{ fontWeight: '700' }}>Check date</T>}
                  </View>
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: on ? c.green : c.fill, alignItems: 'center', justifyContent: 'center' }}>
                    {on && <Check size={15} color={c.onGreen} strokeWidth={3} />}
                  </View>
                </Press>
              </Animated.View>
            )
          })}
        </ScrollView>
        <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 16 }}>
          <Button title={`Add ${chosen.length}`} icon={Check} disabled={!chosen.length} onPress={async () => {
            await saveDeadlines(chosen.map(({ unsure: _u, ...d }) => d)); router.replace('/tasks')
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
          <T v="callout" color={c.ink2} center>Snap a syllabus or paste an announcement. Dormo pulls out every due date.</T>
        </Animated.View>
        <Segmented value={mode} onChange={setMode} options={[{ value: 'photo', label: 'Photo' }, { value: 'text', label: 'Paste' }]} />
        {busy ? (
          <Animated.View entering={fade()} style={{ alignItems: 'center', gap: 12, padding: 30 }}>
            <ActivityIndicator color={c.green} size="large" />
            <T v="headline" color={c.ink2}>Finding deadlines…</T>
          </Animated.View>
        ) : mode === 'photo' ? (
          <Animated.View key="p" entering={fade(0, 200)} style={{ gap: 10 }}>
            <Button title="Take photo" icon={Camera} onPress={() => pick('camera')} />
            <Button title="Choose image" icon={ImageUp} kind="secondary" onPress={() => pick('library')} />
          </Animated.View>
        ) : (
          <Animated.View key="t" entering={fade(0, 200)} style={{ gap: 12 }}>
            <Field value={text} onChangeText={setText} multiline placeholder={'Lab report due Friday 5pm\nMidterm Dec 4, 9:00'} />
            <Button title="Find deadlines" icon={Sparkles} disabled={!text.trim()} onPress={() => run({ mode: 'text', content: text })} />
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
