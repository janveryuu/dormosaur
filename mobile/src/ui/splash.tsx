import { Image } from 'expo-image'
import { SplashScreen } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useRef, useState } from 'react'
import { Platform, StyleSheet, View, useColorScheme, useWindowDimensions } from 'react-native'
import Animated, {
  Easing, ReduceMotion, cancelAnimation, runOnJS, useAnimatedProps, useAnimatedStyle,
  useReducedMotion, useSharedValue, withDelay, withSequence, withTiming,
} from 'react-native-reanimated'
import Svg, { Circle, Path } from 'react-native-svg'
import { useTheme } from '@/design/theme'
import { T } from '@/ui'

const LIGHT = { background: '#F3F3EF', route: '#0E7A4A', ink: '#0A1710', stop: '#E5C75D', mapOpacity: 0.54 }
const DARK = { background: '#000000', route: '#A1A1AA', ink: '#F5F5F5', stop: '#F5F5F5', mapOpacity: 0.42 }
const WIDTH = 390
const HEIGHT = 844
const NATIVE_LOGO_WIDTH = 180
const ROUTE = 'M61 414 H97 Q105 414 105 422 V446 Q105 454 113 454 H266 Q274 454 274 446 V408 Q274 400 282 400 H307'
const ROUTE_LENGTH = 328
const TIMING = { route: 200, map: 480, dormo: 750, wordmark: 1080, settled: 1350, handoff: 1900, complete: 2150 }
const REDUCED_FADE = 120
const easeOut = Easing.bezier(0.2, 0.7, 0.2, 1)
const AnimatedPath = Animated.createAnimatedComponent(Path)
const AnimatedCircle = Animated.createAnimatedComponent(Circle)
const nativeLogo = require('@/assets/images/splash-icon.png')
const dormoArt = require('@/assets/splash/dormo.webp')
const campusMapArt = require('@/assets/splash/campus-map.webp')

export function AnimatedSplash({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const { dark } = useTheme()
  const systemDark = useColorScheme() === 'dark'
  const reduceMotion = useReducedMotion()
  const { width, height } = useWindowDimensions()
  const scale = Math.min(width / WIDTH, height / HEIGHT)
  const palette = dark ? DARK : LIGHT
  const [layoutReady, setLayoutReady] = useState(false)
  const [artwork, setArtwork] = useState({ native: false, dormo: false, map: false })
  const [introDone, setIntroDone] = useState(false)
  const leaving = useRef(false)
  const doneSent = useRef(false)
  const finishOnce = () => {
    if (doneSent.current) return
    doneSent.current = true
    SplashScreen.hideAsync().catch(() => {})
    onDone()
  }
  const artworkReady = artwork.native && artwork.dormo && artwork.map
  const nativeOpacity = useSharedValue(reduceMotion ? 0 : 1)
  const route = useSharedValue(reduceMotion ? 1 : 0)
  const map = useSharedValue(reduceMotion ? 1 : 0)
  const dormo = useSharedValue(reduceMotion ? 1 : 0)
  const wordmark = useSharedValue(reduceMotion ? 1 : 0)
  const stop = useSharedValue(reduceMotion ? 1 : 0)
  const stopScale = useSharedValue(1)
  const exit = useSharedValue(1)

  function artworkLoaded(asset: keyof typeof artwork) {
    setArtwork(current => current[asset] ? current : { ...current, [asset]: true })
  }

  useEffect(() => {
    if (!layoutReady || !artworkReady) return
    SplashScreen.hideAsync().catch(() => {})

    if (!reduceMotion) {
      // Blend the bundled native logo into the opening waypoint on the same background.
      nativeOpacity.set(withTiming(0, { duration: 160 }))
      route.set(withDelay(TIMING.route, withTiming(1, { duration: TIMING.dormo - TIMING.route, easing: Easing.bezier(0.42, 0, 0.58, 1) })))
      map.set(withDelay(TIMING.map, withTiming(1, { duration: TIMING.dormo - TIMING.map, easing: easeOut })))
      dormo.set(withDelay(TIMING.dormo, withTiming(1, { duration: TIMING.wordmark - TIMING.dormo, easing: easeOut })))
      wordmark.set(withDelay(TIMING.wordmark, withTiming(1, { duration: TIMING.settled - TIMING.wordmark, easing: easeOut })))
      stop.set(withDelay(TIMING.dormo, withTiming(1, { duration: 93, easing: easeOut })))
      stopScale.set(withDelay(TIMING.dormo, withSequence(
        withTiming(1.2, { duration: 93, easing: easeOut }),
        withTiming(1, { duration: 62, easing: easeOut }),
      )))
    }

    const hold = reduceMotion ? TIMING.complete - REDUCED_FADE : TIMING.handoff
    const timer = setTimeout(() => setIntroDone(true), hold)
    return () => {
      clearTimeout(timer)
      for (const value of [nativeOpacity, route, map, dormo, wordmark, stop, stopScale]) cancelAnimation(value)
    }
  }, [layoutReady, artworkReady, reduceMotion, nativeOpacity, route, map, dormo, wordmark, stop, stopScale])

  useEffect(() => {
    const watchdog = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {})
      setLayoutReady(true)
      setArtwork({ native: true, dormo: true, map: true })
      setIntroDone(true)
    }, 2500)
    return () => clearTimeout(watchdog)
  }, [])

  useEffect(() => {
    if (!ready || !introDone || leaving.current) return
    leaving.current = true
    const exitDuration = reduceMotion ? REDUCED_FADE : TIMING.complete - TIMING.handoff
    const fallback = setTimeout(() => finishOnce(), exitDuration + 200)
    exit.set(withTiming(0, {
      duration: exitDuration,
      easing: Easing.linear,
      reduceMotion: ReduceMotion.Never,
    }, finished => {
      if (finished) runOnJS(finishOnce)()
    }))
    return () => clearTimeout(fallback)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, introDone, reduceMotion, exit])

  const overlayStyle = useAnimatedStyle(() => ({ opacity: exit.get() }))
  const nativeStyle = useAnimatedStyle(() => ({ opacity: nativeOpacity.get() }))
  const routeProps = useAnimatedProps(() => ({ strokeDashoffset: (1 - route.get()) * ROUTE_LENGTH }))
  const mapStyle = useAnimatedStyle(() => ({
    opacity: map.get() * palette.mapOpacity,
    transform: [{ translateY: (1 - map.get()) * 6 * scale }],
  }))
  const dormoStyle = useAnimatedStyle(() => ({
    opacity: dormo.get(),
    transform: [{ translateY: (1 - dormo.get()) * 8 * scale }, { scale: 0.94 + dormo.get() * 0.06 }],
  }))
  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmark.get(),
    transform: [{ translateY: (1 - wordmark.get()) * 6 * scale - 18 * scale }],
  }))
  const stopProps = useAnimatedProps(() => ({
    r: 4.5 * stopScale.get(),
    opacity: route.get() >= 0.999 ? 1 : 0,
  }))
  const lightStopProps = useAnimatedProps(() => ({
    r: 4.5 * stopScale.get(),
    opacity: stop.get(),
  }))

  return (
    <Animated.View
      onLayout={() => setLayoutReady(true)}
      style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: palette.background }, overlayStyle]}
      pointerEvents="auto"
      accessibilityLabel="Dormosaur is opening"
      accessibilityRole="progressbar"
      accessible
    >
      <StatusBar style={dark ? 'light' : 'dark'} />
      <View style={{ width: WIDTH * scale, height: HEIGHT * scale }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Animated.View style={[{ position: 'absolute', top: (394 - 212 / 3) * scale, left: 89 * scale, width: 212 * scale, height: 212 / 1.5 * scale }, mapStyle]}>
          <Image source={campusMapArt} style={styles.image} contentFit="contain" onLoadEnd={() => artworkLoaded('map')} />
        </Animated.View>
        <Svg viewBox="0 0 390 844" width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <AnimatedPath d={ROUTE} stroke={palette.route} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={[ROUTE_LENGTH, ROUTE_LENGTH]} fill="none" animatedProps={routeProps} />
          <Circle cx={61} cy={414} r={4} fill={palette.route} />
          <AnimatedCircle cx={307} cy={400} fill={dark ? palette.stop : palette.route} animatedProps={stopProps} />
          {!dark && <AnimatedCircle cx={307} cy={400} fill={palette.stop} animatedProps={lightStopProps} />}
        </Svg>
        <Animated.View style={[{ position: 'absolute', left: 0, right: 0, alignItems: 'center', top: 305 * scale, height: 146 * scale, transformOrigin: 'center bottom' }, dormoStyle]}>
          <Image source={dormoArt} style={{ width: 146 * 801 / 1227 * scale, height: 146 * scale }} contentFit="contain" onLoadEnd={() => artworkLoaded('dormo')} />
        </Animated.View>
        <Animated.View style={[{ position: 'absolute', top: 498 * scale, left: 0, right: 0 }, wordmarkStyle]}>
          <T center allowFontScaling={false} color={palette.ink} style={{ fontSize: 36 * scale, lineHeight: 36 * scale, fontWeight: '700', letterSpacing: -1.2 * scale }}>Dormosaur</T>
        </Animated.View>
      </View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: (Platform.OS === 'web' ? dark : systemDark) ? DARK.background : LIGHT.background }, nativeStyle]}
        accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Image source={nativeLogo} style={{ width: NATIVE_LOGO_WIDTH, height: NATIVE_LOGO_WIDTH * 613 / 400 }}
          contentFit="contain" onLoadEnd={() => artworkLoaded('native')} />
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  overlay: { zIndex: 100, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
})
