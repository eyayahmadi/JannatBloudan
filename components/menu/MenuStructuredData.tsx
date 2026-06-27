import { SITE } from "@/lib/site-config"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jannatbloudan.com"

/** JSON-LD for public /menu — Restaurant + Menu (no per-item SSR). */
export function MenuStructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Restaurant",
        "@id": `${SITE_URL}/#restaurant`,
        name: SITE.name,
        description: SITE.tagline,
        url: SITE_URL,
        image: SITE.images.mezze,
        telephone: SITE.contact.phoneE164,
        email: SITE.contact.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE.address.streetAddress,
          addressLocality: SITE.address.addressLocality,
          postalCode: SITE.address.postalCode,
          addressRegion: SITE.address.addressRegion,
          addressCountry: SITE.address.addressCountry,
        },
        servesCuisine: ["Syrian", "Middle Eastern", "Arabic"],
        openingHoursSpecification: SITE.openingHoursSpecification,
      },
      {
        "@type": "Menu",
        "@id": `${SITE_URL}/menu#menu`,
        name: "Speisekarte — Jannat Bloudan",
        description:
          "Syrisch-arabische Küche: Mezze, Shawarma, Manakish, Grillades, Pizza, Desserts, Getränke und Shisha.",
        inLanguage: ["de", "ar"],
        hasMenuSection: [
          { "@type": "MenuSection", name: "Vorspeisen & Salate" },
          { "@type": "MenuSection", name: "Hauptgerichte & Grill" },
          { "@type": "MenuSection", name: "Getränke" },
          { "@type": "MenuSection", name: "Desserts & Shisha" },
        ],
        url: `${SITE_URL}/menu`,
        provider: { "@id": `${SITE_URL}/#restaurant` },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  )
}
