// Shared Framer Motion presets for authentic, physical iOS motion feeling across Dormosaur

export const springSnappy = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 30,
  mass: 0.8,
}

export const springSmooth = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 30,
}

export const springBouncy = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 20,
}

export const easeStandard = {
  duration: 0.25,
  ease: [0.22, 1, 0.36, 1] as const,
}

export const buttonTapScale = {
  scale: 0.96,
}

export const chipTapScale = {
  scale: 0.94,
}

export const cardHoverProps = {
  whileHover: { scale: 1.015, y: -2 },
  whileTap: { scale: 0.98 },
  transition: springSnappy,
}

export const pageEntrance = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: springSmooth,
}
