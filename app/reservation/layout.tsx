import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Réservation — Jannat Bloudan | Réserver une table",
  description:
    "Réservez votre table au restaurant Jannat Bloudan. Terrasse, intérieur, VIP ou gaming room — choisissez votre ambiance.",
  openGraph: {
    title: "Réservation — Jannat Bloudan",
    description:
      "Réservez votre table pour une expérience culinaire syrienne inoubliable.",
  },
}

export default function ReservationLayout({ children }: { children: ReactNode }) {
  return children
}
