import { Image } from 'expo-image'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Chip, Field, T } from '@/components/ui'
import { color } from '@/design/tokens'
import { useApp } from '@/state/app'

const YEARS = ['1st', '2nd', '3rd', '4th', '5th+']

export default function Onboarding() {
  const insets = useSafeAreaInsets()
  const { profile, saveProfile } = useApp()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(profile?.name ?? '')
  const [school, setSchool] = useState(profile?.school ?? '')
  const [year, setYear] = useState(profile?.year ?? '')
  const [dorm, setDorm] = useState<boolean>(profile?.is_dorm_student ?? true)
  const [busy, setBusy] = useState(false)

  const steps = [
    { image: require('@/assets/mascots/dormosaur-greeting.png'), title: "What's your name?", ok: !!name.trim(),
      body: <Field label="Name" value={name} onChangeText={setName} placeholder="Your first name" autoFocus /> },
    { image: require('@/assets/images/student-dormosaur.png'), title: 'Where do you study?', ok: !!school.trim(),
      body: (
        <View style={{ gap: 16 }}>
          <Field label="School" value={school} onChangeText={setSchool} placeholder="University" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {YEARS.map(y => <Chip key={y} label={`${y} year`} on={year === `${y} year`} onPress={() => setYear(`${y} year`)} />)}
          </View>
        </View>
      ) },
    { image: require('@/assets/mascots/dormosaur-comfy-time.png'), title: 'Living in a dorm?', ok: true,
      body: (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="Yes" on={dorm} onPress={() => setDorm(true)} />
          <Chip label="No" on={!dorm} onPress={() => setDorm(false)} />
        </View>
      ) },
  ]
  const s = steps[step]

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 24, paddingHorizontal: 24, paddingBottom: insets.bottom + 24, gap: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {steps.map((_, i) => <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i <= step ? color.green : color.line }} />)}
        </View>
        <Image source={s.image} style={{ width: 170, height: 170, alignSelf: 'center' }} contentFit="contain" />
        <T v="display" style={{ fontSize: 30 }}>{s.title}</T>
        {s.body}
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {step > 0 && <Button title="Back" kind="secondary" onPress={() => setStep(step - 1)} style={{ flex: 1 }} />}
          <Button style={{ flex: 2 }} title={step === steps.length - 1 ? 'Start' : 'Next'} disabled={!s.ok} loading={busy}
            onPress={async () => {
              if (step < steps.length - 1) return setStep(step + 1)
              setBusy(true)
              await saveProfile({ name: name.trim(), school: school.trim(), year, is_dorm_student: dorm, initials: name.trim()[0]?.toUpperCase() ?? '', onboarding_completed: true })
              setBusy(false)
            }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
