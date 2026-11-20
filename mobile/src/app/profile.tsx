import { router } from 'expo-router'
import { AlarmClock, ChevronRight, LogOut, MessageCircle, ScanLine, Smartphone, type LucideIcon } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PageHeader } from '@/components/headers'
import { Button, Card, Field, Press, T } from '@/components/ui'
import { color, font } from '@/design/tokens'
import { useApp } from '@/state/app'

export default function Profile() {
  const insets = useSafeAreaInsets()
  const { profile, session, classes, deadlines, saveProfile, signOut, demo } = useApp()
  const [name, setName] = useState(profile?.name ?? '')
  const [school, setSchool] = useState(profile?.school ?? '')
  const [dorm, setDorm] = useState(profile?.dorm ?? '')
  const dirty = name !== (profile?.name ?? '') || school !== (profile?.school ?? '') || dorm !== (profile?.dorm ?? '')

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
      <PageHeader title="Profile" />
      <View style={{ padding: 16, gap: 16 }}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: color.green, alignItems: 'center', justifyContent: 'center' }}>
            <T style={{ fontFamily: font.black, fontSize: 26, color: color.white }}>{(profile?.initials || name[0] || 'D').toUpperCase()}</T>
          </View>
          <View style={{ flex: 1 }}>
            <T v="heading" numberOfLines={1}>{profile?.name || 'Student'}</T>
            <T v="meta" numberOfLines={1}>{demo ? 'Preview mode' : session?.user.email}</T>
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat value={classes.length} label="Classes" />
          <Stat value={deadlines.filter(d => d.completed).length} label="Tasks done" />
        </View>

        <Card style={{ gap: 14 }}>
          <Field label="Name" value={name} onChangeText={setName} />
          <Field label="School" value={school} onChangeText={setSchool} />
          <Field label="Dorm" value={dorm} onChangeText={setDorm} placeholder="Optional" />
          {dirty && <Button title="Save" onPress={() => saveProfile({ name: name.trim(), school: school.trim(), dorm: dorm.trim(), initials: name.trim()[0]?.toUpperCase() ?? '' })} />}
        </Card>

        <Card pad={6}>
          <Row icon={AlarmClock} title="Alarms" onPress={() => router.push('/alarms')} />
          <Row icon={ScanLine} title="Scan schedule" onPress={() => router.push('/import')} divider />
          <Row icon={Smartphone} title="Wallpaper" onPress={() => router.push('/wallpaper')} divider />
          <Row icon={MessageCircle} title="Copilot" onPress={() => router.push('/copilot')} divider />
        </Card>

        {!demo && (
          <Button title="Sign out" kind="danger" icon={LogOut} onPress={() =>
            Alert.alert('Sign out?', undefined, [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: signOut }])} />
        )}
      </View>
    </ScrollView>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <Card style={{ flex: 1, gap: 2 }} pad={16}>
      <T style={{ fontFamily: font.black, fontSize: 28, lineHeight: 34, letterSpacing: -1, color: color.ink }}>{value}</T>
      <T v="meta">{label}</T>
    </Card>
  )
}

function Row({ icon: Icon, title, onPress, divider }: { icon: LucideIcon; title: string; onPress: () => void; divider?: boolean }) {
  return (
    <Press onPress={onPress} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderTopWidth: divider ? 1 : 0, borderColor: color.line }}>
      <Icon size={20} color={color.green} />
      <T v="strong" style={{ flex: 1 }}>{title}</T>
      <ChevronRight size={18} color={color.inkMute} />
    </Press>
  )
}
