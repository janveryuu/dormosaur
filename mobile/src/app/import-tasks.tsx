import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { Camera, Check, ImageUp } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PageHeader } from '@/components/headers'
import { Button, Card, Field, Press, Segmented, T } from '@/components/ui'
import { color, radius, subject } from '@/design/tokens'
import { parseDeadlines } from '@/lib/api'
import { uid, type Deadline, type DeadlineType } from '@/lib/repo'
import { clockOf, relativeDue } from '@/lib/time'
import { useApp } from '@/state/app'

type Mode = 'photo' | 'text'
type Draft = Deadline & { unsure: boolean }
const TYPES: DeadlineType[] = ['exam', 'assignment', 'project', 'quiz', 'other']

export default function ImportTasks() {
  const insets = useSafeAreaInsets()
  const { classes, saveDeadlines } = useApp()
  const [mode, setMode] = useState<Mode>('photo')
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
        const cls = classes.find(c => c.code && d.code && c.code.replace(/\s/g, '').toLowerCase() === d.code.replace(/\s/g, '').toLowerCase())
        const fallback = new Date(); fallback.setDate(fallback.getDate() + 1)
        const date = d.dueDate || `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, '0')}-${String(fallback.getDate()).padStart(2, '0')}`
        const due = new Date(`${date}T${d.dueTime || '23:59'}:00`)
        return {
          id: uid(), title: d.title || 'Task', code: cls?.code ?? d.code ?? '',
          type: (TYPES.includes(d.type as DeadlineType) ? d.type : 'assignment') as DeadlineType,
          due: (Number.isNaN(due.getTime()) ? fallback : due).toISOString(),
          color: cls?.color ?? 1, completed: false,
          unsure: !d.dueDate || Boolean(d.lowFields?.length),
        }
      }))
      setSkip(new Set())
    } catch (e) {
      Alert.alert('Could not read tasks', e instanceof Error ? e.message : 'Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function pick(source: 'camera' | 'library') {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], base64: true, quality: 0.7 }
    if (source === 'camera' && !(await ImagePicker.requestCameraPermissionsAsync()).granted) return
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts)
    const asset = res.assets?.[0]
    if (res.canceled || !asset?.base64) return
    run({ mode: 'photo', content: `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` })
  }

  if (found) {
    const chosen = found.filter(d => !skip.has(d.id))
    return (
      <View style={{ flex: 1 }}>
        <PageHeader title={`${found.length} found`} />
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}>
          {found.map(d => {
            const on = !skip.has(d.id)
            const tone = subject[d.color]
            return (
              <Press key={d.id} haptic accessibilityState={{ checked: on }}
                onPress={() => setSkip(s => { const n = new Set(s); if (on) n.add(d.id); else n.delete(d.id); return n })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.lg, backgroundColor: color.card, opacity: on ? 1 : 0.55 }}>
                <View style={{ width: 6, alignSelf: 'stretch', borderRadius: 3, backgroundColor: tone.dot }} />
                <View style={{ flex: 1, gap: 3 }}>
                  <T v="strong">{d.title}</T>
                  <T v="meta">{[d.code, relativeDue(d.due), clockOf(d.due)].filter(Boolean).join(' · ')}</T>
                  {d.unsure && <T v="meta" style={{ color: color.coral }}>Check date</T>}
                </View>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: on ? color.green : color.sunken, alignItems: 'center', justifyContent: 'center' }}>
                  {on && <Check size={16} color={color.white} strokeWidth={3} />}
                </View>
              </Press>
            )
          })}
        </ScrollView>
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 16 }}>
          <Button title={`Add ${chosen.length}`} disabled={!chosen.length} onPress={async () => {
            await saveDeadlines(chosen.map(({ unsure: _unsure, ...d }) => d))
            router.replace('/tasks')
          }} />
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PageHeader title="Import tasks" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <Segmented<Mode> value={mode} onChange={setMode} options={[{ value: 'photo', label: 'Photo' }, { value: 'text', label: 'Paste' }]} />
        {mode === 'photo' ? (
          <Card style={{ alignItems: 'center', gap: 16, paddingVertical: 28 }}>
            <Image source={require('@/assets/mascots/dormosaur-thinking.png')} style={{ width: 150, height: 150 }} contentFit="contain" />
            <View style={{ alignSelf: 'stretch', gap: 10 }}>
              <Button title="Take photo" icon={Camera} loading={busy} onPress={() => pick('camera')} />
              <Button title="Choose image" icon={ImageUp} kind="secondary" disabled={busy} onPress={() => pick('library')} />
            </View>
          </Card>
        ) : (
          <Card style={{ gap: 16 }}>
            <Field label="Syllabus or announcement" value={text} onChangeText={setText} multiline placeholder={'Lab report due Friday 5pm\nMidterm Dec 4, 9:00'} />
            <Button title="Read" loading={busy} disabled={!text.trim()} onPress={() => run({ mode: 'text', content: text })} />
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
