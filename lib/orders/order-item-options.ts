/**
 * Structured bilingual options snapshot for order_items.
 * Source of truth for kitchen/bar/shisha tickets — not hardcoded in print HTML.
 */

export type BilingualName = {
  name_de: string
  name_ar: string | null
}

export type OrderItemOptionGroup = {
  group_name_de: string
  group_name_ar: string | null
}

export type OrderItemVariantSnapshot = OrderItemOptionGroup &
  BilingualName & {
    id?: string
  }

export type OrderItemModifierSnapshot = OrderItemOptionGroup &
  BilingualName & {
    id?: string
  }

export type OrderItemOptionsSnapshot = {
  variant: OrderItemVariantSnapshot | null
  modifiers: OrderItemModifierSnapshot[]
  customer_note: string | null
}

export const CUSTOMER_NOTE_LABEL: OrderItemOptionGroup = {
  group_name_de: "Notiz",
  group_name_ar: "ملاحظة",
}

const DEFAULT_SIZE_GROUP: OrderItemOptionGroup = {
  group_name_de: "Größe",
  group_name_ar: "الحجم",
}

const DEFAULT_EXTRAS_GROUP: OrderItemOptionGroup = {
  group_name_de: "Extras",
  group_name_ar: "الإضافات",
}

export function formatBilingualPair(de: string, ar: string | null | undefined): string {
  const d = de.trim()
  const a = ar?.trim()
  if (!d) return a ?? ""
  if (!a || a === d) return d
  return `${d} / ${a}`
}

export function splitBilingualPair(raw: string): { de: string; ar: string | null } {
  const trimmed = raw.trim()
  if (!trimmed) return { de: "", ar: null }
  const slash = trimmed.indexOf(" / ")
  if (slash === -1) return { de: trimmed, ar: null }
  const de = trimmed.slice(0, slash).trim()
  const ar = trimmed.slice(slash + 3).trim()
  return { de: de || trimmed, ar: ar || null }
}

export function emptyOptionsSnapshot(): OrderItemOptionsSnapshot {
  return { variant: null, modifiers: [], customer_note: null }
}

/** Parse legacy special_instructions text into a snapshot (fallback). */
export function optionsSnapshotFromNotes(
  raw: string | null | undefined,
  logContext?: string,
): OrderItemOptionsSnapshot {
  const snapshot = emptyOptionsSnapshot()
  if (!raw?.trim()) return snapshot

  for (const line of raw.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (/^size:/i.test(trimmed)) {
      const value = trimmed.replace(/^size:\s*/i, "")
      const { de, ar } = splitBilingualPair(value)
      if (de) {
        snapshot.variant = {
          ...DEFAULT_SIZE_GROUP,
          name_de: de,
          name_ar: ar,
        }
        if (!ar && logContext) {
          console.warn(`[order-item-options] Missing Arabic variant for "${de}" (${logContext})`)
        }
      }
      continue
    }

    if (trimmed.startsWith("+")) {
      const value = trimmed.replace(/^\+\s*/, "")
      const { de, ar } = splitBilingualPair(value)
      if (de) {
        snapshot.modifiers.push({
          ...DEFAULT_EXTRAS_GROUP,
          name_de: de,
          name_ar: ar,
        })
        if (!ar && logContext) {
          console.warn(`[order-item-options] Missing Arabic modifier for "${de}" (${logContext})`)
        }
      }
      continue
    }

    if (/^note:/i.test(trimmed)) {
      snapshot.customer_note = trimmed.replace(/^note:\s*/i, "").trim() || null
    }
  }

  return snapshot
}

export function parseOptionsSnapshotJson(raw: unknown): OrderItemOptionsSnapshot | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const variantRaw = o.variant
  const modifiersRaw = o.modifiers
  const customerNote =
    typeof o.customer_note === "string" ? o.customer_note.trim() || null : null

  let variant: OrderItemVariantSnapshot | null = null
  if (variantRaw && typeof variantRaw === "object") {
    const v = variantRaw as Record<string, unknown>
    const nameDe = String(v.name_de ?? "").trim()
    if (nameDe) {
      variant = {
        group_name_de: String(v.group_name_de ?? DEFAULT_SIZE_GROUP.group_name_de),
        group_name_ar:
          typeof v.group_name_ar === "string" ? v.group_name_ar.trim() || null : null,
        name_de: nameDe,
        name_ar: typeof v.name_ar === "string" ? v.name_ar.trim() || null : null,
        id: typeof v.id === "string" ? v.id : undefined,
      }
    }
  }

  const modifiers: OrderItemModifierSnapshot[] = []
  if (Array.isArray(modifiersRaw)) {
    for (const row of modifiersRaw) {
      if (!row || typeof row !== "object") continue
      const m = row as Record<string, unknown>
      const nameDe = String(m.name_de ?? "").trim()
      if (!nameDe) continue
      modifiers.push({
        group_name_de: String(m.group_name_de ?? DEFAULT_EXTRAS_GROUP.group_name_de),
        group_name_ar:
          typeof m.group_name_ar === "string" ? m.group_name_ar.trim() || null : null,
        name_de: nameDe,
        name_ar: typeof m.name_ar === "string" ? m.name_ar.trim() || null : null,
        id: typeof m.id === "string" ? m.id : undefined,
      })
    }
  }

  if (!variant && modifiers.length === 0 && !customerNote) return null
  return { variant, modifiers, customer_note: customerNote }
}

/** Prefer JSON snapshot; fall back to parsing special_instructions. */
export function resolveOrderItemOptions(input: {
  options_snapshot?: unknown
  notes?: string | null
  logContext?: string
}): OrderItemOptionsSnapshot {
  const fromJson = parseOptionsSnapshotJson(input.options_snapshot)
  if (fromJson) return fromJson
  return optionsSnapshotFromNotes(input.notes, input.logContext)
}

export function hasOrderItemOptions(snapshot: OrderItemOptionsSnapshot): boolean {
  return Boolean(snapshot.variant || snapshot.modifiers.length > 0 || snapshot.customer_note)
}

export function groupModifiersByGroup(
  modifiers: OrderItemModifierSnapshot[],
): Map<string, OrderItemModifierSnapshot[]> {
  const map = new Map<string, OrderItemModifierSnapshot[]>()
  for (const mod of modifiers) {
    const key = `${mod.group_name_de}::${mod.group_name_ar ?? ""}`
    const list = map.get(key) ?? []
    list.push(mod)
    map.set(key, list)
  }
  return map
}

/** Build snapshot from live cart selections (POS / staff menu preview). */
export function optionsSnapshotFromCart(input: {
  variant?: { id?: string; name: string; name_ar?: string | null } | null
  extras?: Array<{ id?: string; name: string; name_ar?: string | null }>
  customerNote?: string | null
  variantGroup?: OrderItemOptionGroup
  extrasGroup?: OrderItemOptionGroup
}): OrderItemOptionsSnapshot {
  const variantGroup = input.variantGroup ?? DEFAULT_SIZE_GROUP
  const extrasGroup = input.extrasGroup ?? DEFAULT_EXTRAS_GROUP

  let variant: OrderItemVariantSnapshot | null = null
  if (input.variant?.name?.trim()) {
    variant = {
      id: input.variant.id,
      group_name_de: variantGroup.group_name_de,
      group_name_ar: variantGroup.group_name_ar,
      name_de: input.variant.name.trim(),
      name_ar: input.variant.name_ar?.trim() || null,
    }
    if (!variant.name_ar) {
      console.warn(`[order-item-options] Missing Arabic for cart variant "${variant.name_de}"`)
    }
  }

  const modifiers: OrderItemModifierSnapshot[] = (input.extras ?? [])
    .filter((e) => e.name?.trim())
    .map((e) => {
      if (!e.name_ar?.trim()) {
        console.warn(`[order-item-options] Missing Arabic for cart extra "${e.name}"`)
      }
      return {
        id: e.id,
        group_name_de: extrasGroup.group_name_de,
        group_name_ar: extrasGroup.group_name_ar,
        name_de: e.name.trim(),
        name_ar: e.name_ar?.trim() || null,
      }
    })

  const customer_note = input.customerNote?.trim() || null
  return { variant, modifiers, customer_note }
}
