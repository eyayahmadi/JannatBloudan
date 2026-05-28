/**
 * Station availability — types, defaults, helpers (client + server safe).
 * ----------------------------------------------------------------------
 * Une station de production peut être dans 5 états :
 *   - OPEN          : accepte les commandes, fonctionnement normal
 *   - BUSY          : accepte mais avec un temps d'attente plus long
 *   - PAUSED        : nouvelles commandes bloquées (existantes continuent)
 *   - CLOSING_SOON  : prévient client/serveur que la station ferme bientôt
 *   - CLOSED        : aucune nouvelle commande, items masqués dans le menu
 *
 * Les helpers ci-dessous sont utilisés à la fois côté serveur (validation
 * API, menu DB) et côté client (badges, garde panier, KDS).
 */

import type { Station } from "./config"

export type StationAvailabilityStatus =
  | "OPEN"
  | "BUSY"
  | "PAUSED"
  | "CLOSING_SOON"
  | "CLOSED"

export const STATION_AVAILABILITY_STATUSES: StationAvailabilityStatus[] = [
  "OPEN",
  "BUSY",
  "PAUSED",
  "CLOSING_SOON",
  "CLOSED",
]

export type StationAvailability = {
  station: Station
  status: StationAvailabilityStatus
  /** Raison libre (visible côté staff, parfois côté client). */
  reason?: string | null
  /** Délai d'attente affiché si BUSY ou CLOSING_SOON. */
  estimated_wait_minutes?: number | null
  /** ISO date — utilisé pour CLOSING_SOON ("ferme à 22h30"). */
  closes_at?: string | null
  /** Auteur de la dernière mise à jour. */
  updated_by?: string | null
  updated_at?: string
}

export type StationAvailabilityMeta = {
  i18nKey: string
  badgeI18nKey: string
  /** Le client peut-il commander ce produit ? */
  acceptingOrders: boolean
  /** L'item doit-il être masqué (vs juste affiché avec un badge) ? */
  hideInMenu: boolean
  /** Variant Tailwind utilisé pour les badges. */
  tone: "ok" | "warn" | "muted" | "danger"
}

export const AVAILABILITY_META: Record<StationAvailabilityStatus, StationAvailabilityMeta> = {
  OPEN: {
    i18nKey: "stations.availability.open",
    badgeI18nKey: "stations.availability.openBadge",
    acceptingOrders: true,
    hideInMenu: false,
    tone: "ok",
  },
  BUSY: {
    i18nKey: "stations.availability.busy",
    badgeI18nKey: "stations.availability.busyBadge",
    acceptingOrders: true,
    hideInMenu: false,
    tone: "warn",
  },
  PAUSED: {
    i18nKey: "stations.availability.paused",
    badgeI18nKey: "stations.availability.pausedBadge",
    acceptingOrders: false,
    hideInMenu: true,
    tone: "muted",
  },
  CLOSING_SOON: {
    i18nKey: "stations.availability.closingSoon",
    badgeI18nKey: "stations.availability.closingSoonBadge",
    acceptingOrders: true,
    hideInMenu: false,
    tone: "warn",
  },
  CLOSED: {
    i18nKey: "stations.availability.closed",
    badgeI18nKey: "stations.availability.closedBadge",
    acceptingOrders: false,
    hideInMenu: true,
    tone: "danger",
  },
}

export function isAcceptingOrders(status: StationAvailabilityStatus): boolean {
  return AVAILABILITY_META[status].acceptingOrders
}

export function shouldHideInMenu(status: StationAvailabilityStatus): boolean {
  return AVAILABILITY_META[status].hideInMenu
}

export function defaultStationAvailability(station: Station): StationAvailability {
  return {
    station,
    status: "OPEN",
    reason: null,
    estimated_wait_minutes: null,
    closes_at: null,
    updated_at: new Date().toISOString(),
  }
}

export function isValidAvailabilityStatus(s: unknown): s is StationAvailabilityStatus {
  return typeof s === "string" && (STATION_AVAILABILITY_STATUSES as string[]).includes(s)
}

/** Message court (i18n) à afficher côté client quand la commande est bloquée. */
export function clientBlockedMessageKey(
  status: StationAvailabilityStatus,
  station: Station,
): string {
  if (status === "PAUSED" || status === "CLOSED") {
    if (station === "KITCHEN") return "stations.client.kitchenClosed"
    if (station === "BAR") return "stations.client.barClosed"
    return "stations.client.shishaClosed"
  }
  if (status === "BUSY") return "stations.client.longerWait"
  if (status === "CLOSING_SOON") return "stations.client.closingSoon"
  return "stations.client.open"
}
