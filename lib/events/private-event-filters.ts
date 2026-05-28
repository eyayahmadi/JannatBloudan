/** Filtres « devis envoyé » = en revue + au moins un devis envoyé. */
export function requestMatchesFilter(
  row: {
    status: string
    quotes?: Array<{ status?: string | null }> | null
  },
  filter: string,
): boolean {
  if (filter === "all") return true
  if (filter === "quoted") {
    if (row.status !== "reviewing") return false
    const qs = row.quotes ?? []
    return qs.some((q) => String(q.status ?? "").toLowerCase() === "sent")
  }
  return row.status === filter
}
