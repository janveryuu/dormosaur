import { router, useLocalSearchParams } from 'expo-router'
import { Check } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { radius, useTheme } from '@/design/theme'
import { DAYS, uid, type ClassEntry, type SubjectColor } from '@/lib/repo'
import { useApp } from '@/state/app'
import { Button, Field, Press, SheetHeader, T, haptic } from '@/ui'
import { PickerField } from '@/ui/picker-field'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

export default function ClassEditor() {
  const { c, subject } = useTheme()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { classes, saveClasses, removeClass } = useApp()
  const existing = classes.find(x => x.id === id)
  const [saving, setSaving] = useState(false)
  const [d, setD] = useState<ClassEntry>(existing ?? {
    id: uid(), subject: '', code: '', instructor: '', room: '', days: [], start: '08:00', end: '09:00', color: ((classes.length % 5) + 1) as SubjectColor,
  })
  const set = <K extends keyof ClassEntry>(k: K, v: ClassEntry[K]) => setD(p => ({ ...p, [k]: v }))
  const valid = !!d.subject.trim() && d.days.length > 0 && TIME.test(d.start) && TIME.test(d.end) && d.start < d.end
  const tone = subject(d.color)

  const save = async () => {
    if (saving || !valid) return
    setSaving(true)
    try {
      const ok = await saveClasses([{ ...d, subject: d.subject.trim(), confidence: 'high', lowFields: [] }])
      if (ok) router.back()
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.grouped }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SheetHeader title={existing ? 'Edit class' : 'New class'} action={saving ? 'Saving' : 'Save'} actionDisabled={!valid || saving} onAction={save} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        {/* Live preview */}
        <View style={{ flexDirection: 'row', gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: tone.bg }}>
          <View style={{ flex: 1, gap: 2 }}>
            <T v="title3" color={tone.ink} numberOfLines={1}>{d.code || d.subject || 'Your class'}</T>
            <T v="footnote" color={tone.ink}>{d.days.join(' ') || 'Pick days'} · {d.room || 'Room'}</T>
          </View>
        </View>

        <Field label="Subject" value={d.subject} onChangeText={v => set('subject', v)} placeholder="Calculus I" autoFocus={!existing} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><Field label="Code" value={d.code} onChangeText={v => set('code', v)} placeholder="MATH 101" autoCapitalize="characters" /></View>
          <View style={{ flex: 1 }}><Field label="Room" value={d.room} onChangeText={v => set('room', v)} placeholder="Sci 204" /></View>
        </View>
        <Field label="Instructor" value={d.instructor} onChangeText={v => set('instructor', v)} placeholder="Optional" />

        <View style={{ gap: 8 }}>
          <T v="footnote" color={c.ink2} style={{ fontWeight: '600', marginLeft: 4 }}>Days</T>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {DAYS.map(day => {
              const on = d.days.includes(day)
              return (
                <Press key={day} scale={0.88} accessibilityLabel={day} accessibilityState={{ selected: on }}
                  onPress={() => set('days', on ? d.days.filter(x => x !== day) : DAYS.filter(x => x === day || d.days.includes(x)))}
                  style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.green : c.fill }}>
                  <T v="footnote" color={on ? c.onGreen : c.ink2} style={{ fontWeight: '700' }}>{day.slice(0, 2)}</T>
                </Press>
              )
            })}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><PickerField label="Starts" mode="time" value={d.start} onChange={v => set('start', v)} /></View>
          <View style={{ flex: 1 }}><PickerField label="Ends" mode="time" value={d.end} onChange={v => set('end', v)} /></View>
        </View>

        <View style={{ gap: 8 }}>
          <T v="footnote" color={c.ink2} style={{ fontWeight: '600', marginLeft: 4 }}>Color</T>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {([1, 2, 3, 4, 5] as SubjectColor[]).map(n => {
              const t = subject(n)
              const on = d.color === n
              return (
                <Press key={n} scale={0.9} accessibilityLabel={`${t.name} color`} accessibilityState={{ selected: on }} onPress={() => { haptic.select(); set('color', n) }}
                  style={{ alignItems: 'center', gap: 6, width: 58 }}>
                  <View style={{ width: 50, height: 50, borderRadius: 25, padding: 3, borderWidth: 2, borderColor: on ? t.bar : 'transparent' }}>
                    <View style={{ flex: 1, borderRadius: 22, backgroundColor: t.bg, borderWidth: 1, borderColor: t.bar + '66', alignItems: 'center', justifyContent: 'center' }}>
                      {on && <Check size={18} color={t.ink} strokeWidth={2.6} />}
                    </View>
                  </View>
                  <T v="caption" color={on ? c.ink : c.ink2} style={{ fontWeight: on ? '700' : '500' }}>{t.name}</T>
                </Press>
              )
            })}
          </View>
        </View>

        {existing && (
          <Button title="Delete class" kind="danger" disabled={saving} style={{ marginTop: 8 }} onPress={() =>
            Alert.alert('Delete class?', d.subject, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => {
              if (saving) return
              setSaving(true)
              haptic.warn()
              const ok = await removeClass(d.id)
              setSaving(false)
              if (ok) router.back()
            } }])} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
