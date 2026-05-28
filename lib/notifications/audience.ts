/**
 * Notification audience helpers
 * --------------------------------
 * Toutes les notifications applicatives passent par `useNotifications().add()`.
 * Le hook filtre côté client en se basant sur le tableau `audience` de chaque
 * notification. Règles globales :
 *
 *   - ADMIN voit TOUTES les notifications, peu importe `audience`.
 *   - Les autres rôles ne voient une notification que si leur rôle est
 *     explicitement listé dans `audience` (ou dans le défaut associé au type).
 *
 * Ce module fournit :
 *   - `audienceForStation(station)`        → audience pour une notif liée à 1 station
 *   - `audienceForStations(stations)`      → idem multi-stations (commande mixte)
 *   - `audienceForStationsFromItems(items)`→ déduit l'audience à partir d'items
 *   - `cashierAudience()`, `serverAudience()`, `deliveryAudience()` : helpers ciblés
 *
 * Important : on n'inclut JAMAIS `CLIENT` par défaut dans une audience staff.
 */

import type { AppRole } from "@/lib/auth/roles"
import { STATIONS, type Station } from "@/lib/stations/config"
import { inferStation } from "@/lib/stations/inference"

const STATION_TO_ROLE: Record<Station, AppRole> = {
  KITCHEN: "KITCHEN",
  BAR: "BAR",
  SHISHA: "SHISHA",
}

/** Audience minimale pour une notification interne à une station. */
export function audienceForStation(station: Station): AppRole[] {
  return ["ADMIN", STATION_TO_ROLE[station]]
}

/** Audience pour une commande qui touche plusieurs stations à la fois. */
export function audienceForStations(stations: Iterable<Station>): AppRole[] {
  const set = new Set<AppRole>(["ADMIN"])
  for (const s of stations) {
    if (STATIONS.includes(s)) set.add(STATION_TO_ROLE[s])
  }
  return Array.from(set)
}

/**
 * Calcule l'audience à partir des items d'une commande.
 * - Si chaque item connaît déjà sa `station`, on l'utilise.
 * - Sinon on infère depuis le nom (heuristique inferStation).
 */
export function audienceForStationsFromItems(
  items: Array<{ name: string; station?: Station | null }>,
): AppRole[] {
  const stations = new Set<Station>()
  for (const it of items) {
    const s = it.station && STATIONS.includes(it.station) ? it.station : inferStation(it.name)
    stations.add(s)
  }
  return audienceForStations(stations)
}

/** Audience caisse (encaissement, sortie de caisse, totaux). */
export function cashierAudience(): AppRole[] {
  return ["ADMIN", "CASHIER"]
}

/** Audience serveur (item prêt à servir, alerte table, refus à expliquer). */
export function serverAudience(): AppRole[] {
  return ["ADMIN", "SERVER"]
}

/** Audience livreur (assignation, statut de livraison). */
export function deliveryAudience(): AppRole[] {
  return ["ADMIN", "DELIVERY"]
}

/** Notification visible uniquement par l'admin. */
export function adminOnlyAudience(): AppRole[] {
  return ["ADMIN"]
}

/**
 * Audience pour un événement « chaîne de service » :
 * la station qui a refusé/livré + le serveur + la caisse + admin.
 */
export function stationServiceChainAudience(station: Station): AppRole[] {
  return ["ADMIN", "SERVER", "CASHIER", STATION_TO_ROLE[station]]
}
