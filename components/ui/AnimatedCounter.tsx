"use client"

import { useEffect, useState } from "react"
import { useScrollReveal } from "@/lib/hooks/useScrollReveal"

type AnimatedCounterProps = {
  target: number
  suffix?: string
  prefix?: string
  duration?: number
  className?: string
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

export function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 1500,
  className,
}: AnimatedCounterProps) {
  const { ref, isVisible } = useScrollReveal(0.3)
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!isVisible) return

    let start: number | null = null
    let raf: number

    const step = (ts: number) => {
      if (!start) start = ts
      const elapsed = ts - start
      const progress = Math.min(elapsed / duration, 1)
      setValue(Math.round(easeOutCubic(progress) * target))

      if (progress < 1) {
        raf = requestAnimationFrame(step)
      }
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [isVisible, target, duration])

  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} className={className}>
      {prefix}
      {value}
      {suffix}
    </span>
  )
}
