/**
 * Multi-Station Orders — Configuration
 * -------------------------------------
 * Definit les 3 stations du restaurant: Cuisine, Bar, Chicha.
 * Chaque item de commande est dispatche vers une station selon son categorie.
 */

export type Station = "KITCHEN" | "BAR" | "SHISHA"

/**
 * Cycle de vie complet d'un item côté station :
 *   new → accepted → preparing → ready → served
 *
 * Branches de sortie possibles à tout moment :
 *   refused / replacement_requested / replaced / cancelled / waste
 */
export type ItemStatus =
  | "new"
  | "accepted"
  | "preparing"
  | "ready"
  | "served"
  | "refused"
  | "replacement_requested"
  | "replaced"
  | "cancelled"
  | "waste"

export const STATIONS: Station[] = ["KITCHEN", "BAR", "SHISHA"]

/**
 * Avancement linéaire d'un item (cycle "happy path").
 * Sert au bouton "next" du KDS.
 */
export const NEXT_ITEM_STATUS: Partial<Record<ItemStatus, ItemStatus>> = {
  new: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "served",
}

/** Statuts considérés comme « actifs » dans la file d'attente d'une station. */
export const ACTIVE_ITEM_STATUSES: ItemStatus[] = ["new", "accepted", "preparing", "ready"]

/** Statuts qui marquent un item comme retiré du flux normal. */
export const TERMINAL_ITEM_STATUSES: ItemStatus[] = [
  "served",
  "refused",
  "replaced",
  "cancelled",
  "waste",
]

/** Statuts qui sortent l'item de la facture client. */
export const NON_BILLABLE_ITEM_STATUSES: ItemStatus[] = [
  "refused",
  "replaced",
  "cancelled",
  "waste",
]

export function isActiveItemStatus(s: ItemStatus): boolean {
  return ACTIVE_ITEM_STATUSES.includes(s)
}

export function isBillableItemStatus(s: ItemStatus): boolean {
  return !NON_BILLABLE_ITEM_STATUSES.includes(s)
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
  { i18nKey: string; color: "blue" | "orange" | "green" | "slate" | "red" | "purple" | "amber" }
> = {
  new: { i18nKey: "stations.status.new", color: "blue" },
  accepted: { i18nKey: "stations.status.accepted", color: "amber" },
  preparing: { i18nKey: "stations.status.preparing", color: "orange" },
  ready: { i18nKey: "stations.status.ready", color: "green" },
  served: { i18nKey: "stations.status.served", color: "slate" },
  refused: { i18nKey: "stations.status.refused", color: "red" },
  replacement_requested: { i18nKey: "stations.status.replacementRequested", color: "purple" },
  replaced: { i18nKey: "stations.status.replaced", color: "purple" },
  cancelled: { i18nKey: "stations.status.cancelled", color: "red" },
  waste: { i18nKey: "stations.status.waste", color: "red" },
}

/**
 * Statut par station (agrege sur tous les items).
 * Si au moins un item "preparing" → preparing
 * Si tous "ready" ou "served" → ready
 * Les items annulés / refusés / remplacés sont ignorés dans l'agrégation.
 */
export function computeStationStatus(itemStatuses: ItemStatus[]): ItemStatus {
  const active = itemStatuses.filter(
    (s) => s !== "cancelled" && s !== "refused" && s !== "replaced" && s !== "waste",
  )
  if (active.length === 0) return "new"
  if (active.every((s) => s === "served")) return "served"
  if (active.every((s) => s === "ready" || s === "served")) return "ready"
  if (active.some((s) => s === "preparing")) return "preparing"
  if (active.every((s) => s === "accepted" || s === "ready" || s === "served")) return "accepted"
  return "new"
}
