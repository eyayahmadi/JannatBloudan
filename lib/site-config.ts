export const SITE = {
  name: "Jannat Bloudan",
  tagline: "Restaurant syrien authentique",
  /** Adresse physique (restaurant) */
  address: {
    streetAddress: "Mainzer Str. 35",
    postalCode: "99089",
    addressLocality: "Erfurt",
    /** Land (Bundesland) — allemand officiel pour JSON-LD / factures */
    addressRegion: "Thüringen",
    addressCountry: "DE" as const,
    /** Une ligne pour impressions / pieds de page */
    full: "Mainzer Str. 35, 99089 Erfurt, Thüringen, Deutschland",
  },
  /** Téléphone & WhatsApp (format international pour liens tel: / wa.me) */
  contact: {
    phoneDisplay: "01573 7604191",
    phoneE164: "+4915737604191",
    whatsappUrl: "https://wa.me/4915737604191",
    email: "bloudanrestaurant0@gmail.com",
    /** Fiche / avis Google (lien recherche locale — à remplacer par un lien maps.app.goo.gl stable si disponible). */
    googleBusinessUrl:
      "https://www.google.com/search?sca_esv=d3b625d2bcd07c3a&sxsrf=ANbL-n7xZI5qao3sWKPJTEd-GlaPTNjZnA:1777494989884&q=Jannat+Bloudan+-+%D8%AC%D9%8E%D9%86%D9%91%D8%A9+%D8%A8%D9%8E%D9%84%D9%8F%D9%88%D8%AF%D8%A7%D9%86+Avis&rflfq=1&num=20&stick=H4sIAAAAAAAAAONgkxI2N7a0NDczNjY0MjI3MTY1MLW02MDI-IrR0CsxLy-xRMEpJ780JTFPQVfhxpqbfTfbbk68sVLhxgogs-Vm_82OG-tvLL_ZpuBYllm8iJV0PQDYoK3MggAAAA&rldimm=7399763312274350598&tbm=lcl&hl=fr-DE&sa=X&ved=2ahUKEwiv6Njr9JOUAxUghv0HHcK2Ia4Q9fQKegQISBAG&biw=1536&bih=695&dpr=1.25#lkt=LocalPoiReviews",
    facebookUrl: "https://www.facebook.com/profile.php?id=61558794623544",
    instagramUrl: "https://www.instagram.com/bloudan_restauran_/",
  },
  /**
   * Horaires pour JSON-LD (Schema.org). Fermeture à minuit : 24:00 le même jour.
   * Ven. & sam. jusqu’à 2h du matin : closes 02:00 (jour calendaire du début de journée).
   */
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification" as const,
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Sunday",
      ] as const,
      opens: "10:00",
      closes: "24:00",
    },
    {
      "@type": "OpeningHoursSpecification" as const,
      dayOfWeek: ["Friday", "Saturday"] as const,
      opens: "10:00",
      closes: "02:00",
    },
  ],
  /** Images Unsplash — ambiance chic, droits d’usage via leur licence */
  images: {
    dining:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2000&q=80",
    mezze:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=2000&q=80",
    events:
      "https://images.unsplash.com/photo-1464366404606-a3988986a6b9?auto=format&fit=crop&w=2000&q=80",
    delivery:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=2000&q=80",
    interior:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c1?auto=format&fit=crop&w=2000&q=80",
    auth:
      "https://images.unsplash.com/photo-1544148103-07729bf555d2?auto=format&fit=crop&w=1200&q=80",
  },
} as const

/**
 * Navigation publique affichée sur la homepage et sur l'ensemble du site
 * pour les visiteurs. N'expose JAMAIS les interfaces staff/admin.
 */
export const SITE_NAV = [
  { href: "/", label: "Accueil", key: "home" },
  { href: "/menu", label: "Menu", key: "menu" },
  { href: "/reservation", label: "Réservation", key: "reservation" },
  { href: "/events", label: "Événements", key: "events" },
  { href: "/#about", label: "À propos", key: "about" },
  { href: "/#contact", label: "Contact", key: "contact" },
] as const
