import { Platform } from 'react-native'
import { Easing, FadeIn, FadeInDown, FadeOut, LinearTransition, ReduceMotion } from 'react-native-reanimated'

/** Apple-like springs: quick, slightly bouncy, never wobbly. */
export const spring = { damping: 18, stiffness: 220, mass: 0.9 }
export const springSoft = { damping: 22, stiffness: 160, mass: 1 }
export const springSnappy = { damping: 16, stiffness: 380, mass: 0.6 }

/** Staggered entrance for stacked content. */
// Reanimated entering animations leave content hidden on web, so web skips them.
const web = Platform.OS === 'web'

export const rise = (i = 0) => web ? undefined :
  FadeInDown.delay(60 + i * 55).springify().damping(20).stiffness(170).mass(0.9).withInitialValues({ transform: [{ translateY: 18 }] }).reduceMotion(ReduceMotion.System)

export const fade = (delay = 0, duration = 320) => web ? undefined :
  FadeIn.delay(delay).duration(duration).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System)

export const fadeOut = FadeOut.duration(180).reduceMotion(ReduceMotion.System)

export const layout = web ? undefined : LinearTransition.springify().damping(22).stiffness(200).reduceMotion(ReduceMotion.System)
