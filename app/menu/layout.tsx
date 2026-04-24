import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Menu — Jannat Baloudan | Cuisine Syrienne",
  description:
    "Découvrez notre carte : mezzes, shawarma, kibbeh, manakish et desserts orientaux. Fait maison avec des ingrédients frais.",
  openGraph: {
    title: "Menu — Jannat Baloudan",
    description: "Mezzes, shawarma, grillades et patisseries orientales. Cuisine syrienne authentique.",
  },
}

export default function MenuLayout({ children }: { children: ReactNode }) {
  return children
}
