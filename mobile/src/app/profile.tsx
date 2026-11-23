import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/design/theme'
import { useApp } from '@/state/app'
import { Button, Field, NavHeader, T } from '@/ui'

/** Edit name, school and dorm. Opened from the account row in Settings. */
export default function Profile() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const { profile, saveProfile } = useApp()
  const [name, setName] = useState(profile?.name ?? '')
  const [school, setSchool] = useState(profile?.school ?? '')
  const [dorm, setDorm] = useState(profile?.dorm ?? '')
  const [saving, setSaving] = useState(false)
  const dirty = name !== (profile?.name ?? '') || school !== (profile?.school ?? '') || dorm !== (profile?.dorm ?? '')
  const valid = name.trim().length > 0

  const save = async () => {
    setSaving(true)
    try {
      const n = name.trim()
      const initials = n.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
      await saveProfile({ name: n, school: school.trim(), dorm: dorm.trim(), initials })
      router.back()
    } catch {
      Alert.alert('Not saved', 'We could not save your profile. Please try again.')
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.grouped }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NavHeader title="Profile" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
        <Field label="Name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" autoCapitalize="words" />
        <Field label="School" value={school} onChangeText={setSchool} autoComplete="organization" textContentType="organizationName" />
        <Field label="Dorm" value={dorm} onChangeText={setDorm} placeholder="Optional" />
        {!valid && <T v="footnote" color={c.danger}>Please enter your name.</T>}
        <Button title="Save changes" onPress={save} loading={saving} disabled={!dirty || !valid} style={{ marginTop: 8 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
