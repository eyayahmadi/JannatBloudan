import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Connectez-vous à votre compte Jannat Bloudan pour suivre vos commandes, réservations et bénéficier du programme fidélité.",
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Connexion — Jannat Bloudan",
    description: "Accédez à votre espace personnel Jannat Bloudan.",
  },
}

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children
}
