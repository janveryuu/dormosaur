import { router, useLocalSearchParams } from 'expo-router'
import { Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ModalHeader } from '@/components/headers'
import { PickerField } from '@/components/time-field'
import { Button, Field, IconButton, Press, T } from '@/components/ui'
import { color, radius, subject } from '@/design/tokens'
import { DAYS, uid, type ClassEntry, type SubjectColor } from '@/lib/repo'
import { useApp } from '@/state/app'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

export default function ClassEditor() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { classes, saveClasses, removeClass } = useApp()
  const existing = classes.find(c => c.id === id)
  const [draft, setDraft] = useState<ClassEntry>(existing ?? {
    id: uid(), subject: '', code: '', instructor: '', room: '', days: [], start: '08:00', end: '09:00', color: ((classes.length % 5) + 1) as SubjectColor,
  })
  const set = <K extends keyof ClassEntry>(k: K, v: ClassEntry[K]) => setDraft(d => ({ ...d, [k]: v }))
  const valid = draft.subject.trim() && draft.days.length && TIME.test(draft.start) && TIME.test(draft.end) && draft.start < draft.end

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: color.card }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ModalHeader title={existing ? 'Edit class' : 'New class'}
        right={existing && <IconButton icon={Trash2} label="Delete class" tone="sunken" size={40} onPress={() =>
          Alert.alert('Delete class?', draft.subject, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { removeClass(draft.id); router.back() } }])} />} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <Field label="Subject" value={draft.subject} onChangeText={v => set('subject', v)} placeholder="Calculus I" autoFocus={!existing} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><Field label="Code" value={draft.code} onChangeText={v => set('code', v)} placeholder="MATH 101" autoCapitalize="characters" /></View>
          <View style={{ flex: 1 }}><Field label="Room" value={draft.room} onChangeText={v => set('room', v)} placeholder="Sci 204" /></View>
        </View>
        <Field label="Instructor" value={draft.instructor} onChangeText={v => set('instructor', v)} placeholder="Optional" />

        <View style={{ gap: 8 }}>
          <T v="label">Days</T>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {DAYS.map(d => {
              const on = draft.days.includes(d)
              return (
                <Press key={d} haptic accessibilityLabel={d} accessibilityState={{ selected: on }}
                  onPress={() => set('days', on ? draft.days.filter(x => x !== d) : DAYS.filter(x => x === d || draft.days.includes(x)))}
                  style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? color.green : color.sunken }}>
                  <T v="strong" style={{ fontSize: 13, color: on ? color.white : color.inkSoft }}>{d.slice(0, 2)}</T>
                </Press>
              )
            })}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><PickerField label="Starts" mode="time" value={draft.start} onChange={v => set('start', v)} /></View>
          <View style={{ flex: 1 }}><PickerField label="Ends" mode="time" value={draft.end} onChange={v => set('end', v)} /></View>
        </View>

        <View style={{ gap: 8 }}>
          <T v="label">Color</T>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {([1, 2, 3, 4, 5] as SubjectColor[]).map(c => (
              <Press key={c} haptic accessibilityLabel={`Color ${c}`} onPress={() => set('color', c)}
                style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: subject[c].bg, borderWidth: draft.color === c ? 3 : 0, borderColor: subject[c].dot }} />
            ))}
          </View>
        </View>

        <Button title="Save" disabled={!valid} onPress={async () => {
          await saveClasses([{ ...draft, subject: draft.subject.trim(), confidence: 'high', lowFields: [] }])
          router.back()
        }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
