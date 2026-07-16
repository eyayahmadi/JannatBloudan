/** Ticket id format: T{table}-{digits} */
const TICKET_ID_RE = /\bT\d{1,4}-\d{3,6}\b/

/** Remove HTML/SVG fragments accidentally stored in text fields. */
export function stripMarkupText(raw: string | null | undefined): string {
  if (raw == null) return ""
  return String(raw)
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
}

/** Keep a single clean ticket id when extra text was concatenated. */
export function normalizeOrderNumber(raw: string | null | undefined): string {
  const clean = stripMarkupText(raw)
  const matches = clean.match(new RegExp(TICKET_ID_RE.source, "g"))
  if (matches?.length) return matches[0]
  return clean
}

export function normalizeProductLabel(raw: string | null | undefined): string {
  return stripMarkupText(raw)
}
