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
import { parseSchedule } from '@/lib/api'
import { uid, type ClassEntry, type SubjectColor } from '@/lib/repo'
import { formatRange } from '@/lib/time'
import { useApp } from '@/state/app'

type Mode = 'photo' | 'text'

export default function Import() {
  const insets = useSafeAreaInsets()
  const { saveClasses, classes: existing } = useApp()
  const [mode, setMode] = useState<Mode>('photo')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [found, setFound] = useState<ClassEntry[] | null>(null)
  const [skip, setSkip] = useState<Set<string>>(new Set())

  async function run(input: { text: string } | { image: string }) {
    setBusy(true)
    try {
      const parsed = await parseSchedule(input)
      if (!parsed.length) throw new Error('No classes found.')
      setFound(parsed.map((c, i) => ({
        ...c, id: uid(), code: c.code ?? '', instructor: c.instructor ?? '', room: c.room ?? '',
        color: (((existing.length + i) % 5) + 1) as SubjectColor,
      })))
      setSkip(new Set())
    } catch (e) {
      Alert.alert('Could not read schedule', e instanceof Error ? e.message : 'Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function pick(source: 'camera' | 'library') {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], base64: true, quality: 0.7 }
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync()
      if (!perm.granted) return
    }
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts)
    const asset = res.assets?.[0]
    if (res.canceled || !asset?.base64) return
    run({ image: `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` })
  }

  if (found) {
    const chosen = found.filter(c => !skip.has(c.id))
    return (
      <View style={{ flex: 1 }}>
        <PageHeader title={`${found.length} found`} />
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}>
          {found.map(c => {
            const on = !skip.has(c.id)
            const tone = subject[c.color]
            return (
              <Press key={c.id} haptic onPress={() => setSkip(s => { const n = new Set(s); if (on) n.add(c.id); else n.delete(c.id); return n })}
                accessibilityState={{ checked: on }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.lg, backgroundColor: on ? tone.bg : color.card, opacity: on ? 1 : 0.6 }}>
                <View style={{ flex: 1, gap: 3 }}>
                  <T v="heading" style={{ color: tone.ink, fontSize: 16 }}>{c.subject}</T>
                  <T v="meta" style={{ color: tone.ink }}>{c.days.join(' ')} · {formatRange(c.start, c.end)}</T>
                  {(c.room || c.lowFields?.length) ? <T v="meta" style={{ color: tone.ink, opacity: 0.8 }}>{[c.room, c.lowFields?.length ? 'Check details' : ''].filter(Boolean).join(' · ')}</T> : null}
                </View>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: on ? tone.dot : color.sunken, alignItems: 'center', justifyContent: 'center' }}>
                  {on && <Check size={16} color={color.white} strokeWidth={3} />}
                </View>
              </Press>
            )
          })}
        </ScrollView>
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 16, gap: 8 }}>
          <Button title={`Add ${chosen.length}`} disabled={!chosen.length} onPress={async () => { await saveClasses(chosen); router.replace('/schedule') }} />
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PageHeader title="Scan schedule" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <Segmented<Mode> value={mode} onChange={setMode} options={[{ value: 'photo', label: 'Photo' }, { value: 'text', label: 'Paste' }]} />
        {mode === 'photo' ? (
          <Card style={{ alignItems: 'center', gap: 16, paddingVertical: 28 }}>
            <Image source={require('@/assets/images/student-dormosaur.png')} style={{ width: 150, height: 160 }} contentFit="contain" />
            <View style={{ alignSelf: 'stretch', gap: 10 }}>
              <Button title="Take photo" icon={Camera} loading={busy} onPress={() => pick('camera')} />
              <Button title="Choose image" icon={ImageUp} kind="secondary" disabled={busy} onPress={() => pick('library')} />
            </View>
          </Card>
        ) : (
          <Card style={{ gap: 16 }}>
            <Field label="Schedule text" value={text} onChangeText={setText} multiline placeholder={'MATH101 MWF 8:30-9:50 Sci 204\nCHEM120 TTh 1-2:30 Lab B'} />
            <Button title="Read" loading={busy} disabled={!text.trim()} onPress={() => run({ text })} />
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
