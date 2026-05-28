/** Pure recommendation logic for the client AI concierge (no LLM). */

import type { AccountDashboardNavigateId } from "./dashboard-nav"

export type ConciergeInsight = {
  id: string
  category: "orders" | "loyalty" | "promo" | "reservation" | "event" | "time" | "pairing" | "weather"
  title: string
  body: string
  cta: string
  nav?: AccountDashboardNavigateId
  /** External link (e.g. login) when `nav` is not used. */
  href?: string
  priority: number
}

type Favorite = { name: string; orders: number }

export type ConciergeOrderRow = {
  created_at?: string
  total?: number | string | null
  order_items?: Array<{
    product_name?: string | null
    products?: { name?: string | null } | null
  }>
}

type ReservationRow = {
  reservation_date?: string
  reservation_time?: string
  status?: string | null
}

type EventRow = {
  title?: string
  event_date?: string
  start_time?: string
}

type Promo = { title: string; subtitle: string; code: string | null }

type TierInfo = { label: string; nextAt: number; prevAt: number }

function tierFromPoints(points: number): TierInfo {
  if (points >= 700) return { label: "VIP", nextAt: 1000, prevAt: 700 }
  if (points >= 350) return { label: "Gold", nextAt: 700, prevAt: 350 }
  if (points >= 150) return { label: "Silver", nextAt: 350, prevAt: 150 }
  return { label: "Membre", nextAt: 150, prevAt: 0 }
}

function normalizeEmail(e: string) {
  return e.trim().toLowerCase()
}

function collectProductNames(orders: ConciergeOrderRow[]): string[] {
  const names: string[] = []
  for (const o of orders) {
    for (const li of o.order_items ?? []) {
      const n = (li.product_name || li.products?.name || "").trim()
      if (n) names.push(n)
    }
  }
  return names
}

function habitPhrase(names: string[]): string | null {
  if (names.length === 0) return null
  const joined = names.join(" ").toLowerCase()
  if (/grill|chiche|kebab|shawarma|mezze|mezzé|orient|syrien|falafel/.test(joined)) {
    return "les grillades et saveurs syriennes"
  }
  if (/pizza|burger|pasta|pâte|carbonara/.test(joined)) {
    return "nos classiques occidentaux"
  }
  if (/salade|fattoush|taboul/.test(joined)) {
    return "les salades et mezzés frais"
  }
  return null
}

function nextFridayEvening(): string {
  const d = new Date()
  const day = d.getDay()
  const add = (5 - day + 7) % 7 || 7
  const t = new Date(d)
  t.setDate(d.getDate() + add)
  return t.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
}

export type ConciergeContextInput = {
  firstName: string
  isLoggedIn: boolean
  loyaltyPoints: number
  favorites: Favorite[]
  /** Real orders (e.g. from API, filtered by e-mail). */
  orders: ConciergeOrderRow[]
  /** Real reservations filtered by guest e-mail. */
  reservations: ReservationRow[]
  /** Upcoming events from API (optional). */
  events: EventRow[]
  promos: Promo[]
  /** Demo / dashboard fallbacks when API is empty. */
  fallbackOrderLabels: string[]
  fallbackReservationDate?: string | null
  fallbackEventTitle?: string | null
  /** Open-Meteo current temperature °C if fetched. */
  weatherTempC?: number | null
}

export function buildConciergeInsights(ctx: ConciergeContextInput): ConciergeInsight[] {
  const insights: ConciergeInsight[] = []
  const hour = new Date().getHours()
  const month = new Date().getMonth()
  const tier = tierFromPoints(ctx.loyaltyPoints)
  const pointsToNext = Math.max(0, tier.nextAt - ctx.loyaltyPoints)
  const segment = Math.max(1, tier.nextAt - tier.prevAt)
  const closeToTier =
    ctx.loyaltyPoints >= tier.prevAt &&
    pointsToNext > 0 &&
    pointsToNext <= Math.max(12, Math.ceil(segment * 0.22))

  const sortedFav = [...ctx.favorites].sort((a, b) => b.orders - a.orders)
  const topFav = sortedFav[0]
  const secondFav = sortedFav[1]

  const namesFromOrders = collectProductNames(ctx.orders)
  const habit = habitPhrase(namesFromOrders)
  const lastOrder = ctx.orders[0]
  const lastLabel =
    namesFromOrders[0] ||
    ctx.fallbackOrderLabels[0] ||
    (lastOrder?.order_items?.[0]?.product_name as string | undefined) ||
    null

  const today = new Date().toISOString().slice(0, 10)
  const upcomingRes = ctx.reservations
    .filter((r) => r.reservation_date && r.reservation_date >= today && r.status !== "cancelled")
    .sort((a, b) => (a.reservation_date! + (a.reservation_time || "")).localeCompare(b.reservation_date! + (b.reservation_time || "")))[0]

  const upcomingFromApi = ctx.events
    .filter((e) => e.event_date && e.event_date >= today)
    .sort((a, b) => (a.event_date! + (a.start_time || "")).localeCompare(b.event_date! + (b.start_time || "")))[0]

  if (habit && namesFromOrders.length >= 2) {
    insights.push({
      id: "habit",
      category: "orders",
      title: `Vous commandez souvent ${habit}`,
      body: "Profitez du mix grill ou d’un menu mezzé complet — disponible à la carte et en livraison.",
      cta: "Voir le menu",
      nav: "menu",
      priority: 95,
    })
  } else if (topFav && topFav.orders >= 3) {
    insights.push({
      id: "fav-dish",
      category: "orders",
      title: `Vous aimez « ${topFav.name} »`,
      body: "Une réduction fidélité peut s’appliquer sur vos plats préférés ce week-end — vérifiez les codes actifs.",
      cta: "Commander",
      nav: "order",
      priority: 90,
    })
  }

  if (lastLabel && (ctx.orders.length > 0 || ctx.fallbackOrderLabels.length > 0)) {
    insights.push({
      id: "reorder",
      category: "orders",
      title: "Commander à nouveau ?",
      body:
        ctx.orders.length > 0 && lastOrder?.created_at
          ? `Votre dernière commande incluait « ${namesFromOrders[0] || "vos articles habituels"} » (${new Date(lastOrder.created_at).toLocaleDateString("fr-FR")}).`
          : `Repartez sur une commande similaire à « ${lastLabel} » en un clic.`,
      cta: "Recommander",
      nav: "order",
      priority: 92,
    })
  }

  if (closeToTier && ctx.isLoggedIn) {
    const nextName =
      tier.label === "Membre"
        ? "Silver"
        : tier.label === "Silver"
          ? "Gold"
          : tier.label === "Gold"
            ? "VIP"
            : "le sommet du programme"
    insights.push({
      id: "loyalty-near",
      category: "loyalty",
      title: `Plus que ${pointsToNext} pts avant ${nextName}`,
      body: `Vous êtes ${tier.label}. Une commande ou un événement peut vous faire passer le cap rapidement.`,
      cta: "Mes points",
      nav: "loyalty",
      priority: 88,
    })
  } else if (ctx.loyaltyPoints > 0 && pointsToNext > 0) {
    insights.push({
      id: "loyalty-pts",
      category: "loyalty",
      title: `${ctx.loyaltyPoints.toLocaleString("fr-FR")} points disponibles`,
      body: "Échangez-les contre des boissons, desserts ou réductions dans l’espace fidélité.",
      cta: "Utiliser mes points",
      nav: "loyalty",
      priority: 70,
    })
  }

  const promoWithCode = ctx.promos.find((p) => p.code)
  if (promoWithCode) {
    insights.push({
      id: "promo-code",
      category: "promo",
      title: promoWithCode.title,
      body: `${promoWithCode.subtitle}${promoWithCode.code ? ` — code ${promoWithCode.code}.` : ""}`,
      cta: "En profiter",
      nav: "order",
      priority: 85,
    })
  }

  if (hour >= 17 && hour < 19) {
    insights.push({
      id: "happy-hour",
      category: "time",
      title: "Happy hour en cours",
      body: "Boissons à prix doux jusqu’à 19h — idéal avec un plateau mezzé.",
      cta: "Commander une boisson",
      nav: "order",
      priority: 80,
    })
  } else if (hour >= 11 && hour < 15) {
    insights.push({
      id: "lunch",
      category: "time",
      title: "Formule midi",
      body: "Essayez notre formule déjeuner — rapide et généreuse.",
      cta: "Voir le menu",
      nav: "menu",
      priority: 65,
    })
  } else if (hour >= 18 && hour < 22 && !upcomingRes) {
    insights.push({
      id: "reserve-tonight",
      category: "reservation",
      title: "Réserver une table ce soir ?",
      body: "Les créneaux terrasse partent vite le week-end.",
      cta: "Réserver",
      nav: "reserve-table",
      priority: 78,
    })
  }

  if (typeof ctx.weatherTempC === "number") {
    if (ctx.weatherTempC <= 12) {
      insights.push({
        id: "weather-cold",
        category: "weather",
        title: "Météo fraîche",
        body: "Envie de plats réconfortants ? Pensez aux soupes, grills chauds et thés à la menthe.",
        cta: "Découvrir la carte",
        nav: "menu",
        priority: 72,
      })
    } else if (ctx.weatherTempC >= 26) {
      insights.push({
        id: "weather-hot",
        category: "weather",
        title: "Belles journées",
        body: "Rafraîchissez-vous : mocktails, salades fattoush et glaces maison.",
        cta: "Commander",
        nav: "order",
        priority: 72,
      })
    }
  }

  if (month >= 5 && month <= 8) {
    insights.push({
      id: "season",
      category: "time",
      title: "Suggestions d’été",
      body: "Mezzés frais, grillades légères et desserts aux fruits — parfaits pour la saison.",
      cta: "Commander",
      nav: "order",
      priority: 60,
    })
  }

  if (upcomingRes) {
    insights.push({
      id: "res-soon",
      category: "reservation",
      title: "Votre prochaine table",
      body: `Le ${new Date(upcomingRes.reservation_date!).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à ${upcomingRes.reservation_time?.slice(0, 5) ?? ""}.`,
      cta: "Voir mes réservations",
      nav: "reservations",
      priority: 87,
    })
  } else if (ctx.fallbackReservationDate) {
    insights.push({
      id: "res-fallback",
      category: "reservation",
      title: "Réservation à venir",
      body: `Un créneau est prévu le ${new Date(ctx.fallbackReservationDate).toLocaleDateString("fr-FR")}.`,
      cta: "Détails",
      nav: "reservations",
      priority: 75,
    })
  }

  const eventTitle = upcomingFromApi?.title || ctx.fallbackEventTitle
  if (eventTitle) {
    insights.push({
      id: "event-suggest",
      category: "event",
      title: `Événement : ${eventTitle}`,
      body: upcomingFromApi?.event_date
        ? `Le ${new Date(upcomingFromApi.event_date).toLocaleDateString("fr-FR")} — places selon disponibilité.`
        : `Une soirée à ne pas manquer ${nextFridayEvening()}.`,
      cta: "Réserver / billets",
      nav: "reserve-event",
      priority: 84,
    })
  }

  if (topFav && secondFav) {
    insights.push({
      id: "pairing",
      category: "pairing",
      title: "Souvent commandé ensemble",
      body: `Les clients qui aiment « ${topFav.name} » commandent aussi « ${secondFav.name} » — essayez le combo.`,
      cta: "Ajouter au panier",
      nav: "order",
      priority: 68,
    })
  }

  if (!ctx.isLoggedIn) {
    insights.push({
      id: "guest",
      category: "loyalty",
      title: "Connectez-vous",
      body: "Pour des suggestions basées sur vos vraies commandes et votre fidélité, ouvrez une session.",
      cta: "Se connecter",
      href: "/login",
      priority: 50,
    })
  }

  insights.sort((a, b) => b.priority - a.priority)
  const seen = new Set<string>()
  return insights.filter((i) => {
    if (seen.has(i.id)) return false
    seen.add(i.id)
    return true
  }).slice(0, 8)
}

export function filterOrdersByEmail(orders: unknown[], email: string): ConciergeOrderRow[] {
  if (!email) return []
  const n = normalizeEmail(email)
  return (orders as Array<Record<string, unknown>>).filter((o) => {
    const ce = o.customer_email
    return typeof ce === "string" && normalizeEmail(ce) === n
  }) as ConciergeOrderRow[]
}

export function filterReservationsByEmail(reservations: unknown[], email: string): ReservationRow[] {
  if (!email) return []
  const n = normalizeEmail(email)
  return (reservations as Array<Record<string, unknown>>).filter((r) => {
    const ge = r.guest_email
    return typeof ge === "string" && normalizeEmail(ge) === n
  }) as ReservationRow[]
}
