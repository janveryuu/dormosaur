import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/design/theme'
import { uid, type Deadline, type DeadlineType, type SubjectColor } from '@/lib/repo'
import { useApp } from '@/state/app'
import { Button, Chip, Field, SheetHeader, T, haptic } from '@/ui'
import { PickerField } from '@/ui/picker-field'

const TYPES: { v: DeadlineType; l: string }[] = [
  { v: 'assignment', l: '📚 Assignment' }, { v: 'exam', l: '📝 Exam' }, { v: 'quiz', l: '❓ Quiz' }, { v: 'project', l: '🧪 Project' }, { v: 'other', l: '📌 Other' },
]
const pad = (n: number) => String(n).padStart(2, '0')

export default function TaskEditor() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { deadlines, classes, saveDeadline, removeDeadline } = useApp()
  const existing = deadlines.find(x => x.id === id)
  const init = existing ? new Date(existing.due) : (() => { const t = new Date(); t.setDate(t.getDate() + 1); t.setHours(23, 59, 0, 0); return t })()
  const [title, setTitle] = useState(existing?.title ?? '')
  const [type, setType] = useState<DeadlineType>(existing?.type ?? 'assignment')
  const [code, setCode] = useState(existing?.code ?? '')
  const [date, setDate] = useState(`${init.getFullYear()}-${pad(init.getMonth() + 1)}-${pad(init.getDate())}`)
  const [time, setTime] = useState(`${pad(init.getHours())}:${pad(init.getMinutes())}`)
  const [saving, setSaving] = useState(false)
  const codes = [...new Set(classes.map(x => x.code || x.subject).filter(Boolean))]

  const save = async () => {
    if (saving || !title.trim()) return
    const due = new Date(`${date}T${time}:00`)
    if (!Number.isFinite(due.getTime())) {
      Alert.alert('Invalid due date', 'Choose a valid date and time.')
      return
    }
    setSaving(true)
    try {
      const cls = classes.find(x => (x.code || x.subject) === code)
      const t: Deadline = {
        id: existing?.id ?? uid(), title: title.trim(), code, type, due: due.toISOString(),
        color: (cls?.color ?? existing?.color ?? 1) as SubjectColor, completed: existing?.completed ?? false,
      }
      const ok = await saveDeadline(t)
      if (ok) router.back()
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.grouped }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SheetHeader title={existing ? 'Edit task' : 'New task'} action={saving ? 'Saving' : 'Save'} actionDisabled={!title.trim() || saving} onAction={save} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <Field label="Title" value={title} onChangeText={setTitle} placeholder="Lab report" autoFocus={!existing} />
        <View style={{ gap: 8 }}>
          <T v="footnote" color={c.ink2} style={{ fontWeight: '600', marginLeft: 4 }}>Type</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TYPES.map(t => <Chip key={t.v} label={t.l} on={type === t.v} onPress={() => setType(t.v)} />)}
          </View>
        </View>
        {codes.length > 0 && (
          <View style={{ gap: 8 }}>
            <T v="footnote" color={c.ink2} style={{ fontWeight: '600', marginLeft: 4 }}>Class</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip label="None" on={!code} onPress={() => setCode('')} />
              {codes.map(x => <Chip key={x} label={x} on={code === x} onPress={() => setCode(x)} />)}
            </View>
          </View>
        )}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><PickerField label="Due date" mode="date" value={date} onChange={setDate} /></View>
          <View style={{ flex: 1 }}><PickerField label="Time" mode="time" value={time} onChange={setTime} /></View>
        </View>
        {existing && (
          <Button title="Delete task" kind="danger" disabled={saving} style={{ marginTop: 8 }} onPress={() =>
            Alert.alert('Delete task?', existing.title, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => {
              if (saving) return
              setSaving(true)
              haptic.warn()
              const ok = await removeDeadline(existing.id)
              setSaving(false)
              if (ok) router.back()
            } }])} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
