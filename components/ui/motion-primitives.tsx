"use client"

import { motion, type MotionProps, type Variants } from "framer-motion"
import type { ElementType, ReactNode } from "react"
import { cn } from "@/lib/utils"
import {
  cardHover,
  fadeUp,
  staggerContainer,
  SPRING_SOFT,
} from "@/lib/ui/motion"

/* ====== FadeIn / FadeUp basic wrapper ====== */
type FadeInProps = {
  children: ReactNode
  delay?: number
  className?: string
  as?: ElementType
  once?: boolean
  variants?: Variants
}

export function FadeIn({
  children,
  delay = 0,
  className,
  variants = fadeUp,
  once = true,
}: FadeInProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-60px" }}
      transition={{ delay }}
      variants={variants}
    >
      {children}
    </motion.div>
  )
}

/* ====== Stagger list ====== */
export function StaggerList({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      transition={{ delayChildren: delay }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
  variants = fadeUp,
}: {
  children: ReactNode
  className?: string
  variants?: Variants
}) {
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  )
}

/* ====== Motion Card (hover lift + press) ====== */
type MotionCardProps = {
  children: ReactNode
  className?: string
  onClick?: () => void
} & MotionProps

export function MotionCard({
  children,
  className,
  onClick,
  ...motionProps
}: MotionCardProps) {
  return (
    <motion.div
      onClick={onClick}
      className={cn(
        "premium-card overflow-hidden p-5",
        onClick && "cursor-pointer",
        className,
      )}
      {...cardHover}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}

/* ====== Count-up numeric display ====== */
import { useEffect, useState } from "react"

export function CountUp({
  value,
  duration = 1400,
  prefix,
  suffix,
  decimals = 0,
  className,
}: {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const from = display
    const to = value

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (to - from) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  return (
    <span className={cn("numeric-display tabular-nums", className)}>
      {prefix}
      {display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  )
}

/* ====== Reveal scale on scroll ====== */
export function RevealScale({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.94 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ ...SPRING_SOFT, delay }}
    >
      {children}
    </motion.div>
  )
}
