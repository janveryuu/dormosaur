import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Link } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ShieldCheck } from 'lucide-react-native'
import { useEffect } from 'react'
import { Pressable, View } from 'react-native'
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { fade, rise } from '@/design/motion'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, T } from '@/components/ui'
import { font } from '@/design/tokens'

const MIST = 'rgba(255,255,255,0.78)'

/** First screen for signed-out users. */
export default function Welcome() {
  const insets = useSafeAreaInsets()
  const float = useSharedValue(0)

  useEffect(() => {
    float.set(withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.System }), -1, true))
  }, [float])

  const bob = useAnimatedStyle(() => ({ transform: [{ translateY: -10 * float.get() }, { rotate: `${-2 + 4 * float.get()}deg` }] }))

  return (
    <View style={{ flex: 1, backgroundColor: '#0E1F16' }}>
      <StatusBar style="light" />
      <Image source={require('@/assets/images/welcome-bg.png')} style={{ position: 'absolute', inset: 0 }} contentFit="cover" />
      <LinearGradient
        colors={['rgba(14,31,22,0)', 'rgba(14,31,22,0.25)', 'rgba(14,31,22,0.92)', '#0E1F16']}
        locations={[0, 0.4, 0.66, 1]}
        style={{ position: 'absolute', inset: 0 }}
      />

      <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 28, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View entering={fade(0, 600)} style={bob}>
            <Image
              source={require('@/assets/mascots/dormo-jumping.png')}
              style={{ width: 280, height: 337 }}
              contentFit="contain"
              accessibilityLabel="Dormo the dinosaur jumping"
            />
          </Animated.View>
        </View>

        <Animated.View entering={rise(2)} style={{ alignItems: 'center', gap: 12 }}>
          <T v="display" accessibilityRole="header" style={{ color: '#fff', fontSize: 38, lineHeight: 44 }}>Dormosaur</T>
          <T v="body" style={{ color: MIST, textAlign: 'center', fontSize: 16, lineHeight: 24, maxWidth: 340 }}>
            Dorm life, decoded. Paste your schedule, sync class alarms, and eat well on a dorm budget.
          </T>
        </Animated.View>

        <Animated.View entering={rise(4)} style={{ marginTop: 32, gap: 8 }}>
          <Link href="/sign-up" asChild>
            <Button title="Let's get started" style={{ backgroundColor: '#3E7A52', height: 56 }} />
          </Link>
          <Link href="/sign-in" asChild>
            <Pressable accessibilityRole="link" hitSlop={6} style={{ alignSelf: 'center', flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16 }}>
              <T v="body" style={{ color: MIST }}>Already have an account? </T>
              <T v="body" style={{ color: '#fff', fontFamily: font.bold, textDecorationLine: 'underline' }}>Log in</T>
            </Pressable>
          </Link>
        </Animated.View>

        <Animated.View entering={fade(450)} style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <ShieldCheck size={14} color="#7FD1A0" strokeWidth={2.2} />
          <T v="meta" style={{ color: MIST, fontSize: 12 }}>Offline-first</T>
          <T v="meta" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>·</T>
          <T v="meta" style={{ color: MIST, fontSize: 12 }}>Zero ads</T>
          <T v="meta" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>·</T>
          <T v="meta" style={{ color: MIST, fontSize: 12 }}>Private by design</T>
        </Animated.View>
      </View>
    </View>
  )
}
