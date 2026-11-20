import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ShieldCheck } from 'lucide-react-native'
import { useEffect } from 'react'
import { Pressable, View } from 'react-native'
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fade, rise } from '@/design/motion'
import { Press, T, haptic } from '@/ui'

const MIST = 'rgba(255,255,255,0.74)'
const BTN = '#4E8B5F'

/** First screen for signed-out users. */
export default function Welcome() {
  const insets = useSafeAreaInsets()
  const float = useSharedValue(0)

  useEffect(() => {
    float.set(withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.System }), -1, true))
  }, [float])

  const bob = useAnimatedStyle(() => ({ transform: [{ translateY: -12 * float.get() }, { rotate: `${-2 + 4 * float.get()}deg` }] }))
  const shadow = useAnimatedStyle(() => ({ transform: [{ scaleX: 1 - 0.18 * float.get() }], opacity: 0.35 - 0.15 * float.get() }))

  return (
    <View style={{ flex: 1, backgroundColor: '#0C1A12' }}>
      <StatusBar style="light" />
      <Image source={require('@/assets/images/welcome-bg.png')} style={{ position: 'absolute', inset: 0 }} contentFit="cover" />
      <LinearGradient
        colors={['rgba(12,26,18,0.05)', 'rgba(12,26,18,0.2)', 'rgba(12,26,18,0.9)', '#0C1A12']}
        locations={[0, 0.42, 0.66, 1]}
        style={{ position: 'absolute', inset: 0 }}
      />

      <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 28, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 14 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View entering={fade(100, 700)} style={bob}>
            <Image source={require('@/assets/mascots/dormo-jumping.png')} style={{ width: 270, height: 325 }} contentFit="contain" accessibilityLabel="Dormo the dinosaur jumping" />
          </Animated.View>
          <Animated.View style={[{ width: 150, height: 16, borderRadius: 80, backgroundColor: '#000', marginTop: -6 }, shadow]} />
        </View>

        <Animated.View entering={rise(2)} style={{ alignItems: 'center', gap: 10 }}>
          <T v="largeTitle" color="#fff" accessibilityRole="header" style={{ fontSize: 36, letterSpacing: -1 }}>Dormosaur</T>
          <T v="callout" color={MIST} center style={{ maxWidth: 320, lineHeight: 23 }}>
            Dorm life, decoded. Paste your schedule, sync class alarms, and eat well on a dorm budget.
          </T>
        </Animated.View>

        <Animated.View entering={rise(4)} style={{ marginTop: 30, gap: 4 }}>
          <Press onPress={() => router.push('/sign-up')} accessibilityLabel="Let's get started"
            style={{ height: 56, borderRadius: 999, backgroundColor: BTN, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' }}>
            <T v="headline" color="#fff" style={{ fontWeight: '700' }}>Let&apos;s get started!</T>
          </Press>
          <Pressable onPress={() => { haptic.select(); router.push('/sign-in') }} accessibilityRole="link" hitSlop={6}
            style={{ alignSelf: 'center', flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16 }}>
            <T v="subhead" color={MIST}>Already have an account? </T>
            <T v="subhead" color="#fff" style={{ fontWeight: '700', textDecorationLine: 'underline' }}>Log in</T>
          </Pressable>
        </Animated.View>

        <Animated.View entering={fade(650)} style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 }}>
          <ShieldCheck size={13} color="#7FD1A0" strokeWidth={2.4} />
          {['Offline-First', 'Zero Ads', 'Private by Design'].map((t, i) => (
            <View key={t} style={{ flexDirection: 'row', gap: 7 }}>
              {i > 0 && <T v="caption" color="rgba(255,255,255,0.35)">·</T>}
              <T v="caption" color={MIST}>{t}</T>
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  )
}
