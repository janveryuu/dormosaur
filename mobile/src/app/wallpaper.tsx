import { Image } from 'expo-image'
import { Asset, requestPermissionsAsync } from 'expo-media-library'
import { Download } from 'lucide-react-native'
import { useRef, useState, type ComponentRef } from 'react'
import { Alert, ScrollView, View, useWindowDimensions } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { captureRef } from 'react-native-view-shot'
import { fade } from '@/design/motion'
import { radius, useTheme } from '@/design/theme'
import { DAYS } from '@/lib/repo'
import { classesOn, formatTime } from '@/lib/time'
import { WALLPAPER_THEMES } from '@/lib/wallpapers'
import { useApp } from '@/state/app'
import { Button, NavHeader, Press, T, haptic } from '@/ui'

export default function Wallpaper() {
  const { c, subject } = useTheme()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { classes } = useApp()
  const [themeId, setThemeId] = useState(WALLPAPER_THEMES[0].id)
  const [saving, setSaving] = useState(false)
  const shot = useRef<ComponentRef<typeof View>>(null)
  const theme = WALLPAPER_THEMES.find(t => t.id === themeId) ?? WALLPAPER_THEMES[0]

  const w = Math.min(width - 110, 280)
  const h = w * (19.5 / 9)
  const s = w / 300
  const days = DAYS.filter(d => classesOn(classes, d).length)
  const dense = days.length > 5

  async function save() {
    setSaving(true)
    try {
      const perm = await requestPermissionsAsync(true)
      if (!perm.granted) throw new Error('Allow photo access to save the wallpaper.')
      const uri = await captureRef(shot, { format: 'png', quality: 1, width: 1080, height: 2340 })
      await Asset.create(uri)
      haptic.success()
      Alert.alert('Saved to Photos', 'Open Photos → Share → Use as Wallpaper.')
    } catch (e) {
      Alert.alert('Not saved', e instanceof Error ? e.message : 'Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.grouped }}>
      <NavHeader title="Schedule wallpaper" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20, paddingVertical: 8 }}>
          {WALLPAPER_THEMES.map(t => (
            <Press key={t.id} onPress={() => { haptic.select(); setThemeId(t.id) }} scale={0.9} accessibilityLabel={t.name} accessibilityState={{ selected: t.id === themeId }} style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ width: 54, height: 74, borderRadius: 12, overflow: 'hidden', backgroundColor: t.bg, borderWidth: 2.5, borderColor: t.id === themeId ? c.green : 'transparent' }}>
                {t.image && <Image source={t.image} style={{ position: 'absolute', inset: 0 }} contentFit="cover" />}
              </View>
              <T v="caption" color={t.id === themeId ? c.green : c.ink2} style={{ fontWeight: '600' }}>{t.name}</T>
            </Press>
          ))}
        </ScrollView>

        <Animated.View key={themeId} entering={fade(0, 260)} style={{ alignItems: 'center', marginVertical: 20 }}>
          <View style={{ padding: 6, borderRadius: radius.xl + 6, backgroundColor: '#0B0B0C' }}>
            <View ref={shot} collapsable={false} style={{ width: w, height: h, borderRadius: 26 * s, overflow: 'hidden', backgroundColor: theme.bg }}>
              {theme.image && <Image source={theme.image} style={{ position: 'absolute', inset: 0 }} contentFit="cover" />}
              <View style={{ position: 'absolute', top: h * 0.32, left: 14 * s, right: 14 * s, bottom: h * theme.artwork, gap: (dense ? 4 : 6) * s }}>
                {days.map(d => (
                  <View key={d} style={{ flexDirection: 'row', gap: 8 * s, backgroundColor: theme.panel, borderColor: theme.border, borderWidth: 1, borderRadius: 10 * s, paddingHorizontal: 8 * s, paddingVertical: (dense ? 4 : 6) * s }}>
                    <T style={{ width: 28 * s, fontWeight: '900', fontSize: 10 * s, color: theme.accent, paddingTop: 1 * s }}>{d.toUpperCase()}</T>
                    <View style={{ flex: 1, gap: 2 * s }}>
                      {classesOn(classes, d).map(e => (
                        <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 * s }}>
                          <View style={{ width: 5 * s, height: 5 * s, borderRadius: 3 * s, backgroundColor: subject(e.color).bar }} />
                          <T numberOfLines={1} style={{ flex: 1, fontWeight: '700', fontSize: 9.5 * s, color: theme.text }}>{e.code || e.subject}</T>
                          <T style={{ fontWeight: '500', fontSize: 8.5 * s, color: theme.text, opacity: 0.75 }}>{formatTime(e.start)}{e.room ? ` · ${e.room}` : ''}</T>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
                {!days.length && <T style={{ color: theme.text, textAlign: 'center', fontWeight: '700' }}>No classes yet</T>}
              </View>
              {!theme.image && <Image source={require('@/assets/images/student-dormosaur.png')} style={{ position: 'absolute', right: 10 * s, bottom: 12 * s, width: 50 * s, height: 54 * s }} contentFit="contain" />}
            </View>
          </View>
        </Animated.View>

        <View style={{ paddingHorizontal: 20 }}>
          <Button title="Save to Photos" icon={Download} loading={saving} disabled={!days.length} onPress={save} />
        </View>
      </ScrollView>
    </View>
  )
}
