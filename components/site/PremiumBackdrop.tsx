"use client"

import { cn } from "@/lib/utils"

type PremiumBackdropProps = {
  variant?: "cream" | "ink"
  /** Static gradient only — no animated orbs (menu / QR on budget phones). */
  lite?: boolean
  className?: string
}

export function PremiumBackdrop({
  variant = "cream",
  lite = false,
  className,
}: PremiumBackdropProps) {
  const isInk = variant === "ink"

  if (lite) {
    return (
      <div
        className={cn("pointer-events-none absolute inset-0 -z-10", className)}
        aria-hidden
        style={{
          background: isInk ? "var(--lux-gradient-ink)" : "var(--lux-gradient-paper)",
        }}
      />
    )
  }

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background: isInk ? "var(--lux-gradient-ink)" : "var(--lux-gradient-paper)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.08] dark:opacity-[0.14]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 44px, rgba(201,162,76,0.5) 44px, rgba(201,162,76,0.5) 45px), repeating-linear-gradient(90deg, transparent, transparent 44px, rgba(201,162,76,0.5) 44px, rgba(201,162,76,0.5) 45px)",
        }}
      />
    </div>
  )
}
