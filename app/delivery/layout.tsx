import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Livraison — Jannat Bloudan | Commander en ligne",
  description:
    "Commandez nos spécialités syriennes en livraison ou à emporter. Suivi en temps réel, paiement sécurisé.",
  openGraph: {
    title: "Livraison — Jannat Bloudan",
    description: "Commandez en ligne et faites-vous livrer nos plats syriens authentiques.",
  },
}

export default function DeliveryLayout({ children }: { children: ReactNode }) {
  return children
}
