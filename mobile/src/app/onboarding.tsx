import { Image } from 'expo-image'
import { ChevronLeft } from 'lucide-react-native'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { rise, springSoft } from '@/design/motion'
import { radius, useTheme } from '@/design/theme'
import { useApp } from '@/state/app'
import { Button, Field, IconButton, Press, T, haptic } from '@/ui'

const YEARS = ['1st year', '2nd year', '3rd year', '4th year', '5th+']

export default function Onboarding() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const { profile, saveProfile } = useApp()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(profile?.name ?? '')
  const [school, setSchool] = useState(profile?.school ?? '')
  const [year, setYear] = useState(profile?.year ?? '')
  const [dorm, setDorm] = useState<boolean>(profile?.is_dorm_student ?? true)
  const [busy, setBusy] = useState(false)

  const steps = [
    { image: require('@/assets/mascots/dormosaur-greeting.png'), title: "Hi! What's your name?", sub: 'Dormo likes to say hello properly.', ok: !!name.trim(),
      body: <Field value={name} onChangeText={setName} placeholder="Your first name" autoFocus returnKeyType="next" onSubmitEditing={() => name.trim() && setStep(1)} /> },
    { image: require('@/assets/images/student-dormosaur.png'), title: 'Where do you study?', sub: 'So your schedule feels like home.', ok: !!school.trim(),
      body: (
        <View style={{ gap: 14 }}>
          <Field value={school} onChangeText={setSchool} placeholder="University or college" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {YEARS.map(y => (
              <Press key={y} onPress={() => setYear(y)} scale={0.94}
                style={{ paddingHorizontal: 16, height: 40, borderRadius: radius.pill, justifyContent: 'center', backgroundColor: year === y ? c.green : c.fill }}>
                <T v="subhead" color={year === y ? c.onGreen : c.ink} style={{ fontWeight: '600' }}>{y}</T>
              </Press>
            ))}
          </View>
        </View>
      ) },
    { image: require('@/assets/mascots/dormosaur-comfy-time.png'), title: 'Living in a dorm?', sub: 'We tune the Kitchen to dorm appliances.', ok: true,
      body: (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {[{ v: true, l: 'Yes, dorm life', e: '🏠' }, { v: false, l: 'Nope', e: '🚶' }].map(o => (
            <Press key={o.l} onPress={() => setDorm(o.v)} style={{ flex: 1, padding: 18, gap: 8, borderRadius: radius.lg, backgroundColor: dorm === o.v ? c.green : c.fill }}>
              <T v="title2">{o.e}</T>
              <T v="headline" color={dorm === o.v ? c.onGreen : c.ink}>{o.l}</T>
            </Press>
          ))}
        </View>
      ) },
  ]
  const s = steps[step]
  const progress = useAnimatedStyle(() => ({ width: withSpring(`${((step + 1) / steps.length) * 100}%`, springSoft) }))

  async function next() {
    if (step < steps.length - 1) { haptic.select(); return setStep(step + 1) }
    setBusy(true)
    await saveProfile({ name: name.trim(), school: school.trim(), year, is_dorm_student: dorm, initials: name.trim()[0]?.toUpperCase() ?? '', onboarding_completed: true })
    haptic.success()
    setBusy(false)
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ opacity: step ? 1 : 0 }} pointerEvents={step ? 'auto' : 'none'}>
          <IconButton icon={ChevronLeft} label="Back" tone="clear" onPress={() => setStep(step - 1)} />
        </View>
        <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: c.fill, overflow: 'hidden' }}>
          <Animated.View style={[{ height: '100%', borderRadius: 3, backgroundColor: c.green }, progress]} />
        </View>
        <T v="subhead" color={c.ink3} style={{ fontWeight: '600' }}>{step + 1} of {steps.length}</T>
      </View>

      <ScrollView key={step} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: insets.bottom + 16, gap: 24 }} keyboardShouldPersistTaps="handled">
        <Animated.View entering={rise(0)} style={{ alignItems: 'center', marginTop: 20 }}>
          <Image source={s.image} style={{ width: 168, height: 168 }} contentFit="contain" />
        </Animated.View>
        <Animated.View entering={rise(1)} style={{ gap: 6 }}>
          <T v="title1" center>{s.title}</T>
          <T v="callout" color={c.ink2} center>{s.sub}</T>
        </Animated.View>
        <Animated.View entering={rise(2)}>{s.body}</Animated.View>
        <View style={{ flex: 1 }} />
        <Button title={step === steps.length - 1 ? "Let's go" : 'Continue'} disabled={!s.ok} loading={busy} onPress={next} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
