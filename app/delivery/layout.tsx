import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Livraison — Jannat Baloudan | Commander en Ligne",
  description:
    "Commandez nos specialites syriennes en livraison ou a emporter. Tracking en temps reel, paiement securise.",
  openGraph: {
    title: "Livraison — Jannat Baloudan",
    description: "Commandez en ligne et faites-vous livrer nos plats syriens authentiques.",
  },
}

export default function DeliveryLayout({ children }: { children: ReactNode }) {
  return children
}
