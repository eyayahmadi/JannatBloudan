/**
 * Client Credit (kridi) — types & helpers
 * ---------------------------------------
 * Modélise l'état "côté client" d'une facture : PAID / UNPAID / PARTIALLY_PAID
 * / CREDIT / OVERDUE. Distinct du workflow facture (`invoices.status`).
 */

export const CREDIT_PAYMENT_STATES = [
  "PAID",
  "UNPAID",
  "PARTIALLY_PAID",
  "CREDIT",
  "OVERDUE",
] as const

export type CreditPaymentState = (typeof CREDIT_PAYMENT_STATES)[number]

export const CREDIT_REASONS = [
  "trusted_regular",
  "vip",
  "internal_partner",
  "supplier_employee",
  "argument_pending",
  "card_decline",
  "other",
] as const

export type CreditReason = (typeof CREDIT_REASONS)[number]

export const CREDIT_PAYMENT_METHODS = [
  "cash",
  "card",
  "online",
  "bank_transfer",
  "wallet",
  "other",
] as const

export type CreditPaymentMethod = (typeof CREDIT_PAYMENT_METHODS)[number]

export const REMINDER_CHANNELS = ["manual", "email", "sms", "whatsapp", "phone"] as const

export type ReminderChannel = (typeof REMINDER_CHANNELS)[number]

/** Libellés FR pour l'UI. */
export const CREDIT_STATE_LABEL: Record<CreditPaymentState, string> = {
  PAID: "Payée",
  UNPAID: "Impayée",
  PARTIALLY_PAID: "Partiellement payée",
  CREDIT: "Crédit (kridi)",
  OVERDUE: "En retard",
}

export const CREDIT_STATE_TONE: Record<
  CreditPaymentState,
  "emerald" | "amber" | "orange" | "violet" | "rose"
> = {
  PAID: "emerald",
  UNPAID: "amber",
  PARTIALLY_PAID: "orange",
  CREDIT: "violet",
  OVERDUE: "rose",
}

export const CREDIT_REASON_LABEL: Record<CreditReason, string> = {
  trusted_regular: "Client fidèle",
  vip: "Client VIP",
  internal_partner: "Partenaire interne",
  supplier_employee: "Employé / fournisseur",
  argument_pending: "Litige en attente",
  card_decline: "Carte refusée — paiement différé",
  other: "Autre",
}

const TWO_HUNDREDTHS = 0.02

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Détermine le `payment_state` côté caisse à partir des montants.
 * Identique en logique à `recompute_invoice_credit_state()` côté SQL (gardé
 * en sync pour les UIs qui n'ont pas encore reload la facture).
 */
export function deriveCreditState(input: {
  total: number
  paid: number
  dueAt?: string | null
  /** Marqué explicitement "credit" (kridi) par le caissier ? */
  creditMarked: boolean
  now?: Date
}): { state: CreditPaymentState; remaining: number } {
  const total = round2(Number(input.total ?? 0))
  const paid = round2(Number(input.paid ?? 0))
  const remaining = Math.max(0, round2(total - paid))
  const now = input.now ?? new Date()
  const due = input.dueAt ? new Date(input.dueAt) : null
  const overdue = Boolean(due && !Number.isNaN(due.getTime()) && due.getTime() < now.getTime())

  if (remaining <= TWO_HUNDREDTHS) return { state: "PAID", remaining: 0 }

  if (paid > TWO_HUNDREDTHS) {
    if (overdue) return { state: "OVERDUE", remaining }
    if (input.creditMarked) return { state: "CREDIT", remaining }
    return { state: "PARTIALLY_PAID", remaining }
  }

  if (overdue) return { state: "OVERDUE", remaining }
  if (input.creditMarked) return { state: "CREDIT", remaining }
  return { state: "UNPAID", remaining }
}

/** Réduit toute valeur arbitraire à un `CreditPaymentState` connu (fallback UNPAID). */
export function normalizeCreditState(raw: unknown): CreditPaymentState {
  if (typeof raw !== "string") return "UNPAID"
  const up = raw.trim().toUpperCase()
  return (CREDIT_PAYMENT_STATES as readonly string[]).includes(up)
    ? (up as CreditPaymentState)
    : "UNPAID"
}
