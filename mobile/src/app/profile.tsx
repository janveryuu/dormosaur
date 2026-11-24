import * as ImagePicker from 'expo-image-picker'
import { router, useNavigation, usePreventRemove } from 'expo-router'
import { Camera, Check, ChevronRight, Home, Image as ImageIcon, School as SchoolIcon, Trash2, TrainFront, type LucideIcon } from 'lucide-react-native'
import { useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fade, rise } from '@/design/motion'
import { elevation, radius, useTheme } from '@/design/theme'
import { avatar, useAvatar } from '@/lib/avatar'
import { YEARS } from '@/lib/schools'
import { useApp } from '@/state/app'
import { Button, Field, NavHeader, Press, T, haptic } from '@/ui'
import { Avatar, initialsOf } from '@/ui/avatar'
import { SchoolSearch } from '@/ui/school-search'

const NAME_MAX = 40
// Letters (any language), spaces, apostrophes, hyphens and periods: "O'Brien", "Dela Cruz-Santos", "Ma. Clara".
const NAME_OK = /^[\p{L}\p{M}][\p{L}\p{M} '’.-]*$/u
const tidy = (s: string) => s.replace(/\s+/g, ' ').trim()

/** Edit photo, name, school, year level and dorm. Opened from the You tab. */
export default function Profile() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { profile, saveProfile, session, demo } = useApp()
  const userId = session?.user.id ?? (demo ? 'demo' : undefined)
  const photo = useAvatar(userId, demo)

  const initial = {
    name: profile?.name ?? '',
    school: profile?.school ?? '',
    year: profile?.year ?? '',
    isDorm: profile?.is_dorm_student ?? true,
    dorm: profile?.dorm ?? '',
  }
  const [name, setName] = useState(initial.name)
  const [school, setSchool] = useState(initial.school)
  const [year, setYear] = useState(initial.year)
  const [isDorm, setIsDorm] = useState(initial.isDorm)
  const [dorm, setDorm] = useState(initial.dorm)
  const [schoolOpen, setSchoolOpen] = useState(false)
  const [photoOpen, setPhotoOpen] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const cleanName = tidy(name)
  const nameError = !cleanName ? 'Please enter your name.' : !NAME_OK.test(cleanName) ? 'Use letters only. Apostrophes and hyphens are fine.' : ''
  const dirty = cleanName !== tidy(initial.name) || school !== initial.school || year !== initial.year || isDorm !== initial.isDorm || (isDorm && tidy(dorm) !== tidy(initial.dorm))

  // Ask before throwing away unsaved edits (back button, swipe or Android back).
  const [allowLeave, setAllowLeave] = useState(false)
  usePreventRemove(dirty && !allowLeave, ({ data }) => {
    Alert.alert('Discard changes?', 'Your edits to your profile have not been saved.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => { setAllowLeave(true); navigation.dispatch(data.action) } },
    ])
  })

  const save = async () => {
    if (saving || nameError) return
    setSaving(true)
    try {
      await saveProfile({
        name: cleanName, initials: initialsOf(cleanName), school: tidy(school), year,
        is_dorm_student: isDorm, dorm: isDorm ? tidy(dorm) : '',
      })
      haptic.success()
      setSaved(true)
      setAllowLeave(true)
      setTimeout(() => router.back(), 550)
    } catch {
      Alert.alert('Not saved', 'We could not save your profile. Check your connection and try again.')
      setSaving(false)
    }
  }

  const pickPhoto = async (source: 'camera' | 'library') => {
    setPhotoOpen(false)
    if (!userId) return
    try {
      const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) {
        Alert.alert(source === 'camera' ? 'Camera access needed' : 'Photo access needed', 'Allow access in your phone settings to set a profile picture.')
        return
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.9 }
      const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts)
      const asset = res.canceled ? null : res.assets[0]
      if (!asset) return
      setPhotoBusy(true)
      await avatar.save(userId, asset, demo)
      haptic.success()
    } catch (e) {
      Alert.alert('Photo not saved', e instanceof Error && e.message ? e.message : 'Please try again in a moment.')
    } finally {
      setPhotoBusy(false)
    }
  }

  const removePhoto = async () => {
    setPhotoOpen(false)
    if (!userId) return
    setPhotoBusy(true)
    try { await avatar.remove(userId, demo); haptic.success() }
    catch { Alert.alert('Not removed', 'We could not remove your photo. Please try again.') }
    finally { setPhotoBusy(false) }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.grouped }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NavHeader title="Profile" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
        {/* Photo */}
        <Animated.View entering={rise(0)} style={{ alignItems: 'center', gap: 10 }}>
          <Press onPress={() => setPhotoOpen(true)} disabled={photoBusy} scale={0.95} accessibilityLabel="Change profile picture">
            <View style={[{ borderRadius: 64, padding: 4, backgroundColor: c.card }, elevation(c, 2)]}>
              <Avatar size={112} />
              {photoBusy && (
                <View style={{ position: 'absolute', inset: 4, borderRadius: 56, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </View>
            <View style={[{ position: 'absolute', right: 2, bottom: 2, width: 36, height: 36, borderRadius: 18, backgroundColor: c.green, borderWidth: 3, borderColor: c.grouped, alignItems: 'center', justifyContent: 'center' }]}>
              <Camera size={16} color={c.onGreen} strokeWidth={2.4} />
            </View>
          </Press>
          <Pressable onPress={() => setPhotoOpen(true)} disabled={photoBusy} hitSlop={8} accessibilityRole="button">
            <T v="subhead" color={c.green} style={{ fontWeight: '700' }}>{photo ? 'Change photo' : 'Add a photo'}</T>
          </Pressable>
        </Animated.View>

        {/* Name */}
        <Animated.View entering={rise(1)} style={{ gap: 6 }}>
          <Field label="Name" value={name} onChangeText={t => setName(t.slice(0, NAME_MAX))} maxLength={NAME_MAX} placeholder="Your name"
            autoComplete="name" textContentType="name" autoCapitalize="words" autoCorrect={false} returnKeyType="done" />
          {!!name && !!nameError && <T v="footnote" color={c.danger} style={{ marginLeft: 4 }}>{nameError}</T>}
        </Animated.View>

        {/* School */}
        <Animated.View entering={rise(2)} style={{ gap: 6 }}>
          <Label>School</Label>
          <Press onPress={() => setSchoolOpen(true)} scale={0.98} accessibilityLabel={school ? `School: ${school}. Tap to change` : 'Choose your school'}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md, backgroundColor: c.fill }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
              <SchoolIcon size={18} color={c.green} />
            </View>
            <T v="body" color={school ? c.ink : c.ink3} numberOfLines={2} style={{ flex: 1, fontWeight: school ? '600' : '400' }}>{school || 'Choose your school'}</T>
            <ChevronRight size={18} color={c.ink3} />
          </Press>
        </Animated.View>

        {/* Year */}
        <Animated.View entering={rise(3)} style={{ gap: 8 }}>
          <Label>Year level</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {YEARS.map(y => {
              const on = year === y
              return (
                <Press key={y} onPress={() => { haptic.select(); setYear(on ? '' : y) }} scale={0.94} accessibilityState={{ selected: on }} accessibilityLabel={y}
                  style={{ paddingHorizontal: 16, height: 42, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: on ? c.green : c.fill }}>
                  {on && <Check size={15} color={c.onGreen} strokeWidth={3} />}
                  <T v="subhead" color={on ? c.onGreen : c.ink} style={{ fontWeight: '600' }}>{y}</T>
                </Press>
              )
            })}
          </View>
        </Animated.View>

        {/* Dorm */}
        <Animated.View entering={rise(4)} style={{ gap: 8 }}>
          <Label>Where do you stay?</Label>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Choice icon={Home} title="Dorm life" sub="I live in a dorm" on={isDorm} onPress={() => setIsDorm(true)} />
            <Choice icon={TrainFront} title="Commuter" sub="I travel to school" on={!isDorm} onPress={() => setIsDorm(false)} />
          </View>
          {isDorm && (
            <Animated.View entering={fade(0, 200)} style={{ marginTop: 6 }}>
              <Field label="Dorm name (optional)" value={dorm} onChangeText={setDorm} maxLength={60} placeholder="e.g. Rizal Hall, Room 204" autoCapitalize="words" />
            </Animated.View>
          )}
        </Animated.View>

        <Button title={saved ? 'Saved' : 'Save changes'} icon={saved ? Check : undefined} onPress={save} loading={saving && !saved}
          disabled={saving || saved || !dirty || !!nameError} style={{ marginTop: 4 }} />
      </ScrollView>

      {/* School picker */}
      <Modal visible={schoolOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSchoolOpen(false)}>
        <SchoolSheet current={school} onClose={() => setSchoolOpen(false)} onPick={n => { haptic.select(); setSchool(n); setSchoolOpen(false) }} />
      </Modal>

      {/* Photo options */}
      <Modal visible={photoOpen} transparent animationType="fade" onRequestClose={() => setPhotoOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }} onPress={() => setPhotoOpen(false)} accessibilityLabel="Close">
          <Pressable style={{ backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 12, paddingBottom: insets.bottom + 12, gap: 4 }}>
            <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: c.fillStrong, marginBottom: 8 }} />
            <SheetItem icon={Camera} title="Take a photo" onPress={() => pickPhoto('camera')} />
            <SheetItem icon={ImageIcon} title="Choose from library" onPress={() => pickPhoto('library')} />
            {photo && <SheetItem icon={Trash2} title="Remove photo" destructive onPress={removePhoto} />}
            <Press onPress={() => setPhotoOpen(false)} scale={0.98} style={{ height: 52, borderRadius: radius.md, backgroundColor: c.fill, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
              <T v="headline">Cancel</T>
            </Press>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  )
}

function SchoolSheet({ current, onPick, onClose }: { current: string; onPick: (name: string) => void; onClose: () => void }) {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState('')
  return (
    <View style={{ flex: 1, backgroundColor: c.grouped }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 20 : insets.top + 12, paddingBottom: 12 }}>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button"><T v="body" color={c.green}>Cancel</T></Pressable>
        <T v="headline" center style={{ flex: 1 }}>Choose school</T>
        <View style={{ width: 50 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        {!!current && !query && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 12, borderRadius: radius.md, backgroundColor: c.greenSoft }}>
            <Check size={18} color={c.green} strokeWidth={3} />
            <T v="callout" numberOfLines={2} style={{ flex: 1, fontWeight: '600' }}>{current}</T>
          </View>
        )}
        <SchoolSearch query={query} setQuery={setQuery} onPick={onPick} />
      </ScrollView>
    </View>
  )
}

function Choice({ icon: Icon, title, sub, on, onPress }: { icon: LucideIcon; title: string; sub: string; on: boolean; onPress: () => void }) {
  const { c } = useTheme()
  return (
    <Press onPress={() => { haptic.select(); onPress() }} scale={0.96} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={title}
      style={{ flex: 1, padding: 14, gap: 8, borderRadius: radius.lg, backgroundColor: on ? c.greenSoft : c.fill, borderWidth: 1.5, borderColor: on ? c.green : 'transparent' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Icon size={22} color={on ? c.green : c.ink2} />
        <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: on ? c.green : c.ink3, backgroundColor: on ? c.green : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {on && <Check size={12} color={c.onGreen} strokeWidth={3.5} />}
        </View>
      </View>
      <View>
        <T v="callout" style={{ fontWeight: '700' }}>{title}</T>
        <T v="footnote" color={c.ink2}>{sub}</T>
      </View>
    </Press>
  )
}

function SheetItem({ icon: Icon, title, onPress, destructive }: { icon: LucideIcon; title: string; onPress: () => void; destructive?: boolean }) {
  const { c } = useTheme()
  return (
    <Press onPress={onPress} scale={0.98} accessibilityLabel={title}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, height: 56, paddingHorizontal: 12, borderRadius: radius.md }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: destructive ? c.dangerSoft : c.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={destructive ? c.danger : c.green} />
      </View>
      <T v="body" color={destructive ? c.danger : c.ink} style={{ fontWeight: '600' }}>{title}</T>
    </Press>
  )
}

function Label({ children }: { children: string }) {
  const { c } = useTheme()
  return <T v="footnote" color={c.ink2} style={{ fontWeight: '600', marginLeft: 4 }}>{children}</T>
}
