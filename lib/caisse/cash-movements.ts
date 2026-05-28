/**
 * Agrège les sorties de caisse nettes pour une période (sorties − annulations).
 * Les montants sont toujours positifs en base pour sortie_caisse et annulation_sortie.
 */
export function netSortieCaisseFromRows(rows: { kind?: string | null; amount?: unknown }[]) {
  let sum = 0
  for (const m of rows) {
    const k = String(m.kind ?? "").toLowerCase()
    const a = Number((m as { amount?: unknown }).amount ?? 0)
    if (!Number.isFinite(a)) continue
    if (k === "sortie_caisse") sum += a
    else if (k === "annulation_sortie") sum -= a
  }
  return Math.round(sum * 100) / 100
}
