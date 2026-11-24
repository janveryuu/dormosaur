import { Image } from 'expo-image'
import { Asset, requestPermissionsAsync } from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import { Download, Share as ShareIcon } from 'lucide-react-native'
import { useRef, useState, type ComponentRef } from 'react'
import { ActionSheetIOS, Alert, Dimensions, PixelRatio, Platform, ScrollView, Share, Switch, View, useWindowDimensions } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { captureRef } from 'react-native-view-shot'
import { fade } from '@/design/motion'
import { useTheme } from '@/design/theme'
import { WALLPAPER_THEMES } from '@/lib/wallpapers'
import { openPaywall } from '@/lib/pro'
import { ProPill, useMyPro } from '@/ui/pro-gate'
import { useApp } from '@/state/app'
import { Button, Group, NavHeader, Press, Row, Segmented, T, haptic } from '@/ui'
import { useNow } from '@/ui/blocks'
import { LockGuides, ScheduleCanvas, scheduleText, type CanvasLayout } from '@/ui/schedule-canvas'
import { Sym } from '@/ui/symbol'

/** The device's own screen, so the saved image fits this phone edge to edge. */
const screen = Dimensions.get('screen')
const ASPECT = Math.min(2.25, Math.max(1.9, screen.height / screen.width))
const OUT_W = Math.round(Math.min(1290, screen.width * PixelRatio.get()))

export default function Wallpaper() {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { classes } = useApp()
  const now = useNow()
  const [themeId, setThemeId] = useState(WALLPAPER_THEMES[0].id)
  const [layout, setLayout] = useState<CanvasLayout>('list')
  const [rooms, setRooms] = useState(true)
  const [guides, setGuides] = useState(true)
  const [busy, setBusy] = useState<'save' | 'share' | null>(null)
  const shot = useRef<ComponentRef<typeof View>>(null)
  const { isPro } = useMyPro()
  // Free: the first theme. Pro: every theme, no watermark.
  const theme = (isPro ? WALLPAPER_THEMES.find(t => t.id === themeId) : undefined) ?? WALLPAPER_THEMES[0]
  const hasClasses = classes.some(e => e.days.length)

  const w = Math.min(Math.round(width * 0.62), 272)
  const BAR = 56 + 24 + Math.max(insets.bottom, 12)

  const capture = () => captureRef(shot, { format: 'png', quality: 1, width: OUT_W, height: Math.round(OUT_W * ASPECT) })

  async function save() {
    setBusy('save')
    try {
      const perm = await requestPermissionsAsync(true)
      if (!perm.granted) throw new Error('Allow Photos access in Settings to save your wallpaper.')
      await Asset.create(await capture())
      haptic.success()
      Alert.alert('Saved to Photos', Platform.OS === 'ios'
        ? 'In Photos, open the image, tap Share, then Use as Wallpaper.'
        : 'Open it in Photos or Gallery and choose Set as wallpaper.')
    } catch (e) {
      Alert.alert('Couldn’t save', e instanceof Error ? e.message : 'Try again.')
    } finally {
      setBusy(null)
    }
  }

  async function shareImage() {
    setBusy('share')
    try {
      if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing isn’t available on this device.')
      await Sharing.shareAsync(await capture(), { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Share schedule' })
    } catch (e) {
      Alert.alert('Couldn’t share', e instanceof Error ? e.message : 'Try again.')
    } finally {
      setBusy(null)
    }
  }

  const shareText = () => Share.share({ message: scheduleText(classes) }).catch(() => {})

  function share() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Share Image', 'Share as Text', 'Cancel'], cancelButtonIndex: 2, title: 'Share your schedule' },
        i => { if (i === 0) shareImage(); if (i === 1) shareText() },
      )
    } else {
      Alert.alert('Share your schedule', undefined, [
        { text: 'Image', onPress: shareImage },
        { text: 'Text', onPress: shareText },
        { text: 'Cancel', style: 'cancel' },
      ])
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.grouped }}>
      <NavHeader title="Wallpaper" />
      <ScrollView contentContainerStyle={{ paddingBottom: BAR + 24, gap: 24 }} showsVerticalScrollIndicator={false}>
        {/* Preview */}
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <View style={{ padding: 5, borderRadius: 44 * (w / 272) + 5, backgroundColor: '#0B0B0C' }}>
            <View style={{ width: w, height: w * ASPECT, borderRadius: 44 * (w / 272), overflow: 'hidden' }}>
              <Animated.View key={`${themeId}-${layout}`} entering={fade(0, 220)}>
                <View ref={shot} collapsable={false}>
                  <ScheduleCanvas theme={theme} classes={classes} layout={layout} showRooms={rooms} width={w} aspect={ASPECT} watermark={!isPro} />
                </View>
              </Animated.View>
              {guides && <LockGuides theme={theme} width={w} aspect={ASPECT} now={now} />}
            </View>
          </View>
          <T v="footnote" color={c.ink3} center style={{ marginTop: 12, paddingHorizontal: 40 }}>
            {guides ? 'Clock and buttons are shown to check the fit. They aren’t saved.' : 'Exactly what gets saved.'}
          </T>
        </View>

        {/* Background */}
        <View style={{ gap: 8 }}>
          <T v="footnote" color={c.ink3} style={{ textTransform: 'uppercase', marginLeft: 36, fontWeight: '600' }}>Background</T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}>
            {WALLPAPER_THEMES.map((t, i) => {
              const on = t.id === theme.id
              const locked = !isPro && i > 0
              return (
                <Press key={t.id} onPress={() => { haptic.select(); if (locked) openPaywall('wallpaper'); else setThemeId(t.id) }} scale={0.94} accessibilityLabel={`${t.name} background`} accessibilityState={{ selected: on }} style={{ alignItems: 'center', gap: 6, width: 64 }}>
                  <View style={{ padding: 2.5, borderRadius: 14, borderWidth: 2, borderColor: on ? c.green : 'transparent' }}>
                    <View style={{ width: 52, height: 52 * ASPECT * 0.92, borderRadius: 10, overflow: 'hidden', backgroundColor: t.bg, borderWidth: 0.5, borderColor: c.line }}>
                      {t.image ? <Image source={t.image} style={{ position: 'absolute', inset: 0 }} contentFit="cover" /> : null}
                    </View>
                    {locked && <ProPill style={{ position: 'absolute', top: 6, right: 4 }} />}
                  </View>
                  <T v="caption" numberOfLines={1} color={on ? c.ink : c.ink2} style={{ fontWeight: on ? '700' : '500' }}>{t.name}</T>
                </Press>
              )
            })}
          </ScrollView>
        </View>

        {/* Layout & options */}
        <View style={{ paddingHorizontal: 20, gap: 24 }}>
          <View style={{ gap: 8 }}>
            <T v="footnote" color={c.ink3} style={{ textTransform: 'uppercase', marginLeft: 16, fontWeight: '600' }}>Layout</T>
            <Segmented<CanvasLayout> value={layout} onChange={setLayout} options={[{ value: 'list', label: 'List' }, { value: 'grid', label: 'Timetable' }]} />
          </View>
          <Group footer="The schedule sits between the Lock Screen clock and the flashlight and camera buttons, and resizes to fit your week.">
            <Row title="Show rooms" right={<Switch value={rooms} onValueChange={v => { haptic.select(); setRooms(v) }} trackColor={{ true: c.green }} accessibilityLabel="Show rooms" />} />
            <Row title="Lock Screen preview" last right={<Switch value={guides} onValueChange={v => { haptic.select(); setGuides(v) }} trackColor={{ true: c.green }} accessibilityLabel="Lock Screen preview" />} />
          </Group>
          <Group>
            <Row title="Share as text" onPress={shareText} last right={<Sym name="text.alignleft" fallback={ShareIcon} size={17} color={c.ink3} />} />
          </Group>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 12, paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 12), backgroundColor: c.grouped, borderTopWidth: 0.5, borderColor: c.line, flexDirection: 'row', gap: 12 }}>
        <Button title="Save to Photos" icon={Download} loading={busy === 'save'} disabled={!hasClasses || !!busy} onPress={save} style={{ flex: 1 }} />
        <Press onPress={share} disabled={!hasClasses || !!busy} accessibilityLabel="Share schedule" scale={0.9}
          style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: c.line }}>
          <Sym name="square.and.arrow.up" fallback={ShareIcon} size={21} color={c.green} weight="semibold" />
        </Press>
      </View>
    </View>
  )
}
