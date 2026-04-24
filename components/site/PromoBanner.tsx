"use client"

import { useEffect, useState } from "react"
import { X, Tag } from "lucide-react"

type Promo = {
  id: string
  text: string
  hours?: [number, number]
  days?: number[]
}

const promos: Promo[] = [
  { id: "lunch", text: "Menu midi a 12.90€ — disponible de 11h a 14h", hours: [11, 14] },
  { id: "weekend", text: "Brunch oriental le weekend — reservez votre table", days: [0, 6] },
  { id: "happy", text: "Happy Hour : -30% sur les boissons de 17h a 19h", hours: [17, 19] },
]

function getActivePromo(): Promo | null {
  const now = new Date()
  const hour = now.getHours()
  const day = now.getDay()

  for (const promo of promos) {
    if (promo.hours && (hour < promo.hours[0] || hour >= promo.hours[1])) continue
    if (promo.days && !promo.days.includes(day)) continue
    return promo
  }
  return null
}

export function PromoBanner() {
  const [promo, setPromo] = useState<Promo | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const active = getActivePromo()
    if (!active) return

    const dismissedIds = JSON.parse(sessionStorage.getItem("jb-dismissed-promos") ?? "[]")
    if (dismissedIds.includes(active.id)) return

    setPromo(active)
  }, [])

  if (!promo || dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    const dismissedIds = JSON.parse(sessionStorage.getItem("jb-dismissed-promos") ?? "[]")
    sessionStorage.setItem("jb-dismissed-promos", JSON.stringify([...dismissedIds, promo.id]))
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white dark:from-amber-800 dark:via-orange-800 dark:to-amber-900">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium">
        <Tag className="h-4 w-4 shrink-0" />
        <span>{promo.text}</span>
        <button
          type="button"
          onClick={handleDismiss}
          className="ml-2 shrink-0 rounded-full p-1 transition hover:bg-white/20"
          aria-label="Fermer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
