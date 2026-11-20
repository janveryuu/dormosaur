import { Platform } from 'react-native'
import { FadeIn, FadeInDown } from 'react-native-reanimated'

const native = Platform.OS !== 'web'

/** Staggered rise-in for screen sections. Native only; web renders statically. */
export const rise = (i = 0) => (native ? FadeInDown.delay(40 + i * 70).springify().damping(20) : undefined)
export const fade = (delay = 0, duration = 300) => (native ? FadeIn.delay(delay).duration(duration) : undefined)
