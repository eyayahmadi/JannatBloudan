import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Reservation — Jannat Baloudan | Reserver une Table",
  description:
    "Reservez votre table au restaurant Jannat Baloudan. Terrasse, interieur, VIP ou gaming room — choisissez votre ambiance.",
  openGraph: {
    title: "Reservation — Jannat Baloudan",
    description: "Reservez votre table pour une experience culinaire syrienne inoubliable.",
  },
}

export default function ReservationLayout({ children }: { children: ReactNode }) {
  return children
}
