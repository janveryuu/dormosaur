// Shared Framer Motion presets for authentic, physical iOS motion feeling across Dormosaur
import {
  IOS_SPRING,
  IOS_SPRING_SNAPPY,
  BUTTON_SPRING,
  IOS_SPRING_ENTER,
  BUTTON_TAP,
  CHIP_TAP,
  CARD_TAP,
  BUTTON_HOVER,
  LAYOUT_SPRING,
  SWITCH_SPRING,
} from './springs'

export const springSnappy = IOS_SPRING_SNAPPY
export const springSmooth = IOS_SPRING
export const springBouncy = IOS_SPRING_ENTER
export const springButton = BUTTON_SPRING
export const springLayout = LAYOUT_SPRING
export const springSwitch = SWITCH_SPRING

export const easeStandard = {
  duration: 0.25,
  ease: [0.22, 1, 0.36, 1] as const,
}

export const buttonTapScale = BUTTON_TAP
export const buttonHoverScale = BUTTON_HOVER
export const chipTapScale = CHIP_TAP
export const cardTapScale = CARD_TAP

export const cardHoverProps = {
  whileHover: { scale: 1.015, y: -2 },
  whileTap: CARD_TAP,
  transition: springSnappy,
}

export const pageEntrance = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: springSmooth,
}
