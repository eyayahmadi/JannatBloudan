"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

type ScrollToTopProps = {
  /** Seuil de défilement en pixels avant d'afficher le bouton (défaut : 600) */
  threshold?: number
  /** Position : compatible avec `MobileBottomNav` (au-dessus, à droite) */
  position?: "bottom-right" | "bottom-left"
  className?: string
}

/**
 * Bouton premium "remonter en haut" pour les pages longues (homepage, menu).
 * - Apparaît quand l'utilisateur a scrollé > threshold
 * - Animation entrée/sortie subtile
 * - Respecte `prefers-reduced-motion` (CSS global le gère)
 * - Décalé pour ne pas chevaucher la `MobileBottomNav` ni le `ChatWidget`
 */
export function ScrollToTop({
  threshold = 600,
  position = "bottom-right",
  className,
}: ScrollToTopProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let raf = 0
    const handler = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        setVisible(window.scrollY > threshold)
      })
    }
    handler()
    window.addEventListener("scroll", handler, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", handler)
    }
  }, [threshold])

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          onClick={handleClick}
          aria-label="Remonter en haut de la page"
          initial={{ opacity: 0, y: 16, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.92 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "fixed z-40 print:hidden",
            "flex h-11 w-11 items-center justify-center rounded-full",
            "bg-white/90 text-[color:var(--lux-bordeaux)] backdrop-blur-md",
            "border border-[color:var(--lux-gold)]/40 shadow-[0_12px_30px_-10px_rgba(110,29,43,0.35)]",
            "transition-colors hover:border-[color:var(--lux-gold)] hover:text-[color:var(--lux-bordeaux-dark)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]",
            position === "bottom-right"
              ? "right-4 bottom-24 lg:bottom-6"
              : "left-4 bottom-24 lg:bottom-6",
            className,
          )}
        >
          <ArrowUp className="h-5 w-5" aria-hidden />
        </motion.button>
      ) : null}
    </AnimatePresence>
  )
}
