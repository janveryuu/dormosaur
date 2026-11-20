import { router, useLocalSearchParams } from 'expo-router'
import { Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ModalHeader } from '@/components/headers'
import { PickerField } from '@/components/time-field'
import { Button, Chip, Field, IconButton, T } from '@/components/ui'
import { color } from '@/design/tokens'
import { uid, type Deadline, type DeadlineType } from '@/lib/repo'
import { useApp } from '@/state/app'

const TYPES: DeadlineType[] = ['assignment', 'exam', 'quiz', 'project', 'other']
const pad = (n: number) => String(n).padStart(2, '0')

export default function TaskEditor() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { deadlines, classes, saveDeadline, removeDeadline } = useApp()
  const existing = deadlines.find(d => d.id === id)

  const initialDue = existing ? new Date(existing.due) : (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(23, 59, 0, 0); return d })()
  const [title, setTitle] = useState(existing?.title ?? '')
  const [type, setType] = useState<DeadlineType>(existing?.type ?? 'assignment')
  const [classId, setClassId] = useState(classes.find(c => c.code && c.code === existing?.code)?.id ?? '')
  const [date, setDate] = useState(`${initialDue.getFullYear()}-${pad(initialDue.getMonth() + 1)}-${pad(initialDue.getDate())}`)
  const [time, setTime] = useState(`${pad(initialDue.getHours())}:${pad(initialDue.getMinutes())}`)

  const due = new Date(`${date}T${time}:00`)
  const valid = title.trim() && /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(time) && !Number.isNaN(due.getTime())
  const cls = classes.find(c => c.id === classId)

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: color.card }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ModalHeader title={existing ? 'Edit task' : 'New task'}
        right={existing && <IconButton icon={Trash2} label="Delete task" tone="sunken" size={40} onPress={() => { removeDeadline(existing.id); router.back() }} />} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <Field label="Title" value={title} onChangeText={setTitle} placeholder="Lab report" autoFocus={!existing} />

        <View style={{ gap: 8 }}>
          <T v="label">Type</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TYPES.map(t => <Chip key={t} label={t[0].toUpperCase() + t.slice(1)} on={t === type} onPress={() => setType(t)} />)}
          </View>
        </View>

        {classes.length > 0 && (
          <View style={{ gap: 8 }}>
            <T v="label">Class</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip label="None" on={!classId} onPress={() => setClassId('')} />
              {classes.map(c => <Chip key={c.id} label={c.code || c.subject} on={c.id === classId} onPress={() => setClassId(c.id)} />)}
            </View>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1.3 }}><PickerField label="Date" mode="date" value={date} onChange={setDate} /></View>
          <View style={{ flex: 1 }}><PickerField label="Time" mode="time" value={time} onChange={setTime} /></View>
        </View>

        <Button title="Save" disabled={!valid} onPress={async () => {
          const next: Deadline = {
            id: existing?.id ?? uid(), title: title.trim(), type, due: due.toISOString(),
            code: cls?.code ?? existing?.code ?? '', color: cls?.color ?? existing?.color ?? 1, completed: existing?.completed ?? false,
          }
          await saveDeadline(next)
          router.back()
        }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
