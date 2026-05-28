/**
 * PATCH /api/admin/purchases/recommendations/[id]
 * DELETE /api/admin/purchases/recommendations/[id]
 *
 * PATCH body discriminé sur `action` :
 *   - { action: "validate" }
 *   - { action: "ignore", ignore_reason?: string }
 *   - { action: "assign", assigned_to: string }
 *   - { action: "buy", actual_cost?: number, receipt_url?: string,
 *                      create_expense?: boolean, link_cash_movement_id?: string,
 *                      payment_method?: "cash"|"card"|"bank_transfer"|"online" }
 *   - { action: "ordered" }
 *   - { action: "edit", suggested_qty?, urgency?, reason_code?, ... }
 *
 * Effets côté DB pour `buy` :
 *   - status='received', bought_at=NOW(), bought_by=actor
 *   - INSERT stock_movement(type='in', ingredient_id=..., quantity=suggested_qty,
 *     unit_cost=actual_cost / qty, reference_type='purchase', reference_id=reco.id)
 *   - UPDATE ingredients.stock_quantity += quantity, last_restocked_at=NOW()
 *   - INSERT expenses(...) si create_expense=true
 *
 * DELETE : interdit si status ∈ {received, ordered}. Marque cancelled.
 */

import { NextResponse, type NextRequest } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"
import { isPurchaseUrgency } from "@/lib/purchases/types"

type Action = "validate" | "ignore" | "assign" | "buy" | "ordered" | "edit"

function isAction(v: unknown): v is Action {
  return (
    v === "validate" ||
    v === "ignore" ||
    v === "assign" ||
    v === "buy" ||
    v === "ordered" ||
    v === "edit"
  )
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 })
  }

  const { id } = await ctx.params
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 })

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }
  if (!isAction(body.action)) {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  const { data: current, error: fetchErr } = await supabase
    .from("reorder_requests")
    .select(
      "id,status,urgency,suggested_qty,estimated_cost,actual_cost,ingredient_id,product_id,supplier_name,unit",
    )
    .eq("id", id)
    .single()
  if (fetchErr || !current) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }
  if (current.status === "cancelled") {
    return NextResponse.json({ error: "already_cancelled" }, { status: 409 })
  }

  const action = body.action
  let updatePayload: Record<string, unknown> = {}
  let logPayload: Record<string, unknown> = { action }

  switch (action) {
    case "validate":
      updatePayload = {
        status: "validated",
        validated_by: guard.user.id,
      }
      break

    case "ignore":
      updatePayload = {
        status: "ignored",
        ignored_by: guard.user.id,
        ignore_reason: typeof body.ignore_reason === "string" ? body.ignore_reason : null,
      }
      break

    case "assign": {
      const assigned_to = typeof body.assigned_to === "string" ? body.assigned_to : ""
      if (!assigned_to) {
        return NextResponse.json({ error: "missing_assignee" }, { status: 400 })
      }
      updatePayload = {
        status: current.status === "pending" ? "assigned" : current.status,
        assigned_to,
      }
      break
    }

    case "ordered":
      updatePayload = {
        status: "ordered",
      }
      break

    case "edit": {
      const next: Record<string, unknown> = {}
      if (Number.isFinite(Number(body.suggested_qty)) && Number(body.suggested_qty) > 0) {
        next.suggested_qty = Number(body.suggested_qty)
      }
      if (isPurchaseUrgency(body.urgency)) {
        next.urgency = body.urgency
      }
      if (typeof body.estimated_cost === "number") {
        next.estimated_cost = body.estimated_cost
      }
      if (typeof body.supplier_name === "string") {
        next.supplier_name = body.supplier_name
      }
      if (typeof body.deadline === "string") {
        next.deadline = body.deadline
      }
      if (typeof body.notes === "string") {
        next.notes = body.notes
      }
      if (typeof body.unit === "string") {
        next.unit = body.unit
      }
      if (Object.keys(next).length === 0) {
        return NextResponse.json({ error: "nothing_to_update" }, { status: 400 })
      }
      updatePayload = next
      logPayload = { action: "edited", changes: next }
      break
    }

    case "buy": {
      const actualCost =
        typeof body.actual_cost === "number" && Number.isFinite(body.actual_cost)
          ? Number(body.actual_cost)
          : (current.estimated_cost ?? 0)
      const receipt = typeof body.receipt_url === "string" ? body.receipt_url : null
      const paymentMethod = typeof body.payment_method === "string" ? body.payment_method : "cash"
      const createExpense = body.create_expense !== false
      const linkCashMovementId =
        typeof body.link_cash_movement_id === "string" ? body.link_cash_movement_id : null

      updatePayload = {
        status: "received",
        bought_by: guard.user.id,
        actual_cost: actualCost,
        receipt_url: receipt,
        cash_movement_id: linkCashMovementId,
      }

      // 1) stock_movement IN si on a un ingredient_id
      if (current.ingredient_id) {
        const qty = Number(current.suggested_qty)
        const unitCost =
          qty > 0 ? Math.round((actualCost / qty) * 100) / 100 : null

        const { data: smRow, error: smErr } = await supabase
          .from("stock_movements")
          .insert({
            ingredient_id: current.ingredient_id,
            movement_type: "in",
            quantity: qty,
            unit_cost: unitCost,
            reason: "Achat fournisseur (achat à prévoir)",
            reference_type: "purchase",
            reference_id: id,
            performed_by: guard.user.id,
          })
          .select("id")
          .single()
        if (!smErr && smRow?.id) {
          updatePayload.stock_movement_id = smRow.id

          // 2) MAJ du stock courant
          const { data: ing } = await supabase
            .from("ingredients")
            .select("stock_quantity")
            .eq("id", current.ingredient_id)
            .single()
          const currentQty = Number((ing as { stock_quantity?: unknown })?.stock_quantity ?? 0)
          await supabase
            .from("ingredients")
            .update({
              stock_quantity: currentQty + qty,
              last_restocked_at: new Date().toISOString(),
            })
            .eq("id", current.ingredient_id)
        }
      }

      // 3) Création éventuelle d'une dépense
      if (createExpense && actualCost > 0) {
        const { data: ing } = current.ingredient_id
          ? await supabase
              .from("ingredients")
              .select("name")
              .eq("id", current.ingredient_id)
              .maybeSingle()
          : { data: null }

        const { data: expRow, error: expErr } = await supabase
          .from("expenses")
          .insert({
            label: `Achat ${(ing as { name?: string } | null)?.name ?? "fournitures"}`,
            amount: actualCost,
            currency: "EUR",
            payment_method: paymentMethod,
            vendor: current.supplier_name ?? null,
            invoice_url: receipt,
            recorded_by: guard.user.id,
            notes: `Reco achat ${id}`,
          })
          .select("id")
          .single()
        if (!expErr && expRow?.id) {
          updatePayload.expense_id = expRow.id
        }
      }

      logPayload = {
        action: "bought",
        actual_cost: actualCost,
        payment_method: paymentMethod,
        create_expense: createExpense,
      }
      break
    }
  }

  const { data: updated, error: upErr } = await supabase
    .from("reorder_requests")
    .update(updatePayload)
    .eq("id", id)
    .select("id,status,urgency,assigned_to,bought_at,validated_at,ignored_at")
    .single()
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  await supabase.from("purchase_recommendation_log").insert({
    recommendation_id: id,
    action: logPayload.action ?? action,
    actor_id: guard.user.id,
    payload: logPayload,
  })
  await insertCaisseAudit(supabase, {
    userId: guard.user.id,
    userEmail: guard.user.email,
    action: `purchase_reco_${logPayload.action ?? action}`,
    entityType: "reorder_requests",
    entityId: id,
    oldValues: { status: current.status },
    newValues: updatePayload,
  })

  return NextResponse.json({ ok: true, recommendation: updated })
}

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 })
  }

  const { id } = await ctx.params
  const supabase = createServiceRoleClient()

  const { data: current } = await supabase
    .from("reorder_requests")
    .select("id,status")
    .eq("id", id)
    .single()
  if (!current) return NextResponse.json({ error: "not_found" }, { status: 404 })
  if (current.status === "received") {
    return NextResponse.json({ error: "cannot_cancel_received" }, { status: 409 })
  }

  const { error: upErr } = await supabase
    .from("reorder_requests")
    .update({ status: "cancelled" })
    .eq("id", id)
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  await supabase.from("purchase_recommendation_log").insert({
    recommendation_id: id,
    action: "cancelled",
    actor_id: guard.user.id,
  })
  await insertCaisseAudit(supabase, {
    userId: guard.user.id,
    userEmail: guard.user.email,
    action: "purchase_reco_cancel",
    entityType: "reorder_requests",
    entityId: id,
    oldValues: { status: current.status },
    newValues: { status: "cancelled" },
  })

  return NextResponse.json({ ok: true })
}
