"use client"

import { useEffect, useId, useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

const PATH_DRAW_SETTLE_MS = Math.ceil((0.65 + 1.45) * 1000) + 400
const DEFAULT_PAUSE_BETWEEN_LOOPS_MS = 3000
const DEFAULT_LOGO_LOOP_MS = PATH_DRAW_SETTLE_MS + DEFAULT_PAUSE_BETWEEN_LOOPS_MS

type BloudanLogoMarkProps = {
  /** Taille (px) du carré. Mettre `0` pour remplir le parent (h/w en CSS). */
  size?: number
  className?: string
  /** header = traits plus épais pour petit format */
  variant?: "header" | "inline"
  /** Scintillement léger en boucle après le tracé */
  pulse?: boolean
  /**
   * Affiche la photo officielle en très bas contraste derrière le squelette SVG
   * (l’or reste vectoriel par-dessus).
   */
  withPhotoBack?: boolean
  /** Répéter l’animation de tracé (même séquence qu’au chargement). */
  loop?: boolean
  /** Intervalle entre deux boucles (ms). Défaut : tracé + pause, minimum appliqué. */
  loopIntervalMs?: number
}

/**
 * Marque Jannat / Bloudan : montagnes + forêt en lignes dorées (style squelette),
 * animation de tracé au montage. S’inspire du logo paysage (relief, sapins).
 */
export function BloudanLogoMark({
  size = 0,
  className,
  variant = "header",
  pulse = true,
  withPhotoBack = true,
  loop = true,
  loopIntervalMs: loopIntervalProp,
}: BloudanLogoMarkProps) {
  const reduceMotion = useReducedMotion()
  const [replayKey, setReplayKey] = useState(0)
  const baseId = useId().replace(/:/g, "")
  const gradId = `bloudan-gold-${baseId}`

  const loopIntervalMs = Math.max(
    loopIntervalProp ?? DEFAULT_LOGO_LOOP_MS,
    PATH_DRAW_SETTLE_MS + 300,
  )

  useEffect(() => {
    if (reduceMotion || !loop) return
    const id = window.setInterval(() => {
      setReplayKey((k) => k + 1)
    }, loopIntervalMs)
    return () => window.clearInterval(id)
  }, [reduceMotion, loop, loopIntervalMs])

  const strokeW = variant === "header" ? 2.1 : 1.6

  const paths = useMemo(
    () => ({
      mountains:
        "M 2 48 L 12 24 L 24 40 L 36 16 L 48 36 L 60 20 L 72 38 L 84 18 L 96 42 L 100 48",
      forest:
        "M 0 50 L 4 40 L 8 50 L 12 38 L 16 50 L 20 42 L 24 50 L 28 40 L 32 50 L 36 40 L 40 50 L 44 42 L 48 50 L 52 38 L 56 50 L 60 42 L 64 50 L 68 40 L 72 50 L 76 44 L 80 50 L 84 40 L 88 50 L 92 44 L 96 50 L 100 50",
      base: "M 0 55 Q 50 60 100 55",
      centerLine: "M 20 70 L 50 66 L 80 70",
      leftGem: "M 6 64 L 9 70 L 6 76 L 3 70 Z",
      rightGem: "M 94 64 L 97 70 L 94 76 L 91 70 Z",
    }),
    [],
  )

  const pathTransition = { duration: 1.45, ease: [0.22, 0.8, 0.2, 1] as const }
  const pathInitial = reduceMotion
    ? { pathLength: 1, opacity: 1 }
    : { pathLength: 0, opacity: 0.3 }
  const pathFromForest = reduceMotion
    ? { pathLength: 1, opacity: 0.95 }
    : { pathLength: 0, opacity: 0.2 }
  const fillRef = `url(#${gradId})`
  const boxStyle =
    size > 0
      ? { width: size, height: size }
      : ({ width: "100%", height: "100%" } as const)

  return (
    <div
      className={cn(
        "pointer-events-none relative flex min-h-0 min-w-0 select-none items-center justify-center overflow-hidden rounded-2xl",
        pulse && !reduceMotion && "bloudan-mark-glow",
        className,
      )}
      style={boxStyle}
      aria-hidden
    >
      {withPhotoBack ? (
        <img
          src="/images/bloudan-restaurant.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-[0.12] mix-blend-multiply"
          style={{ filter: "sepia(0.35) saturate(1.2) hue-rotate(-8deg)" }}
        />
      ) : null}
      <svg
        viewBox="0 0 100 80"
        width="100%"
        height="100%"
        className="relative z-[1] h-full w-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
        role="img"
      >
        <title>Bloudan — relief et forêts</title>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--lux-gold-bright, #d9b76a)" />
            <stop offset="45%" stopColor="var(--lux-gold, #c9a24c)" />
            <stop offset="100%" stopColor="var(--lux-gold-deep, #8e6b1e)" />
          </linearGradient>
        </defs>

        <motion.g key={replayKey}>
          <motion.path
            d={paths.mountains}
            fill="none"
            stroke={fillRef}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={pathInitial}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={pathTransition}
          />
          <motion.path
            d={paths.forest}
            fill="none"
            stroke={fillRef}
            strokeWidth={strokeW * 0.85}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={pathFromForest}
            animate={{ pathLength: 1, opacity: 0.95 }}
            transition={{ ...pathTransition, delay: reduceMotion ? 0 : 0.2 }}
          />
          <motion.path
            d={paths.base}
            fill="none"
            stroke={fillRef}
            strokeWidth={strokeW * 0.75}
            strokeLinecap="round"
            initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ ...pathTransition, delay: reduceMotion ? 0 : 0.5 }}
          />
          <motion.path
            d={paths.centerLine}
            fill="none"
            stroke={fillRef}
            strokeWidth={strokeW * 0.55}
            strokeLinecap="round"
            initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ ...pathTransition, delay: reduceMotion ? 0 : 0.65 }}
          />
          <motion.g
            initial={reduceMotion ? { scale: 1, opacity: 0.92 } : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.92 }}
            transition={{ delay: reduceMotion ? 0 : 0.9, type: "spring", stiffness: 220, damping: 18 }}
          >
            <path d={paths.leftGem} fill={fillRef} stroke="none" />
            <path d={paths.rightGem} fill={fillRef} stroke="none" />
          </motion.g>
        </motion.g>
      </svg>
    </div>
  )
}
