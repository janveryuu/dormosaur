import { Image } from 'expo-image'
import { Asset, requestPermissionsAsync } from 'expo-media-library'
import { Download } from 'lucide-react-native'
import { useRef, useState, type ComponentRef } from 'react'
import { Alert, ScrollView, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { captureRef } from 'react-native-view-shot'
import { PageHeader } from '@/components/headers'
import { Button, Chip, T } from '@/components/ui'
import { font, subject } from '@/design/tokens'
import { DAYS } from '@/lib/repo'
import { classesOn, formatTime } from '@/lib/time'
import { WALLPAPER_THEMES } from '@/lib/wallpapers'
import { useApp } from '@/state/app'

export default function Wallpaper() {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { classes } = useApp()
  const [themeId, setThemeId] = useState(WALLPAPER_THEMES[0].id)
  const [saving, setSaving] = useState(false)
  const shot = useRef<ComponentRef<typeof View>>(null)
  const theme = WALLPAPER_THEMES.find(t => t.id === themeId) ?? WALLPAPER_THEMES[0]

  const w = Math.min(width - 96, 300)
  const h = w * (19.5 / 9)
  const s = w / 300 // everything scales off a 300pt-wide canvas
  const days = DAYS.filter(d => classesOn(classes, d).length)
  const dense = days.length > 5

  async function save() {
    setSaving(true)
    try {
      const perm = await requestPermissionsAsync(true)
      if (!perm.granted) throw new Error('Allow photo access to save the wallpaper.')
      const uri = await captureRef(shot, { format: 'png', quality: 1, width: 1080, height: 2340 })
      await Asset.create(uri)
      Alert.alert('Saved to Photos')
    } catch (e) {
      Alert.alert('Not saved', e instanceof Error ? e.message : 'Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
      <PageHeader title="Wallpaper" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, marginTop: 12 }}>
        {WALLPAPER_THEMES.map(t => <Chip key={t.id} label={t.name} on={t.id === themeId} onPress={() => setThemeId(t.id)} />)}
      </ScrollView>

      <View style={{ alignItems: 'center', marginVertical: 20 }}>
        <View ref={shot} collapsable={false} style={{ width: w, height: h, borderRadius: 18 * s, overflow: 'hidden', backgroundColor: theme.bg }}>
          {theme.image && <Image source={theme.image} style={{ position: 'absolute', inset: 0 }} contentFit="cover" />}
          {/* Top ~32% stays clear for the lock-screen clock; the bottom keeps the artwork visible. */}
          <View style={{ position: 'absolute', top: h * 0.32, left: 14 * s, right: 14 * s, bottom: h * theme.artwork, gap: (dense ? 4 : 6) * s }}>
            {days.map(d => (
              <View key={d} style={{ flexDirection: 'row', gap: 8 * s, backgroundColor: theme.panel, borderColor: theme.border, borderWidth: 1, borderRadius: 9 * s, paddingHorizontal: 8 * s, paddingVertical: (dense ? 4 : 6) * s }}>
                <T style={{ width: 28 * s, fontFamily: font.black, fontSize: 10 * s, color: theme.accent, paddingTop: 1 * s }}>{d.toUpperCase()}</T>
                <View style={{ flex: 1, gap: 2 * s }}>
                  {classesOn(classes, d).map(c => (
                    <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 * s }}>
                      <View style={{ width: 5 * s, height: 5 * s, borderRadius: 3 * s, backgroundColor: subject[c.color].dot }} />
                      <T numberOfLines={1} style={{ flex: 1, fontFamily: font.bold, fontSize: 9.5 * s, color: theme.text }}>{c.subject}</T>
                      <T style={{ fontFamily: font.medium, fontSize: 8.5 * s, color: theme.text, opacity: 0.75 }}>{formatTime(c.start)}{c.room ? ` · ${c.room}` : ''}</T>
                    </View>
                  ))}
                </View>
              </View>
            ))}
            {!days.length && <T style={{ color: theme.text, textAlign: 'center', fontFamily: font.bold }}>No classes yet</T>}
          </View>
          {!theme.image && (
            <Image source={require('@/assets/images/student-dormosaur.png')} style={{ position: 'absolute', right: 10 * s, bottom: 12 * s, width: 50 * s, height: 54 * s }} contentFit="contain" />
          )}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <Button title="Save to Photos" icon={Download} loading={saving} disabled={!days.length} onPress={save} />
      </View>
    </ScrollView>
  )
}
