/** Montant déjà encaissé / reste à payer sur une facture. */

export type InvoicePaymentFields = {
  status?: string | null
  total?: unknown
  payment_split?: Array<{ amount?: number }> | null
}

export function invoiceAmountPaid(inv: InvoicePaymentFields): number {
  const status = String(inv.status ?? "").toLowerCase()
  const total = Number(inv.total ?? 0)
  const split = Array.isArray(inv.payment_split) ? inv.payment_split : []
  const splitPaid = split.reduce((sum, part) => sum + Number(part.amount ?? 0), 0)

  if (status === "paid") {
    return split.length > 0 ? splitPaid : total
  }
  return Math.max(0, splitPaid)
}

export function invoiceRemaining(inv: InvoicePaymentFields): number {
  const total = Number(inv.total ?? 0)
  return Math.max(0, total - invoiceAmountPaid(inv))
}
