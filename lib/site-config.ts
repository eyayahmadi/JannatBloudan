export const SITE = {
  name: "Jannat Baloudan",
  tagline: "Restaurant syrien authentique",
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
