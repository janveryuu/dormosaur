import { Image } from 'expo-image'
import { useEffect, useRef, useState } from 'react'
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated, {
  Easing, FadeIn, FadeOut, ReduceMotion, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue,
  withDelay, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated'
import { useTheme } from '@/design/theme'
import { T, haptic } from './index'

/** The official Dormo artwork, one pose per mood. */
export const DORMO = {
  hi: require('@/assets/mascots/dormosaur-greeting.png'),
  welcome: require('@/assets/mascots/dormosaur-welcome.png'),
  thinking: require('@/assets/mascots/dormosaur-thinking.png'),
  cheer: require('@/assets/mascots/dormosaur-you-got-this.png'),
  comfy: require('@/assets/mascots/dormosaur-comfy-time.png'),
  jump: require('@/assets/mascots/dormo-jumping.png'),
  student: require('@/assets/images/student-dormosaur.png'),
  sleepy: require('@/assets/images/sleeping-dino.png'),
  chef: require('@/assets/images/chef-dormosaur.png'),
} as const
export type DormoMood = keyof typeof DORMO

const rm = ReduceMotion.System

type Props = {
  mood?: DormoMood
  size?: number
  /** Lines Dormo says when tapped, one at a time. */
  lines?: string[]
  /** Hop on its own every few seconds. */
  hops?: boolean
  shadow?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * Dormo, alive: breathes (squash and stretch from the feet), sways, hops now and then,
 * and reacts to a tap with a happy bounce, a haptic and a speech bubble.
 * Rests completely when the system asks for reduced motion.
 */
export function Dormo({ mood = 'hi', size = 120, lines, hops = true, shadow = true, style }: Props) {
  const { c } = useTheme()
  const reduce = useReducedMotion()
  const breathe = useSharedValue(0)
  const sway = useSharedValue(0)
  const hop = useSharedValue(0)
  const squash = useSharedValue(0)
  const tap = useSharedValue(1)
  const [said, setSaid] = useState<string | null>(null)
  const lineIx = useRef(0)
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (reduce) return
    breathe.set(withRepeat(withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin), reduceMotion: rm }), -1, true))
    sway.set(withRepeat(withSequence(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin), reduceMotion: rm }),
      withTiming(-1, { duration: 2600, easing: Easing.inOut(Easing.sin), reduceMotion: rm }),
    ), -1, true))
    if (hops) {
      // crouch, leap, land with a squash, settle; then wait
      squash.set(withRepeat(withSequence(
        withDelay(4200, withTiming(1, { duration: 140, reduceMotion: rm })),
        withTiming(-0.6, { duration: 160, reduceMotion: rm }),
        withDelay(260, withTiming(0.8, { duration: 90, reduceMotion: rm })),
        withSpring(0, { damping: 9, stiffness: 260, reduceMotion: rm }),
      ), -1, false))
      hop.set(withRepeat(withSequence(
        withDelay(4340, withTiming(1, { duration: 260, easing: Easing.out(Easing.quad), reduceMotion: rm })),
        withTiming(0, { duration: 300, easing: Easing.in(Easing.quad), reduceMotion: rm }),
        withDelay(400, withTiming(0, { duration: 1 })),
      ), -1, false))
    }
    return () => { [breathe, sway, hop, squash].forEach(v => cancelAnimation(v)) }
  }, [reduce, hops, breathe, sway, hop, squash])

  useEffect(() => () => { if (bubbleTimer.current) clearTimeout(bubbleTimer.current) }, [])

  const body = useAnimatedStyle(() => {
    const b = breathe.get()
    const s = squash.get()
    return {
      transform: [
        { translateY: -hop.get() * size * 0.16 },
        { rotate: `${sway.get() * 2.2}deg` },
        // anchor squash at the feet: shift by half the height change
        { translateY: (s * 0.12 - b * 0.025) * size * 0.5 },
        { scaleY: 1 + b * 0.025 - s * 0.12 },
        { scaleX: 1 - b * 0.012 + s * 0.1 },
        { scale: tap.get() },
      ],
    }
  })
  const shade = useAnimatedStyle(() => ({
    transform: [{ scaleX: 1 - hop.get() * 0.35 + squash.get() * 0.08 }],
    opacity: 0.18 - hop.get() * 0.1,
  }))

  function onTap() {
    haptic.tap()
    tap.set(withSequence(withTiming(0.86, { duration: 90 }), withSpring(1.08, { damping: 6, stiffness: 300 }), withSpring(1, { damping: 10 })))
    if (!lines?.length) return
    setSaid(lines[lineIx.current % lines.length])
    lineIx.current += 1
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current)
    bubbleTimer.current = setTimeout(() => setSaid(null), 2600)
  }

  return (
    <View style={[{ width: size, alignItems: 'center' }, style]}>
      {said && (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} pointerEvents="none"
          style={{ position: 'absolute', bottom: size * 0.98, zIndex: 2, maxWidth: 190, minWidth: 110, backgroundColor: c.card, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8,
            shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>
          <T v="footnote" center style={{ fontWeight: '600' }}>{said}</T>
          <View style={{ position: 'absolute', bottom: -5, alignSelf: 'center', width: 12, height: 12, backgroundColor: c.card, transform: [{ rotate: '45deg' }] }} />
        </Animated.View>
      )}
      <Pressable onPress={onTap} accessibilityRole="button" accessibilityLabel="Dormo, the Dormosaur mascot. Tap to say hi." hitSlop={8}>
        <Animated.View style={body}>
          <Image source={DORMO[mood]} style={{ width: size, height: size }} contentFit="contain" />
        </Animated.View>
      </Pressable>
      {shadow && <Animated.View pointerEvents="none" style={[{ width: size * 0.55, height: size * 0.07, marginTop: -size * 0.05, borderRadius: 99, backgroundColor: '#0A1710' }, shade]} />}
    </View>
  )
}
