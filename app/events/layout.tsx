import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Événements — Jannat Bloudan | Célébrations et réceptions",
  description:
    "Organisez mariages, anniversaires et événements d'entreprise au restaurant Jannat Bloudan. Espaces privatifs et menus sur mesure.",
  openGraph: {
    title: "Événements — Jannat Bloudan",
    description:
      "Mariages, anniversaires et soirées d'entreprise dans un cadre oriental élégant.",
  },
}

export default function EventsLayout({ children }: { children: ReactNode }) {
  return children
}
