/**
 * Sanitation + résumés + diff pour l’UI journal d’audit (pas de secrets exposés).
 */

const SENSITIVE_KEY_RE =
  /password|passwd|pwd|secret|token|api[_-]?key|authorization|auth_header|bearer|private[_-]?key|access[_-]?token|refresh[_-]?token|cookie|csrf|otp|recovery|credential|ssn|iban|credit|card_number|cvv|\bpin\b|jwt|session[_-]?id/i

export function sanitizeAuditSnapshot(input: unknown): unknown {
  if (input === null || input === undefined) return input
  if (Array.isArray(input)) return input.map(sanitizeAuditSnapshot)
  if (typeof input !== "object") return input
  const obj = input as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEY_RE.test(k)) {
      out[k] = "[masqué]"
      continue
    }
    out[k] = sanitizeAuditSnapshot(v)
  }
  return out
}

const SKIP_DIFF_KEYS = new Set([
  "updated_at",
  "created_at",
  "embedding",
  "search_vector",
  "password_hash",
  "raw_user_meta_data",
  "encrypted_password",
])

const FIELD_LABELS_FR: Record<string, string> = {
  name: "Nom",
  name_ar: "Nom (AR)",
  slug: "Slug",
  description: "Description",
  price: "Prix",
  stock_quantity: "Stock",
  is_available: "Disponibilité",
  category_id: "Catégorie",
  station: "Poste",
  image_url: "Image",
  is_popular: "Populaire",
  is_new: "Nouveau",
  tags: "Tags",
  spice_level: "Épices",
  status: "Statut",
  amount: "Montant",
  total: "Total",
  guest_name: "Client",
  event_date: "Date événement",
  email: "E-mail",
  role: "Rôle",
}

function eqJson(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return a === b
  }
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "—"
  if (typeof v === "boolean") return v ? "Oui" : "Non"
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : String(v)
  if (typeof v === "string") return v.trim() === "" ? "—" : v.length > 200 ? `${v.slice(0, 197)}…` : v
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

function formatEuroIfPrice(key: string, v: unknown): string {
  if ((key === "price" || key.endsWith("_price") || key === "deposit_amount") && typeof v === "number") {
    return `${v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f")} €`
  }
  return formatCell(v)
}

export type AuditDiffRow = {
  key: string
  label: string
  before: string
  after: string
}

export function computeAuditDiff(
  oldVals: Record<string, unknown> | null,
  newVals: Record<string, unknown> | null,
  action: string,
): AuditDiffRow[] {
  const out: AuditDiffRow[] = []
  const oldFlat = flattenOneLevel(oldVals)
  const newFlat = flattenOneLevel(newVals)
  const keys = new Set([...Object.keys(oldFlat), ...Object.keys(newFlat)])

  keys.forEach((key) => {
    if (SKIP_DIFF_KEYS.has(key)) return
    const o = oldFlat[key]
    const n = newFlat[key]
    const lastKey = key.includes(".") ? (key.split(".").pop() ?? key) : key
    const label = FIELD_LABELS_FR[lastKey] ?? prettifyFieldKey(lastKey)

    if (action === "delete" && n === undefined && o !== undefined) {
      out.push({ key, label, before: formatEuroIfPrice(key, o), after: "—" })
      return
    }
    if (action === "create" && n !== undefined && o === undefined && key !== "id") {
      out.push({ key, label, before: "—", after: formatEuroIfPrice(key, n) })
      return
    }
    if ((action === "update" || !action) && !eqJson(o, n))
      out.push({ key, label, before: formatEuroIfPrice(key, o), after: formatEuroIfPrice(key, n) })
  })

  const priority = ["name", "guest_name", "price", "station", "status", "stock_quantity", "is_available"]
  out.sort((a, b) => {
    const pa = priority.indexOf(a.key.split(".")[0] ?? a.key)
    const pb = priority.indexOf(b.key.split(".")[0] ?? b.key)
    const ia = pa === -1 ? 999 : pa
    const ib = pb === -1 ? 999 : pb
    if (ia !== ib) return ia - ib
    return a.label.localeCompare(b.label)
  })

  return out
}

function flattenOneLevel(v: Record<string, unknown> | null): Record<string, unknown> {
  if (!v || typeof v !== "object") return {}
  const out: Record<string, unknown> = {}
  for (const [k, val] of Object.entries(v)) {
    if (SKIP_DIFF_KEYS.has(k)) continue
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      const nest = flattenNested(k, val as Record<string, unknown>, 2)
      Object.assign(out, nest)
      continue
    }
    out[k] = val
  }
  return out
}

function flattenNested(prefix: string, obj: Record<string, unknown>, depth: number): Record<string, unknown> {
  if (depth <= 0)
    try {
      return { [prefix]: JSON.stringify(obj) }
    } catch {
      return { [prefix]: "[objet]" }
    }
  const flat: Record<string, unknown> = {}
  const keys = Object.keys(obj)
  if (keys.length <= 6) {
    for (const [sk, sv] of Object.entries(obj)) {
      const key = `${prefix}.${sk}`
      if (sv !== null && typeof sv === "object" && !Array.isArray(sv))
        Object.assign(flat, flattenNested(key, sv as Record<string, unknown>, depth - 1))
      else flat[key] = sv
    }
  } else
    try {
      flat[prefix] = JSON.stringify(obj)
    } catch {
      flat[prefix] = "[objet]"
    }
  return flat
}

function prettifyFieldKey(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function humanEntityType(t: string | null): string {
  if (!t) return "entrée"
  const m: Record<string, string> = {
    products: "Produit",
    invoices: "Facture",
    payments: "Paiement",
    users: "Utilisateur",
    orders: "Commande",
    event_requests: "Demande événement",
    guest_sessions: "Session invité",
    table_sessions: "Session table",
  }
  return m[t.toLowerCase()] ?? prettifyFieldKey(t.replace(/_/g, " "))
}

export function deriveElementLabel(entityType: string | null, oldVals: Record<string, unknown> | null, newVals: Record<string, unknown> | null): string {
  const n = newVals?.name ?? oldVals?.name ?? newVals?.guest_name ?? oldVals?.guest_name
  if (typeof n === "string" && n.trim()) return n.trim().slice(0, 72)
  const slug = newVals?.slug ?? oldVals?.slug
  if (typeof slug === "string" && slug.trim()) return slug.trim().slice(0, 42)
  return "—"
}

export function computeAuditSummary(
  action: string,
  entityType: string | null,
  oldVals: Record<string, unknown> | null,
  newVals: Record<string, unknown> | null,
): string {
  const ent = humanEntityType(entityType)
  const label = deriveElementLabel(entityType, oldVals, newVals)
  const nm = label !== "—" ? `${label}` : ""

  const a = String(action ?? "").toLowerCase()
  if (a === "create" || a === "insert") return nm ? `${ent} créé · ${nm}` : `${ent} créé`
  if (a === "delete" || a === "remove") return nm ? `${ent} supprimé · ${nm}` : `${ent} supprimé`
  if (a === "cancel" || a === "cancelled") return nm ? `${ent} annulé · ${nm}` : `${ent} annulé`
  if (a === "login") return nm ? `Connexion · ${nm}` : `Connexion utilisateur`
  if (a === "credit_invoice_created") return nm ? `Crédit ouvert · ${nm}` : `Facture passée en crédit`
  if (a === "credit_payment_recorded") return nm ? `Paiement crédit · ${nm}` : `Règlement crédit enregistré`
  if (a === "credit_reminder_sent") return nm ? `Rappel crédit · ${nm}` : `Rappel crédit envoyé`
  if (a === "payment_validated") return nm ? `Paiement validé · ${nm}` : `Paiement validé`

  const diff = computeAuditDiff(oldVals, newVals, "update").slice(0, 8)
  if (diff.length === 0) return `${ent} mis à jour${nm ? ` · ${nm}` : ""}`
  const parts = diff.slice(0, 2).map((d) => `${d.label}: ${shortCell(d.before)} → ${shortCell(d.after)}`)
  let s = parts.join(" · ")
  if (diff.length > 2) s += ` (+${diff.length - 2})`
  return nm ? `${ent} (${nm}) — ${s}` : `${ent} — ${s}`
}

function shortCell(s: string): string {
  const t = s.trim()
  if (t.length > 36) return `${t.slice(0, 34)}…`
  return t
}

export type AuditListRow = {
  id: number
  created_at: string
  action: string
  entity_type: string | null
  entity_id: string | null
  user_id: string | null
  user_email: string | null
  summary: string
  element_label: string
}

function asRecordSan(v: unknown): Record<string, unknown> | null {
  if (v === null || v === undefined) return null
  if (typeof v !== "object" || Array.isArray(v)) return null
  const s = sanitizeAuditSnapshot(v)
  return s && typeof s === "object" && !Array.isArray(s) ? (s as Record<string, unknown>) : null
}

export function toAuditListRow(raw: Record<string, unknown>): AuditListRow | null {
  const idRaw = raw.id
  const idNum = typeof idRaw === "number" ? idRaw : Number(idRaw)
  if (!Number.isFinite(idNum)) return null

  const oldSan = asRecordSan(raw.old_values)
  const newSan = asRecordSan(raw.new_values)

  const action = String(raw.action ?? "")
  const entityType = typeof raw.entity_type === "string" ? raw.entity_type : raw.entity_type == null ? null : String(raw.entity_type)
  const entityId = typeof raw.entity_id === "string" ? raw.entity_id : raw.entity_id == null ? null : String(raw.entity_id)

  const summary = computeAuditSummary(
    action,
    entityType,
    oldSan && typeof oldSan === "object" ? oldSan : null,
    newSan && typeof newSan === "object" ? newSan : null,
  )

  return {
    id: idNum,
    created_at: String(raw.created_at ?? ""),
    action,
    entity_type: entityType,
    entity_id: entityId,
    user_id: typeof raw.user_id === "string" ? raw.user_id : raw.user_id == null ? null : String(raw.user_id),
    user_email: typeof raw.user_email === "string" ? raw.user_email : raw.user_email == null ? null : String(raw.user_email),
    summary,
    element_label: deriveElementLabel(
      entityType,
      oldSan && typeof oldSan === "object" ? oldSan : null,
      newSan && typeof newSan === "object" ? newSan : null,
    ),
  }
}

export function sanitizeDetailPayload(raw: Record<string, unknown>) {
  const oldSan = asRecordSan(raw.old_values)
  const newSan = asRecordSan(raw.new_values)
  const metaSan = asRecordSan(raw.metadata)
  const action = String(raw.action ?? "")

  return {
    id: raw.id,
    created_at: raw.created_at,
    action,
    entity_type: raw.entity_type ?? null,
    entity_id: raw.entity_id ?? null,
    user_id: raw.user_id ?? null,
    user_email: raw.user_email ?? null,
    ip_address: raw.ip_address ?? null,
    user_agent:
      typeof raw.user_agent === "string" ? (raw.user_agent.length > 200 ? `${raw.user_agent.slice(0, 200)}…` : raw.user_agent) : null,
    metadata: metaSan && typeof metaSan === "object" ? metaSan : null,
    old_values: oldSan && typeof oldSan === "object" ? oldSan : null,
    new_values: newSan && typeof newSan === "object" ? newSan : null,
    diff: computeAuditDiff(
      oldSan && typeof oldSan === "object" ? oldSan : null,
      newSan && typeof newSan === "object" ? newSan : null,
      action,
    ),
    element_label: deriveElementLabel(
      typeof raw.entity_type === "string" ? raw.entity_type : raw.entity_type == null ? null : String(raw.entity_type),
      oldSan && typeof oldSan === "object" ? oldSan : null,
      newSan && typeof newSan === "object" ? newSan : null,
    ),
  }
}
