import { Image } from 'expo-image'
import { SplashScreen } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  Easing, FadeInDown, ReduceMotion, cancelAnimation, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue,
  withDelay, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated'
import { useTheme } from '@/design/theme'
import { T, haptic } from '@/ui'

/** Must match app.json → expo-splash-screen so the native-to-JS handoff is seamless. */
const NATIVE_BG = '#F3F3EF'
const NATIVE_LOGO = 180
const INTRO_MS = 2400
const MAX_WAIT_MS = 5000
const TITLE = 'Dormosaur'

/**
 * Animated launch splash. Starts on the exact native splash frame, plays the intro,
 * waits (bobbing) until `ready`, then zooms out to reveal the app. Tap to skip.
 */
export function AnimatedSplash({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const { c, dark } = useTheme()
  const reduce = useReducedMotion()
  const bg = dark ? '#000000' : NATIVE_BG

  const logo = useSharedValue(1)      // native logo: 1 = visible at native size
  const dino = useSharedValue(0)      // Dormo pop-in progress
  const ring = useSharedValue(0)      // glow ring expansion
  const bob = useSharedValue(0)       // idle bob while waiting
  const exit = useSharedValue(0)      // 0 → 1 on the way out
  const [introDone, setIntroDone] = useState(reduce)
  const [timedOut, setTimedOut] = useState(false)
  const leaving = useRef(false)

  // Hide the native splash once our first frame (identical to it) is on screen.
  const onLayout = () => { SplashScreen.hideAsync().catch(() => {}) }

  useEffect(() => {
    const cap = setTimeout(() => setTimedOut(true), MAX_WAIT_MS)
    if (reduce) { logo.set(0); dino.set(1); return () => clearTimeout(cap) }
    logo.set(withSequence(withTiming(0.9, { duration: 500, easing: Easing.out(Easing.cubic) }), withTiming(0, { duration: 320 })))
    dino.set(withDelay(550, withSpring(1, { damping: 12, stiffness: 120, mass: 0.8 })))
    ring.set(withDelay(600, withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) })))
    const t = setTimeout(() => {
      setIntroDone(true)
      bob.set(withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }), -1, true))
    }, INTRO_MS)
    return () => { clearTimeout(cap); clearTimeout(t) }
  }, [reduce, logo, dino, ring, bob])

  function leave() {
    if (leaving.current) return
    leaving.current = true
    cancelAnimation(bob)
    haptic.tap()
    exit.set(withTiming(1, { duration: reduce ? 300 : 600, easing: Easing.in(Easing.cubic), reduceMotion: ReduceMotion.Never }, done => { if (done) runOnJS(onDone)() }))
  }

  useEffect(() => { if ((introDone && ready) || timedOut) leave() })

  const root = useAnimatedStyle(() => ({ opacity: 1 - exit.get(), transform: [{ scale: reduce ? 1 : 1 + exit.get() * 0.12 }] }))
  const logoStyle = useAnimatedStyle(() => ({ opacity: logo.get() > 0.95 ? 1 : logo.get(), transform: [{ scale: logo.get() === 0 ? 0.9 : logo.get() }] }))
  const dinoStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, dino.get() * 1.5),
    transform: [{ translateY: (1 - dino.get()) * 40 - bob.get() * 8 }, { scale: 0.6 + dino.get() * 0.4 }],
  }))
  const shadowStyle = useAnimatedStyle(() => ({ opacity: dino.get() * (0.18 - bob.get() * 0.06), transform: [{ scaleX: 1 - bob.get() * 0.15 }] }))
  const ringStyle = useAnimatedStyle(() => ({ opacity: (1 - ring.get()) * 0.55, transform: [{ scale: 0.4 + ring.get() * 1.6 }] }))

  return (
    <Animated.View onLayout={onLayout} style={[StyleSheet.absoluteFill, { backgroundColor: bg, zIndex: 100 }, root]} pointerEvents="box-only">
      <Pressable style={styles.center} onPress={() => ready && leave()} accessibilityRole="button" accessibilityLabel="Dormosaur is opening. Tap to skip.">
        <Animated.View style={[styles.ring, { backgroundColor: c.greenSoft, borderColor: c.green }, ringStyle]} />
        <Animated.View style={[styles.abs, logoStyle]}>
          <Image source={require('@/assets/images/splash-icon.png')} style={{ width: NATIVE_LOGO, height: NATIVE_LOGO }} contentFit="contain" />
        </Animated.View>

        <View style={{ alignItems: 'center' }}>
          <Animated.View style={dinoStyle}>
            <Image source={require('@/assets/mascots/dormo-jumping.png')} style={{ width: 170, height: 200 }} contentFit="contain" />
          </Animated.View>
          <Animated.View style={[{ width: 110, height: 12, borderRadius: 60, backgroundColor: '#000', marginTop: -4 }, shadowStyle]} />
          <View style={{ height: 76, alignItems: 'center', justifyContent: 'flex-end', marginTop: 18 }}>
            {introDone || !reduce ? (
              <View style={{ flexDirection: 'row' }} accessibilityElementsHidden>
                {[...TITLE].map((ch, i) => (
                  <Animated.View key={i} entering={reduce ? undefined : FadeInDown.delay(1300 + i * 60).springify().damping(16)}>
                    <T v="largeTitle" color={c.ink} style={{ fontSize: 36, letterSpacing: -1 }}>{ch}</T>
                  </Animated.View>
                ))}
              </View>
            ) : null}
            <Animated.View entering={reduce ? undefined : FadeInDown.delay(1950).duration(380)}>
              <T v="callout" color={c.green} style={{ fontWeight: '600', marginTop: 4 }}>Dorm life, decoded.</T>
            </Animated.View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  abs: { position: 'absolute' },
  ring: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 2, top: '50%', marginTop: -190 },
})
