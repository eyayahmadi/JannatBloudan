import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Mon compte",
  description:
    "Gérez votre compte Jannat Bloudan : commandes, réservations, programme fidélité, avis et notifications.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children
}
