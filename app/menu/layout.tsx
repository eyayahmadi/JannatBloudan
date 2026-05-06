import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Menu — Jannat Bloudan | Cuisine syrienne",
  description:
    "Découvrez notre carte : mezze, shawarma, kibbeh, manakish et desserts orientaux. Fait maison avec des ingrédients frais.",
  openGraph: {
    title: "Menu — Jannat Bloudan",
    description: "Mezze, shawarma, grillades et pâtisseries orientales. Cuisine syrienne authentique.",
  },
}

export default function MenuLayout({ children }: { children: ReactNode }) {
  return children
}
