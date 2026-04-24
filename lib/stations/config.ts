/**
 * Multi-Station Orders — Configuration
 * -------------------------------------
 * Definit les 3 stations du restaurant: Cuisine, Bar, Chicha.
 * Chaque item de commande est dispatche vers une station selon son categorie.
 */

export type Station = "KITCHEN" | "BAR" | "SHISHA"

export type ItemStatus = "new" | "preparing" | "ready" | "served"

export const STATIONS: Station[] = ["KITCHEN", "BAR", "SHISHA"]

/**
 * Ordre d'avancement du statut d'un item.
 * Sert a calculer le bouton "next".
 */
export const NEXT_ITEM_STATUS: Partial<Record<ItemStatus, ItemStatus>> = {
  new: "preparing",
  preparing: "ready",
  ready: "served",
}

export type StationMeta = {
  /** Cle de traduction dans messages.stations.* */
  i18nKey: string
  /** Chemin de la page dediee */
  href: string
  /** Emoji caracteristique */
  emoji: string
  /** Classe Tailwind primaire (accent) */
  accent: string
  /** Couleur du gradient (hex/rgb) */
  gradient: string
  /** Temps moyen de preparation en minutes */
  avgPrepMinutes: number
  /** Priorite servir (bas = prioritaire). Drinks first, food second, shisha last */
  priority: number
}

export const STATION_META: Record<Station, StationMeta> = {
  KITCHEN: {
    i18nKey: "stations.kitchen",
    href: "/kitchen",
    emoji: "🍽️",
    accent: "amber",
    gradient: "from-amber-500 via-orange-500 to-red-600",
    avgPrepMinutes: 15,
    priority: 2,
  },
  BAR: {
    i18nKey: "stations.bar",
    href: "/bar",
    emoji: "🍹",
    accent: "cyan",
    gradient: "from-cyan-500 via-sky-500 to-blue-600",
    avgPrepMinutes: 3,
    priority: 1,
  },
  SHISHA: {
    i18nKey: "stations.shisha",
    href: "/shisha",
    emoji: "💨",
    accent: "violet",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-600",
    avgPrepMinutes: 7,
    priority: 3,
  },
}

export const ITEM_STATUS_META: Record<
  ItemStatus,
  { i18nKey: string; color: "blue" | "orange" | "green" | "slate" }
> = {
  new: { i18nKey: "stations.status.new", color: "blue" },
  preparing: { i18nKey: "stations.status.preparing", color: "orange" },
  ready: { i18nKey: "stations.status.ready", color: "green" },
  served: { i18nKey: "stations.status.served", color: "slate" },
}

/**
 * Statut par station (agrege sur tous les items).
 * Si au moins un item "preparing" → preparing
 * Si tous "ready" ou "served" → ready
 */
export function computeStationStatus(
  itemStatuses: ItemStatus[],
): ItemStatus {
  if (itemStatuses.length === 0) return "new"
  if (itemStatuses.every((s) => s === "served")) return "served"
  if (itemStatuses.every((s) => s === "ready" || s === "served")) return "ready"
  if (itemStatuses.some((s) => s === "preparing")) return "preparing"
  return "new"
}
