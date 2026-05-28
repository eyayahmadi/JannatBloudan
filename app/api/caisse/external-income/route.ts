import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"

const ALLOW = ["ADMIN", "CASHIER"] as const

const SOURCES = [
  "lieferando",
  "wolt",
  "uber_eats",
  "just_eat",
  "glovo",
  "deliveroo",
  "bank_transfer",
  "platform_payout",
  "other",
] as const

const METHODS = ["cash", "card", "online", "bank_transfer", "platform_payout"] as const

type Source = (typeof SOURCES)[number]
type Method = (typeof METHODS)[number]

/**
 * GET /api/caisse/external-income?date=YYYY-MM-DD
 * Liste les entrées caisse externes du jour (ou de la date demandée).
 *
 * Réponse :
 *   { incomes: [...], totals: { all, by_source: {...}, by_method: {...} } }
 */
export async function GET(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ incomes: [], totals: { all: 0, by_source: {}, by_method: {} } })

  const { searchParams } = new URL(request.url)
  const day = (searchParams.get("date") ?? new Date().toISOString().slice(0, 10)).slice(0, 10)
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from("external_cash_incomes")
    .select("id, source, source_label, amount, currency, payment_method, business_date, reference_number, note, attachment_url, created_at")
    .eq("business_date", day)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message, incomes: [], totals: { all: 0, by_source: {}, by_method: {} } }, { status: 500 })
  }

  const rows = data ?? []
  const totals = {
    all: 0,
    by_source: {} as Record<string, number>,
    by_method: {} as Record<string, number>,
  }

  for (const row of rows) {
    const a = Number((row as { amount?: unknown }).amount ?? 0)
    if (!Number.isFinite(a)) continue
    totals.all += a
    const src = String((row as { source?: string }).source ?? "other")
    const meth = String((row as { payment_method?: string }).payment_method ?? "")
    totals.by_source[src] = (totals.by_source[src] ?? 0) + a
    if (meth) totals.by_method[meth] = (totals.by_method[meth] ?? 0) + a
  }

  totals.all = Math.round(totals.all * 100) / 100
  for (const k of Object.keys(totals.by_source)) totals.by_source[k] = Math.round(totals.by_source[k] * 100) / 100
  for (const k of Object.keys(totals.by_method)) totals.by_method[k] = Math.round(totals.by_method[k] * 100) / 100

  return NextResponse.json({ incomes: rows, totals })
}

/**
 * POST /api/caisse/external-income
 * Body :
 *   {
 *     source: "lieferando" | "wolt" | "uber_eats" | "just_eat" | "glovo" | "deliveroo"
 *           | "bank_transfer" | "platform_payout" | "other",
 *     source_label?: string,
 *     amount: number,
 *     payment_method: "cash" | "card" | "online" | "bank_transfer" | "platform_payout",
 *     business_date?: "YYYY-MM-DD",
 *     reference_number?: string,
 *     note?: string,
 *     attachment_url?: string
 *   }
 *
 * Comportement :
 *   - Crée la ligne dans `external_cash_incomes`.
 *   - Si method = cash, crée aussi un `cash_register_movements` kind = 'entree_externe'
 *     pour rendre l'argent visible dans le tiroir et la clôture.
 *   - Audit log applicatif (`audit_logs`).
 */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const source = String(body.source ?? "").toLowerCase() as Source
  const method = String(body.payment_method ?? "").toLowerCase() as Method
  const amount = Number(body.amount)
  const sourceLabel = typeof body.source_label === "string" ? body.source_label.trim() : ""
  const businessDate =
    typeof body.business_date === "string" && body.business_date.length >= 10
      ? body.business_date.slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  const referenceNumber = typeof body.reference_number === "string" ? body.reference_number.trim() : ""
  const note = typeof body.note === "string" ? body.note.trim() : ""
  const attachmentUrl = typeof body.attachment_url === "string" ? body.attachment_url.trim() : ""

  if (!SOURCES.includes(source)) {
    return NextResponse.json({ error: `source invalide (autorisé : ${SOURCES.join(", ")})` }, { status: 400 })
  }
  if (!METHODS.includes(method)) {
    return NextResponse.json({ error: `payment_method invalide (autorisé : ${METHODS.join(", ")})` }, { status: 400 })
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount > 0 requis" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  let cashMovementId: string | null = null

  // Si l'entrée est en cash, on l'enregistre aussi côté tiroir caisse.
  if (method === "cash") {
    const movIns = await supabase
      .from("cash_register_movements")
      .insert({
        kind: "entree_externe",
        amount,
        currency: "EUR",
        description: `Entrée externe — ${labelForSource(source, sourceLabel)}${referenceNumber ? ` (réf. ${referenceNumber})` : ""}`,
        validated_by: guard.user.id,
        performed_by: guard.user.id,
        meta: {
          created_from: "/api/caisse/external-income",
          role: guard.role,
          source,
          source_label: sourceLabel || null,
          reference_number: referenceNumber || null,
          business_date: businessDate,
        },
      })
      .select("id")
      .single()

    if (movIns.error || !movIns.data) {
      return NextResponse.json(
        {
          error: movIns.error?.message ?? "Mouvement caisse impossible",
          hint: "Migration 28 (kind entree_externe)",
        },
        { status: 500 },
      )
    }
    cashMovementId = String(movIns.data.id)
  }

  const ins = await supabase
    .from("external_cash_incomes")
    .insert({
      source,
      source_label: sourceLabel || null,
      amount,
      currency: "EUR",
      payment_method: method,
      business_date: businessDate,
      reference_number: referenceNumber || null,
      note: note || null,
      attachment_url: attachmentUrl || null,
      cash_movement_id: cashMovementId,
      performed_by: guard.user.id,
    })
    .select("*")
    .single()

  if (ins.error) {
    if (cashMovementId) {
      await supabase.from("cash_register_movements").delete().eq("id", cashMovementId)
    }
    return NextResponse.json(
      { error: ins.error.message, hint: "Migration 28 (external_cash_incomes)" },
      { status: 500 },
    )
  }

  await insertCaisseAudit(supabase, {
    userId: guard.user.id,
    userEmail: guard.user.email ?? null,
    action: "external_cash_income.create",
    entityType: "external_cash_income",
    entityId: String(ins.data.id),
    newValues: {
      source,
      source_label: sourceLabel || null,
      amount,
      payment_method: method,
      business_date: businessDate,
      reference_number: referenceNumber || null,
      cash_movement_id: cashMovementId,
    },
    metadata: { role: guard.role },
  })

  return NextResponse.json({ ok: true, income: ins.data, cash_movement_id: cashMovementId })
}

function labelForSource(source: Source, free: string) {
  if (source === "other" && free) return free
  switch (source) {
    case "lieferando":
      return "Lieferando"
    case "wolt":
      return "Wolt"
    case "uber_eats":
      return "Uber Eats"
    case "just_eat":
      return "Just Eat"
    case "glovo":
      return "Glovo"
    case "deliveroo":
      return "Deliveroo"
    case "bank_transfer":
      return "Virement bancaire"
    case "platform_payout":
      return "Versement plateforme"
    default:
      return free || "Autre"
  }
}
