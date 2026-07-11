const DB_ERROR_RE =
  /2350\d|violates|foreign key|duplicate key|insert into|update .* set|relation .* does not exist|syntax error/i

/** Maps raw Postgres / Supabase errors to cashier-friendly French messages. */
export function friendlyPaymentError(
  raw: string | undefined | null,
  fallback = "Le paiement n'a pas pu être enregistré. Veuillez réessayer.",
): string {
  if (!raw?.trim()) return fallback
  const msg = raw.trim()
  if (!DB_ERROR_RE.test(msg)) return msg

  const lower = msg.toLowerCase()
  if (lower.includes("processed_by") || lower.includes("cashier_id") || lower.includes("foreign key")) {
    return "Impossible d'associer le caissier à cet encaissement. Le paiement n'a pas été enregistré — contactez un administrateur."
  }
  if (lower.includes("duplicate") || lower.includes("23505")) {
    return "Cet encaissement semble déjà enregistré."
  }
  if (lower.includes("invoice") && lower.includes("foreign key")) {
    return "Facture introuvable ou plus valide."
  }
  return fallback
}
