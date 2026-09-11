/**
 * Named spring configs — single source of truth for motion across the app.
 * Import from this file; do not define spring objects inline.
 */

import type { Transition } from 'framer-motion'

/** Standard iOS-feel spring — most UI transitions */
export const IOS_SPRING: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
}

/** Snappy iOS spring — buttons, quick feedback */
export const IOS_SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 600,
  damping: 36,
}

/** Bouncy entry spring — first-render hero elements */
export const IOS_SPRING_ENTER: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 22,
}

/** Sidebar / layout spring — navigation active-indicator */
export const LAYOUT_SPRING: Transition = {
  type: 'spring',
  stiffness: 480,
  damping: 34,
}

/** Cubic-bezier easing matching iOS UIKit animations */
export const IOS_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

/** Standard fade-up enter for content sections */
export const FADE_UP = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
} as const
