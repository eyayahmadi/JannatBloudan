import type { ParticipantTicket } from "@/lib/events/tickets-store"

export type EventPricingRow = {
  price?: number | null
  price_adult?: number | null
  price_child?: number | null
  price_vip?: number | null
  price_group?: number | null
  group_party_size?: number | null
}

export function adultUnitPrice(ev: EventPricingRow): number {
  const v = ev.price_adult ?? ev.price ?? 0
  const n = Number(v)
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

export function childUnitPrice(ev: EventPricingRow, adultPx: number): number {
  if (ev.price_child != null) {
    const n = Number(ev.price_child)
    if (Number.isFinite(n)) return Math.max(0, n)
  }
  return Math.round(adultPx * 0.6 * 100) / 100
}

export function vipUnitPrice(ev: EventPricingRow, adultPx: number): number {
  if (ev.price_vip != null) {
    const n = Number(ev.price_vip)
    if (Number.isFinite(n)) return Math.max(0, n)
  }
  return adultPx * 1.5
}

export function groupPartySize(ev: EventPricingRow): number {
  const n = Number(ev.group_party_size ?? 6)
  return Number.isFinite(n) && n >= 2 ? Math.floor(n) : 6
}

export function groupUnitPrice(ev: EventPricingRow, adultPx: number): number {
  if (ev.price_group != null) {
    const n = Number(ev.price_group)
    if (Number.isFinite(n)) return Math.max(0, n)
  }
  return Math.round(adultPx * Math.max(2, groupPartySize(ev)) * 0.85 * 100) / 100
}

/** Places consommées par un ticket pour la capacité événement. */
export function ticketHeadcount(t: ParticipantTicket, groupSize: number): number {
  const gs = Number.isFinite(groupSize) && groupSize >= 1 ? Math.floor(groupSize) : 6
  const vip = Math.max(0, t.vipSeats ?? 0)
  const pk = Math.max(0, t.groupPackages ?? 0)
  return t.adults + t.children + vip + pk * gs
}

export function computeTicketTotal(
  ev: EventPricingRow,
  adults: number,
  children: number,
  vipSeats: number,
  groupPackages: number,
): number {
  const ua = adultUnitPrice(ev)
  const uc = childUnitPrice(ev, ua)
  const uv = vipUnitPrice(ev, ua)
  const ug = groupUnitPrice(ev, ua)
  const gs = groupPartySize(ev)
  const total =
    adults * ua + children * uc + vipSeats * uv + groupPackages * ug
  return Math.round(total * 100) / 100
}
