import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"

const ALLOW = ["ADMIN", "CASHIER"] as const

type CloseResolution = "none" | "hospitality" | "cancelled" | "loss"

export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const sessionId = typeof body.session_id === "string" ? body.session_id.trim() : ""
  const resolutionRaw = typeof body.resolution_type === "string" ? body.resolution_type.trim().toLowerCase() : "none"
  const resolution: CloseResolution = ["none", "hospitality", "cancelled", "loss"].includes(resolutionRaw)
    ? (resolutionRaw as CloseResolution)
    : "none"
  const reason = typeof body.reason === "string" ? body.reason.trim() : ""

  if (!sessionId) return NextResponse.json({ error: "session_id requis" }, { status: 400 })
  if (resolution !== "none" && reason.length < 3) {
    return NextResponse.json({ error: "Raison requise (>= 3 caractères)." }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const { data: sess } = await supabase
    .from("table_sessions")
    .select("id, table_id, closed_at")
    .eq("id", sessionId)
    .maybeSingle()

  if (!sess) return NextResponse.json({ error: "Session introuvable" }, { status: 404 })
  if (sess.closed_at) return NextResponse.json({ ok: true, idempotent: true })

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, status, total, payment_stage, billing_type, payment_split, subtotal")
    .eq("session_id", sessionId)

  const active = (invoices ?? []).filter((x) => {
    const st = String((x as { status?: string }).status ?? "").toLowerCase()
    return st !== "cancelled" && st !== "refunded"
  })

  const unpaid = active.filter((inv) => {
    const st = String((inv as { status?: string }).status ?? "").toLowerCase()
    if (st === "paid") return false
    const total = Number((inv as { total?: number }).total ?? 0)
    const split = Array.isArray((inv as { payment_split?: unknown }).payment_split)
      ? ((inv as { payment_split?: Array<{ amount?: number }> }).payment_split ?? [])
      : []
    const paid = split.reduce((s, p) => s + Number(p.amount ?? 0), 0)
    return total - paid > 0.03
  })

  if (unpaid.length > 0 && resolution === "none") {
    return NextResponse.json(
      {
        error:
          "Impossible de clôturer: des montants restent impayés. Utilisez paiement/split, ou marquez le reliquat en hospitality/cancelled/loss avec raison.",
      },
      { status: 409 },
    )
  }

  const now = new Date().toISOString()

  if (unpaid.length > 0 && resolution !== "none") {
    for (const inv of unpaid) {
      const invoiceId = String((inv as { id?: string }).id ?? "")
      if (!invoiceId) continue
      const oldValues = inv as Record<string, unknown>

      if (resolution === "hospitality") {
        const subtotal = Number((inv as { subtotal?: number }).subtotal ?? 0)
        const update = {
          billing_type: "hospitality",
          hospitality_reason: reason,
          revenue_exclude: true,
          gross_before_discount: Number((inv as { total?: number }).total ?? subtotal),
          discount_amount: subtotal,
          subtotal: 0,
          tva_amount: 0,
          total: 0,
          status: "paid",
          payment_method: "hospitality",
          payment_stage: "paid_hospitality",
          paid_at: now,
        }
        const { data: after } = await supabase.from("invoices").update(update).eq("id", invoiceId).select("*").maybeSingle()
        await insertCaisseAudit(supabase, {
          userId: guard.user.id,
          userEmail: guard.user.email ?? null,
          action: "invoice_hospitality_close_table",
          entityType: "invoices",
          entityId: invoiceId,
          oldValues,
          newValues: (after as Record<string, unknown>) ?? null,
          metadata: { reason, table_close: true },
        })
      } else {
        const update = {
          status: "cancelled",
          payment_stage: "cancelled",
          cancel_reason: `${resolution}: ${reason}`,
        }
        const { data: after } = await supabase.from("invoices").update(update).eq("id", invoiceId).select("*").maybeSingle()
        await insertCaisseAudit(supabase, {
          userId: guard.user.id,
          userEmail: guard.user.email ?? null,
          action: resolution === "loss" ? "invoice_marked_loss" : "invoice_cancelled_close_table",
          entityType: "invoices",
          entityId: invoiceId,
          oldValues,
          newValues: (after as Record<string, unknown>) ?? null,
          metadata: { reason, table_close: true },
        })
      }
    }
  }

  const { data: sessionAfter, error: closeErr } = await supabase
    .from("table_sessions")
    .update({ closed_at: now })
    .eq("id", sessionId)
    .select("*")
    .maybeSingle()

  if (closeErr) return NextResponse.json({ error: closeErr.message }, { status: 500 })

  if (sess.table_id) {
    await supabase
      .from("restaurant_tables")
      .update({ status: "FREE", current_session_id: null })
      .eq("id", Number(sess.table_id))
  }

  await insertCaisseAudit(supabase, {
    userId: guard.user.id,
    userEmail: guard.user.email ?? null,
    action: "table_closed",
    entityType: "table_sessions",
    entityId: sessionId,
    oldValues: sess as Record<string, unknown>,
    newValues: (sessionAfter as Record<string, unknown>) ?? null,
    metadata: {
      role: guard.role,
      resolution_type: resolution,
      reason: reason || null,
      remaining_invoices_handled: unpaid.length,
      table_id: sess.table_id ?? null,
    },
  })

  return NextResponse.json({
    ok: true,
    session_id: sessionId,
    table_id: sess.table_id ?? null,
    resolution_type: resolution,
    resolved_unpaid_invoices: unpaid.length,
  })
}

