import type { SupabaseClient } from "@supabase/supabase-js"
import { round2, sumActiveSubtotal, type InvoiceItemRow } from "@/lib/caisse/recalc-invoice"

type GuestRow = { id: string; label?: string | null; sort_order?: number | null }
type InvoiceRow = {
  id: string
  status?: string | null
  total?: unknown
  subtotal?: unknown
  discount_amount?: unknown
  gross_before_discount?: unknown
  billing_type?: string | null
  revenue_exclude?: boolean | null
  guest_session_id?: string | null
  invoice_items?: InvoiceItemRow[] | null
}

type PaymentRow = {
  invoice_id?: string | null
  guest_session_id?: string | null
  amount?: unknown
  status?: string | null
  method?: string | null
}

function payableStatus(st: string) {
  const s = st.toLowerCase()
  return s !== "cancelled" && s !== "refunded"
}

/** Regroupe paiements réussis pour une session ouverte — visibilité caisse (tables / split invités). */
export async function buildSessionFinancials(supabase: SupabaseClient, sessionId: string) {
  const { data: guestRows } = await supabase
    .from("guest_sessions")
    .select("id,label,sort_order")
    .eq("parent_session_id", sessionId)
    .order("sort_order", { ascending: true })

  const { data: invoices, error: invErr } = await supabase
    .from("invoices")
    .select(
      "id,status,total,subtotal,discount_amount,gross_before_discount,billing_type,revenue_exclude,guest_session_id,invoice_items(id,subtotal,line_status)",
    )
    .eq("session_id", sessionId)

  if (invErr) {
    return { ok: false as const, error: invErr.message }
  }

  const invList = (invoices ?? []) as InvoiceRow[]
  const ids = invList.map((i) => i.id).filter(Boolean)
  const { data: payments } = ids.length
    ? await supabase.from("payments").select("invoice_id,guest_session_id,amount,status,method").in("invoice_id", ids)
    : { data: [] as PaymentRow[] }

  const payRows = (payments ?? []) as PaymentRow[]
  const succeeded = payRows.filter((p) => String(p.status ?? "").toLowerCase() === "succeeded")

  const invoiceById = new Map(invList.map((i) => [i.id, i]))
  const paidByInvoice = new Map<string, number>()
  for (const p of succeeded) {
    const iid = String(p.invoice_id ?? "")
    if (!iid) continue
    paidByInvoice.set(iid, round2((paidByInvoice.get(iid) ?? 0) + Number(p.amount ?? 0)))
  }

  let tableTtc = 0
  let paidTtc = 0
  let discountTtc = 0
  let hospitalityTtc = 0
  let cancelledTtc = 0
  let grossBeforeDiscountSum = 0

  for (const inv of invList) {
    const st = String(inv.status ?? "").toLowerCase()
    const t = Number(inv.total ?? 0)
    const disc = Number(inv.discount_amount ?? 0)
    const billing = String(inv.billing_type ?? "normal").toLowerCase()
    const items = inv.invoice_items ?? []
    const activeHt = sumActiveSubtotal(items)
    const grossSnap = inv.gross_before_discount != null ? Number(inv.gross_before_discount) : activeHt

    if (st === "cancelled" || st === "refunded") {
      cancelledTtc = round2(cancelledTtc + t)
      continue
    }

    if (payableStatus(st)) {
      tableTtc = round2(tableTtc + t)
      discountTtc = round2(discountTtc + disc)
      if (Number.isFinite(grossSnap)) grossBeforeDiscountSum = round2(grossBeforeDiscountSum + grossSnap)
    }

    if (billing === "hospitality" || billing === "complimentary") {
      hospitalityTtc = round2(hospitalityTtc + (Number.isFinite(grossSnap) ? grossSnap : activeHt))
    }

    const paidOnInv = paidByInvoice.get(inv.id) ?? 0
    if (payableStatus(st)) {
      paidTtc = round2(paidTtc + paidOnInv)
    }
  }

  const unpaidTtc = round2(Math.max(0, tableTtc - paidTtc))

  const guestKey = (gid: string | null) => gid ?? "__session"

  const guestMeta = new Map<string, { label: string; sort: number }>()
  guestMeta.set("__session", { label: "Table (non ventilé)", sort: -1 })
  for (const g of guestRows ?? []) {
    const gr = g as GuestRow
    guestMeta.set(gr.id, { label: String(gr.label ?? "Invité"), sort: Number(gr.sort_order ?? 0) })
  }

  type Slice = {
    guest_session_id: string | null
    label: string
    sort: number
    invoiceIds: string[]
    totalDue: number
    paid: number
    remaining: number
    discount: number
    hospitalityValue: number
    cancelled: number
    payment_methods: string[]
    flags: string[]
  }

  const slices = new Map<string, Slice>()

  function ensureSlice(gid: string | null): Slice {
    const k = guestKey(gid)
    let s = slices.get(k)
    if (!s) {
      const meta = guestMeta.get(k) ?? { label: gid ? "Invité" : "Table", sort: 0 }
      s = {
        guest_session_id: gid,
        label: meta.label,
        sort: meta.sort,
        invoiceIds: [],
        totalDue: 0,
        paid: 0,
        remaining: 0,
        discount: 0,
        hospitalityValue: 0,
        cancelled: 0,
        payment_methods: [],
        flags: [],
      }
      slices.set(k, s)
    }
    return s
  }

  for (const inv of invList) {
    const st = String(inv.status ?? "").toLowerCase()
    const gid = inv.guest_session_id ?? null
    const sl = ensureSlice(gid)
    const t = Number(inv.total ?? 0)
    const disc = Number(inv.discount_amount ?? 0)
    const billing = String(inv.billing_type ?? "normal").toLowerCase()
    const items = inv.invoice_items ?? []
    const activeHt = sumActiveSubtotal(items)
    const grossSnap = inv.gross_before_discount != null ? Number(inv.gross_before_discount) : activeHt

    if (st === "cancelled" || st === "refunded") {
      sl.cancelled = round2(sl.cancelled + t)
      continue
    }

    if (!payableStatus(st)) continue

    sl.invoiceIds.push(inv.id)
    sl.totalDue = round2(sl.totalDue + t)
    sl.discount = round2(sl.discount + disc)
    if (billing === "hospitality" || billing === "complimentary") {
      sl.hospitalityValue = round2(sl.hospitalityValue + (Number.isFinite(grossSnap) ? grossSnap : activeHt))
      sl.flags.push("hospitality")
    }
    const pinv = paidByInvoice.get(inv.id) ?? 0
    sl.paid = round2(sl.paid + pinv)
  }

  for (const p of succeeded) {
    const invoiceId = String(p.invoice_id ?? "")
    if (!invoiceId) continue
    const inv = invoiceById.get(invoiceId)
    if (!inv) continue
    const gid = (p.guest_session_id ?? inv.guest_session_id ?? null) as string | null
    const sl = ensureSlice(gid)
    const method = String(p.method ?? "").toLowerCase()
    if (method && !sl.payment_methods.includes(method)) sl.payment_methods.push(method)
  }

  for (const sl of slices.values()) {
    sl.remaining = round2(Math.max(0, sl.totalDue - sl.paid))
    if (sl.remaining > 0.02 && sl.totalDue > 0) sl.flags.push("unpaid")
    if (sl.paid > 0 && sl.remaining <= 0.02) sl.flags.push("paid")
  }

  const guestSummaries = [...slices.values()].sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label))

  return {
    ok: true as const,
    session_id: sessionId,
    table: {
      total_due_ttc: tableTtc,
      paid_ttc: paidTtc,
      unpaid_ttc: unpaidTtc,
      discount_sum: discountTtc,
      gross_before_discount_sum: grossBeforeDiscountSum,
      hospitality_value_estimate: hospitalityTtc,
      cancelled_sum: cancelledTtc,
    },
    guests: guestSummaries,
  }
}
