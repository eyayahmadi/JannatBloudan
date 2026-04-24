import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Evenements — Jannat Baloudan | Celebrations & Receptions",
  description:
    "Organisez mariages, anniversaires et evenements d'entreprise au restaurant Jannat Baloudan. Espaces privatifs et menus sur mesure.",
  openGraph: {
    title: "Evenements — Jannat Baloudan",
    description: "Mariages, anniversaires et soirees d'entreprise dans un cadre oriental elegant.",
  },
}

export default function EventsLayout({ children }: { children: ReactNode }) {
  return children
}
