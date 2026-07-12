/**
 * Statuts table unifiés — une seule énumération pour QR, serveur, caisse, admin.
 */

export type UnifiedTableStatus =
  | "LIBRE"
  | "OCCUPIED"
  | "RESERVED"
  | "ORDER_IN_PROGRESS"
  | "WAITING_PREPARATION"
  | "READY_TO_SERVE"
  | "BILL_REQUESTED"
  | "PAYMENT_PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CLEANING"
  | "CLOSED"

export const UNIFIED_TABLE_STATUS_META: Record<
  UnifiedTableStatus,
  { label: string; short: string; tone: string }
> = {
  LIBRE: { label: "Libre", short: "Libre", tone: "green" },
  OCCUPIED: { label: "Occupée", short: "Occupée", tone: "yellow" },
  RESERVED: { label: "Réservée", short: "Réservée", tone: "indigo" },
  ORDER_IN_PROGRESS: { label: "Commande en cours", short: "Commande", tone: "yellow" },
  WAITING_PREPARATION: { label: "En préparation", short: "Prépa", tone: "orange" },
  READY_TO_SERVE: { label: "Prêt à servir", short: "Prêt", tone: "blue" },
  BILL_REQUESTED: { label: "Addition demandée", short: "Addition", tone: "rose" },
  PAYMENT_PENDING: { label: "Paiement en attente", short: "À payer", tone: "rose" },
  PARTIALLY_PAID: { label: "Partiellement payée", short: "Partiel", tone: "orange" },
  PAID: { label: "Payée", short: "Payée", tone: "gray" },
  CLEANING: { label: "À nettoyer", short: "Nettoyage", tone: "teal" },
  CLOSED: { label: "Fermée", short: "Fermée", tone: "gray" },
}

type OverviewRow = {
  restaurant_status?: string | null
  payment_status_code?: string
  has_payment_request_alert?: boolean
  cleaning_since?: string | null
  session?: { id?: string } | null
}

/** Mappe une ligne tables-overview vers le statut canonique. */
export function mapOverviewToUnifiedStatus(row: OverviewRow): UnifiedTableStatus {
  const pay = String(row.payment_status_code ?? "FREE").toUpperCase()
  const db = String(row.restaurant_status ?? "").toUpperCase()

  if (pay === "NEEDS_CLEANING" || db === "CLEANING" || db === "NEEDS_CLEANING") return "CLEANING"
  if (pay === "PAID" && db !== "CLEANING") return "PAID"
  if (pay === "PARTIAL") return "PARTIALLY_PAID"
  if (pay === "PAYMENT_REQUESTED" || row.has_payment_request_alert) return "BILL_REQUESTED"
  if (pay === "READY_TO_PAY" || pay === "UNPAID") return "PAYMENT_PENDING"
  if (db === "RESERVED") return "RESERVED"
  if (db === "READY") return "READY_TO_SERVE"
  if (db === "IN_KITCHEN" || db === "ORDERING") return "WAITING_PREPARATION"
  if (pay === "ORDER_IN_PROGRESS") return "ORDER_IN_PROGRESS"
  if (db === "CLEANING") return "CLEANING"
  if (db === "CLOSED" || db === "INACTIVE") return "CLOSED"
  if (row.session?.id || pay === "OCCUPIED" || db === "OCCUPIED" || db === "FREE" && pay !== "FREE") {
    if (!row.session?.id && pay === "FREE") return "LIBRE"
    return db === "ORDERING" ? "ORDER_IN_PROGRESS" : "OCCUPIED"
  }
  return "LIBRE"
}
