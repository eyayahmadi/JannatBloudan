import type React from "react"
import type { Metadata, Viewport } from "next"
import { Outfit, Playfair_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "sonner"
import { SITE } from "@/lib/site-config"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jannatbloudan.com"

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf7ef" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1410" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Jannat Bloudan — Restaurant syrien authentique",
    template: "%s | Jannat Bloudan",
  },
  description:
    "Découvrez la cuisine syrienne authentique de Jannat Bloudan. Commandez en ligne, réservez votre table et savourez nos spécialités traditionnelles : mezzes, grillades, manakish, baklava et plus.",
  applicationName: "Jannat Bloudan",
  keywords: [
    "restaurant syrien",
    "cuisine syrienne",
    "Jannat Bloudan",
    "mezze",
    "shawarma",
    "manakish",
    "réservation restaurant",
    "livraison repas",
    "événements privés",
  ],
  authors: [{ name: "Jannat Bloudan" }],
  creator: "Jannat Bloudan",
  publisher: "Jannat Bloudan",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      fr: "/",
      en: "/",
      ar: "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    alternateLocale: ["en_US", "ar_SY"],
    url: SITE_URL,
    siteName: "Jannat Bloudan",
    title: "Jannat Bloudan — Restaurant syrien authentique",
    description:
      "Cuisine syrienne authentique : livraison, réservation et événements privés.",
    images: [
      {
        url: "/images/jannat-arab-feast-lantern-table.png",
        width: 1200,
        height: 630,
        alt: "Tablée de mezzés syriens chez Jannat Bloudan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jannat Bloudan — Restaurant syrien authentique",
    description:
      "Cuisine syrienne authentique : livraison, réservation et événements privés.",
    images: ["/images/jannat-arab-feast-lantern-table.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${outfit.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-dvh">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[color:var(--lux-bordeaux)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:ring-2 focus:ring-[color:var(--lux-gold)]/60"
        >
          Aller au contenu principal
        </a>
        <Providers>
          {children}
          <Toaster position="bottom-right" richColors closeButton duration={4500} />
        </Providers>
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Restaurant",
              name: "Jannat Bloudan",
              servesCuisine: "Syrian",
              description:
                "Cuisine syrienne authentique — livraison, réservation et événements privés.",
              url: "https://jannatbloudan.com",
              telephone: SITE.contact.phoneE164,
              email: SITE.contact.email,
              sameAs: [
                SITE.contact.googleBusinessUrl,
                SITE.contact.facebookUrl,
                SITE.contact.instagramUrl,
              ],
              address: {
                "@type": "PostalAddress",
                streetAddress: SITE.address.streetAddress,
                postalCode: SITE.address.postalCode,
                addressLocality: SITE.address.addressLocality,
                addressRegion: SITE.address.addressRegion,
                addressCountry: SITE.address.addressCountry,
              },
              openingHoursSpecification: SITE.openingHoursSpecification,
              priceRange: "$$",
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.3",
                reviewCount: "1",
              },
            }),
          }}
        />
      </body>
    </html>
  )
}
