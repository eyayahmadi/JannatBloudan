import type { DigitalMenuProduct } from "@/lib/menu/digital-menu-product"
import type { Station } from "@/lib/stations/config"
import {
  AVAILABILITY_META,
  type StationAvailability,
  type StationAvailabilityStatus,
} from "@/lib/stations/availability"

/** Produit commandable : dispo produit + station OPEN ou BUSY */
export function isProductOrderable(p: DigitalMenuProduct): boolean {
  return p.can_order === true
}

export function stationBadgeForProduct(
  p: DigitalMenuProduct,
  stationAvailability: StationAvailability[],
): { label: string; tone: "ok" | "warn" | "muted" | "danger" } | null {
  const station = (p.station ?? "KITCHEN") as Station
  const avail = stationAvailability.find((a) => a.station === station)
  const status = (avail?.status ?? "OPEN") as StationAvailabilityStatus
  const meta = AVAILABILITY_META[status]

  if (status === "OPEN") {
    if (!p.can_order && p.availability === "out") {
      return { label: "Ausverkauft", tone: "muted" }
    }
    return null
  }

  if (status === "BUSY") {
    const wait = avail?.estimated_wait_minutes
    return {
      label: wait ? `Hohe Wartezeit · ~${wait} Min` : "Hohe Wartezeit",
      tone: "warn",
    }
  }

  if (status === "CLOSING_SOON") {
    return { label: "Schließt bald", tone: "warn" }
  }

  if (status === "PAUSED") {
    return { label: "Bestellung pausiert", tone: "muted" }
  }

  if (status === "CLOSED") {
    if (station === "BAR") return { label: "Bar geschlossen", tone: "danger" }
    if (station === "SHISHA") return { label: "Shisha geschlossen", tone: "danger" }
    return { label: "Küche geschlossen", tone: "danger" }
  }

  return meta ? { label: status, tone: meta.tone } : null
}

export function stationBlockMessage(station: Station, status: StationAvailabilityStatus): string {
  if (station === "BAR" && (status === "CLOSED" || status === "PAUSED")) {
    return "Die Bar ist derzeit geschlossen. Bitte wählen Sie ein anderes Produkt."
  }
  if (station === "SHISHA" && (status === "CLOSED" || status === "PAUSED")) {
    return "Shisha ist derzeit geschlossen. Bitte wählen Sie ein anderes Produkt."
  }
  if (station === "KITCHEN" && (status === "CLOSED" || status === "PAUSED")) {
    return "Die Küche ist derzeit geschlossen. Bitte wählen Sie ein anderes Produkt."
  }
  if (status === "BUSY") return "Längere Wartezeit an dieser Station."
  return "Dieses Produkt ist momentan nicht bestellbar."
}

export function staffMenuCategories(
  catalog: DigitalMenuProduct[],
  apiCategories: Array<{ name: string; slug: string; section?: string }>,
): string[] {
  const fromApi = apiCategories.map((c) => c.name).filter(Boolean)
  if (fromApi.length > 0) return ["Tout", ...fromApi]
  const sections = new Set(catalog.map((p) => p.categoryName || p.category))
  return ["Tout", ...Array.from(sections).sort()]
}

export function filterStaffMenu(
  catalog: DigitalMenuProduct[],
  category: string,
  search: string,
): DigitalMenuProduct[] {
  const q = search.trim().toLowerCase()
  return catalog.filter((p) => {
    if (category !== "Tout" && p.categoryName !== category && p.category !== category) return false
    if (!q) return true
    const hay = [p.name, p.name_ar ?? "", p.description, p.categoryName].join(" ").toLowerCase()
    return hay.includes(q)
  })
}
