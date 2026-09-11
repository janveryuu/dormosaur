/**
 * Named spring configs — single source of truth for motion across the app.
 * Calibrated to Apple iOS UIKit physical springs for ultra-smooth responsiveness.
 */

import type { Transition } from 'framer-motion'

/** Standard iOS-feel spring — view transitions & sheets */
export const IOS_SPRING: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 28,
  mass: 0.9,
}

/** Snappy iOS spring — buttons, switches, and tactile feedback */
export const IOS_SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 550,
  damping: 30,
  mass: 0.7,
}

/** Ultra-tactile button spring — zero lag on press, liquid bounce on release */
export const BUTTON_SPRING: Transition = {
  type: 'spring',
  stiffness: 520,
  damping: 26,
  mass: 0.65,
}

/** Bouncy entry spring — celebratory / first-render hero moments */
export const IOS_SPRING_ENTER: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 22,
}

/** Sidebar / tab-bar / segmented-control layout transition */
export const LAYOUT_SPRING: Transition = {
  type: 'spring',
  stiffness: 480,
  damping: 32,
  mass: 0.8,
}

/** Switch knob spring */
export const SWITCH_SPRING: Transition = {
  type: 'spring',
  stiffness: 600,
  damping: 34,
  mass: 0.6,
}

/** Cubic-bezier easing matching iOS UIKit animations */
export const IOS_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

/** Smooth standard curve for CSS transitions */
export const CSS_SPRING_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

/** Motion presets for interactive touch targets */
export const BUTTON_HOVER = { scale: 1.02, y: -1 }
export const BUTTON_TAP = { scale: 0.96 }
export const CHIP_TAP = { scale: 0.94 }
export const CARD_TAP = { scale: 0.98 }

/** Standard fade-up enter for content sections */
export const FADE_UP = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
} as const
