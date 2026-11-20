import { router } from 'expo-router'
import { AlarmClock, Image as ImageIcon, LogOut, MessageCircle, ScanLine, Smartphone } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { rise } from '@/design/motion'
import { radius, useTheme, type ThemePref } from '@/design/theme'
import { useApp } from '@/state/app'
import { Button, Field, Group, NavHeader, Row, Segmented, T } from '@/ui'

export default function Settings() {
  const { c, pref, setPref } = useTheme()
  const insets = useSafeAreaInsets()
  const { profile, session, classes, deadlines, saveProfile, signOut, demo } = useApp()
  const [name, setName] = useState(profile?.name ?? '')
  const [school, setSchool] = useState(profile?.school ?? '')
  const [dorm, setDorm] = useState(profile?.dorm ?? '')
  const dirty = name !== (profile?.name ?? '') || school !== (profile?.school ?? '') || dorm !== (profile?.dorm ?? '')

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.grouped }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NavHeader title="Settings" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 26, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
        <Animated.View entering={rise(0)} style={{ alignItems: 'center', gap: 10 }}>
          <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center' }}>
            <T v="title1" color={c.onGreen}>{(profile?.initials || name[0] || 'D').toUpperCase()}</T>
          </View>
          <View style={{ alignItems: 'center' }}>
            <T v="title2">{profile?.name || 'Student'}</T>
            <T v="subhead" color={c.ink2}>{demo ? 'Preview mode' : session?.user.email}</T>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            {[[classes.length, 'Classes'], [deadlines.filter(d => d.completed).length, 'Tasks done']].map(([n, l]) => (
              <View key={l} style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.md, backgroundColor: c.card, alignItems: 'center' }}>
                <T v="title3">{n}</T><T v="caption" color={c.ink2}>{l}</T>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={rise(1)} style={{ gap: 8 }}>
          <T v="footnote" color={c.ink3} style={{ textTransform: 'uppercase', marginLeft: 16, fontWeight: '600' }}>Appearance</T>
          <Segmented<ThemePref> value={pref} onChange={setPref} options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
        </Animated.View>

        <Animated.View entering={rise(2)}>
          <Group title="Tools">
            <Row icon={ScanLine} title="Schedule scanner" onPress={() => router.push('/scan')} />
            <Row icon={AlarmClock} iconBg="#F08A24" title="Class alarms" onPress={() => router.push('/alarms')} />
            <Row icon={Smartphone} iconBg="#3B82F6" title="Home & Lock Screen" onPress={() => router.push('/widgets')} />
            <Row icon={ImageIcon} iconBg="#8B5CF6" title="Schedule wallpaper" onPress={() => router.push('/wallpaper')} />
            <Row icon={MessageCircle} iconBg="#E0457B" title="Copilot" onPress={() => router.push('/copilot')} last />
          </Group>
        </Animated.View>

        <Animated.View entering={rise(3)} style={{ gap: 14 }}>
          <T v="footnote" color={c.ink3} style={{ textTransform: 'uppercase', marginLeft: 16, fontWeight: '600' }}>Profile</T>
          <Field label="Name" value={name} onChangeText={setName} />
          <Field label="School" value={school} onChangeText={setSchool} />
          <Field label="Dorm" value={dorm} onChangeText={setDorm} placeholder="Optional" />
          {dirty && <Button title="Save changes" onPress={() => saveProfile({ name: name.trim(), school: school.trim(), dorm: dorm.trim(), initials: name.trim()[0]?.toUpperCase() ?? '' })} />}
        </Animated.View>

        {!demo && (
          <Button title="Sign out" kind="danger" icon={LogOut} onPress={() =>
            Alert.alert('Sign out?', undefined, [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: signOut }])} />
        )}
        <T v="caption" color={c.ink3} center>Dormosaur · Offline-first · Zero ads · Private by design</T>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
