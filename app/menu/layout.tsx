import type { Metadata } from "next"
import type { ReactNode } from "react"
import { SITE } from "@/lib/site-config"
import { MenuStructuredData } from "@/components/menu/MenuStructuredData"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jannatbloudan.com"

export const metadata: Metadata = {
  title: "Speisekarte — Jannat Bloudan | Syrisch-arabische Küche",
  description:
    "Digitale Speisekarte: Mezze, Shawarma, Manakish, Grillades, Pizza, Desserts, Kaffee, Cocktails und Shisha. Deutsche & arabische Beschreibungen.",
  alternates: {
    canonical: `${SITE_URL}/menu`,
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/menu`,
    siteName: SITE.name,
    title: "Speisekarte — Jannat Bloudan",
    description:
      "Entdecken Sie unsere syrisch-arabische Küche: Vorspeisen, Hauptgerichte, Getränke, Desserts und Shisha.",
    locale: "de_DE",
    images: [
      {
        url: SITE.images.mezze,
        width: 1200,
        height: 630,
        alt: "Jannat Bloudan — Mezze und syrisch-arabische Spezialitäten",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Speisekarte — Jannat Bloudan",
    description: "Syrisch-arabische Küche in Erfurt — digitale Speisekarte.",
    images: [SITE.images.mezze],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function MenuLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MenuStructuredData />
      {children}
    </>
  )
}
