/**
 * Motion presets — Framer Motion
 * --------------------------------
 * Animations premium cohérentes pour tout le site.
 * Respecte `prefers-reduced-motion` via `LazyMotion` côté consommateurs.
 */
import type { Variants, Transition } from "framer-motion"

export const SPRING_SOFT: Transition = {
  type: "spring",
  stiffness: 180,
  damping: 22,
  mass: 0.9,
}

export const SPRING_BOUNCE: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 18,
}

export const EASE_SILK: Transition = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1],
}

export const EASE_QUICK: Transition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: EASE_SILK },
}

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -18 },
  visible: { opacity: 1, y: 0, transition: EASE_SILK },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: EASE_SILK },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: SPRING_SOFT },
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: EASE_SILK },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: EASE_SILK },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

export const cardHover = {
  whileHover: { y: -4, transition: EASE_QUICK },
  whileTap: { scale: 0.98, transition: EASE_QUICK },
}

export const buttonPress = {
  whileHover: { scale: 1.03, transition: EASE_QUICK },
  whileTap: { scale: 0.97, transition: EASE_QUICK },
}

export const pageEnter: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: EASE_SILK },
  exit: { opacity: 0, y: -8, transition: EASE_QUICK },
}
