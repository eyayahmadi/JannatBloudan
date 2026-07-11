/**
 * POST /api/stations/items/[id]/replace
 * --------------------------------------
 * Remplace un item de commande par un autre produit (suite à un refus
 * ou à la demande du client).
 *
 * Body :
 *   {
 *     replacement_product_id: string,    // produit de remplacement
 *     replacement_product_name?: string, // snapshot pour historique
 *     unit_price?: number,               // sinon récupéré sur products
 *     quantity?: number,                 // défaut = quantité de l'original
 *     special_instructions?: string,
 *     reason_code?: string,              // si l'original n'était pas encore refusé
 *     reason_note?: string
 *   }
 *
 * Effets :
 *   - L'item original passe à 'replaced' (refused si non encore refusé) et est lié
 *     via replaced_by_item_id.
 *   - Un nouvel order_item est créé pour le remplacement (replacement_of_item_id pointe
 *     vers l'ancien). Statut initial 'accepted' (la station a déjà validé).
 *   - L'item d'origine devient non billable.
 *   - Audit applicatif + audit refusal créés.
 *
 * Sécurité : ADMIN, SERVER ou rôle station correspondant.
 */

import { NextResponse, type NextRequest } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { insertCaisseAudit } from "@/lib/caisse/audit"
import { syncOrderInvoice } from "@/lib/caisse/sync-order-invoice"
import type { Station, ItemStatus } from "@/lib/stations/config"
import {
  isRefusalReasonCode,
  type RefusalReasonCode,
} from "@/lib/stations/refusal-reasons"
import { normalizeRole, type AppRole } from "@/lib/auth/roles"

const STAFF_ROLES: readonly AppRole[] = [
  "ADMIN",
  "KITCHEN",
  "BAR",
  "SHISHA",
  "SERVER",
] as const

const STATION_ROLE_GUARD: Record<Station, AppRole> = {
  KITCHEN: "KITCHEN",
  BAR: "BAR",
  SHISHA: "SHISHA",
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const guard = await requireRoles(STAFF_ROLES)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    body = {}
  }

  const replacementId = String(body.replacement_product_id ?? "")
  if (!replacementId) {
    return NextResponse.json(
      { error: "replacement_product_id requis" },
      { status: 400 },
    )
  }

  const reasonCodeRaw = body.reason_code
  const reasonCode: RefusalReasonCode | null =
    typeof reasonCodeRaw === "string" && isRefusalReasonCode(reasonCodeRaw)
      ? reasonCodeRaw
      : "remplacement_necessaire"
  const reasonNote =
    typeof body.reason_note === "string" ? body.reason_note.trim().slice(0, 500) : ""

  const explicitQty = Number(body.quantity)
  const explicitUnitPrice = Number(body.unit_price)
  const explicitName =
    typeof body.replacement_product_name === "string"
      ? body.replacement_product_name.trim()
      : ""
  const specialInstructions =
    typeof body.special_instructions === "string"
      ? body.special_instructions.trim().slice(0, 500)
      : ""

  const supabase = createServiceRoleClient()

  // 1) Récupère l'item original
  const { data: original, error: fetchErr } = await supabase
    .from("order_items")
    .select(
      "id, order_id, station, station_status, product_name, product_id, quantity, unit_price",
    )
    .eq("id", id)
    .maybeSingle()

  if (fetchErr || !original) {
    return NextResponse.json(
      { error: fetchErr?.message ?? "Item introuvable" },
      { status: 404 },
    )
  }

  const originalStation = original.station as Station
  const callerRole = normalizeRole(guard.role)
  if (
    callerRole !== "ADMIN" &&
    callerRole !== "SERVER" &&
    callerRole !== STATION_ROLE_GUARD[originalStation]
  ) {
    return NextResponse.json(
      {
        error: `Seul ADMIN, SERVER ou ${STATION_ROLE_GUARD[originalStation]} peut proposer un remplacement.`,
      },
      { status: 403 },
    )
  }

  const previousStatus = original.station_status as ItemStatus
  if (previousStatus === "served") {
    return NextResponse.json(
      { error: "Item déjà servi — pas de remplacement possible." },
      { status: 409 },
    )
  }

  // 2) Récupère le produit de remplacement (prix + station + name)
  const { data: replacementProduct, error: prodErr } = await supabase
    .from("products")
    .select("id, name, name_ar, price, station, is_available")
    .eq("id", replacementId)
    .maybeSingle()

  if (prodErr || !replacementProduct) {
    return NextResponse.json(
      { error: prodErr?.message ?? "Produit de remplacement introuvable" },
      { status: 400 },
    )
  }

  if (replacementProduct.is_available === false) {
    return NextResponse.json(
      { error: "Le produit de remplacement n'est pas disponible." },
      { status: 400 },
    )
  }

  const qty = Number.isFinite(explicitQty) && explicitQty > 0
    ? Math.floor(explicitQty)
    : Number(original.quantity) || 1
  const unitPrice = Number.isFinite(explicitUnitPrice) && explicitUnitPrice >= 0
    ? Math.round(explicitUnitPrice * 100) / 100
    : Math.round(Number(replacementProduct.price ?? 0) * 100) / 100
  const subtotal = Math.round(unitPrice * qty * 100) / 100

  // 3) Crée le nouvel item lié
  const { data: created, error: insErr } = await supabase
    .from("order_items")
    .insert({
      order_id: original.order_id,
      product_id: replacementProduct.id,
      product_name: explicitName || replacementProduct.name,
      product_name_ar: (replacementProduct as { name_ar?: string | null }).name_ar ?? null,
      quantity: qty,
      unit_price: unitPrice,
      subtotal,
      special_instructions: specialInstructions || null,
      station: replacementProduct.station ?? originalStation,
      station_status: "accepted",
      replacement_of_item_id: original.id,
    })
    .select("id, order_id, station, station_status, product_name, quantity, unit_price")
    .single()

  if (insErr || !created) {
    return NextResponse.json(
      { error: insErr?.message ?? "Création remplacement impossible" },
      { status: 500 },
    )
  }

  // 4) Marque l'original 'replaced'
  const { error: updErr } = await supabase
    .from("order_items")
    .update({
      station_status: "replaced",
      refusal_reason: reasonCode,
      refusal_note: reasonNote || null,
      refused_by: guard.user.id,
      replaced_by_item_id: created.id,
    })
    .eq("id", original.id)

  if (updErr) {
    // Rollback partiel: supprime le nouveau pour ne pas avoir d'incohérence
    await supabase.from("order_items").delete().eq("id", created.id)
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  await supabase.from("order_item_refusals").insert({
    order_item_id: original.id,
    order_id: original.order_id,
    station: originalStation,
    reason_code: reasonCode,
    reason_note: reasonNote || null,
    previous_status: previousStatus,
    bulk_refuse: false,
    refused_by: guard.user.id,
  })

  await insertCaisseAudit(supabase, {
    userId: guard.user.id,
    userEmail: guard.user.email ?? null,
    action: "order_item.replace",
    entityType: "order_item",
    entityId: String(original.id),
    oldValues: {
      station_status: previousStatus,
      product_id: original.product_id,
      product_name: original.product_name,
      quantity: original.quantity,
      unit_price: original.unit_price,
    },
    newValues: {
      replacement_item_id: created.id,
      replacement_product_id: replacementProduct.id,
      replacement_product_name: created.product_name,
      replacement_quantity: created.quantity,
      replacement_unit_price: created.unit_price,
      reason_code: reasonCode,
    },
    metadata: {
      role: guard.role,
      station: originalStation,
      order_id: original.order_id,
    },
  })

  // Réconcilie la facture : l'original devient non facturable, le remplacement
  // (nouvel order_item de la même commande) est ajouté comme ligne facturable.
  const sync = await syncOrderInvoice(supabase, {
    orderId: String(original.order_id),
    reason: "item_replace",
    actorId: guard.user.id,
    actorEmail: guard.user.email ?? null,
    metadata: {
      original_item_id: String(original.id),
      replacement_item_id: String(created.id),
      station: originalStation,
    },
  })

  return NextResponse.json({
    ok: true,
    original: {
      id: original.id,
      from: previousStatus,
      to: "replaced" as ItemStatus,
    },
    replacement: created,
    invoice_sync: sync,
  })
}
