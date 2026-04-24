"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type PremiumBackdropProps = {
  variant?: "cream" | "ink"
  className?: string
}

/**
 * Arrière-plan premium avec:
 * - dégradé beige crème / or
 * - orbes animés subtils
 * - motif "hairline" dorée
 * - grain fin
 */
export function PremiumBackdrop({
  variant = "cream",
  className,
}: PremiumBackdropProps) {
  const isInk = variant === "ink"

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className,
      )}
      aria-hidden
    >
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: isInk
            ? "var(--lux-gradient-ink)"
            : "var(--lux-gradient-paper)",
        }}
      />

      {/* Floating orbs — gold + bordeaux */}
      <motion.div
        className="absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full opacity-40"
        style={{
          background: isInk
            ? "radial-gradient(circle at 30% 30%, rgba(217,183,106,0.25), transparent 65%)"
            : "radial-gradient(circle at 30% 30%, rgba(201,162,76,0.35), transparent 65%)",
          filter: "blur(60px)",
        }}
        animate={{
          x: [0, 30, -10, 0],
          y: [0, 20, -15, 0],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-32 top-40 h-[560px] w-[560px] rounded-full opacity-30"
        style={{
          background: isInk
            ? "radial-gradient(circle at 50% 50%, rgba(110,29,43,0.35), transparent 65%)"
            : "radial-gradient(circle at 50% 50%, rgba(110,29,43,0.25), transparent 65%)",
          filter: "blur(80px)",
        }}
        animate={{
          x: [0, -20, 10, 0],
          y: [0, -15, 20, 0],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full opacity-25"
        style={{
          background: isInk
            ? "radial-gradient(circle at 50% 50%, rgba(92,107,58,0.5), transparent 60%)"
            : "radial-gradient(circle at 50% 50%, rgba(92,107,58,0.3), transparent 60%)",
          filter: "blur(70px)",
        }}
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -10, 15, 0],
        }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Hairline grid */}
      <div
        className="absolute inset-0 opacity-[0.08] dark:opacity-[0.14]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 44px, rgba(201,162,76,0.5) 44px, rgba(201,162,76,0.5) 45px), repeating-linear-gradient(90deg, transparent, transparent 44px, rgba(201,162,76,0.5) 44px, rgba(201,162,76,0.5) 45px)",
        }}
      />

      {/* Grain (inline SVG data URI) */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.07] mix-blend-multiply dark:mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  )
}
