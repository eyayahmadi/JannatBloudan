import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { matchIngredient } from "@/lib/supplier-invoices/match"
import type { IngredientRow, InvoiceItemLineStatus } from "@/lib/supplier-invoices/types"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_request: Request, ctx: Ctx) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  const { id } = await ctx.params

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from("supplier_invoices")
    .select(
      `*, supplier:suppliers(id, name, email, phone), items:supplier_invoice_items(*)`,
    )
    .eq("id", id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json({ invoice: data })
}

/**
 * Mise à jour brouillon / à vérifier : en-tête + remplacement des lignes optionnel
 */
export async function PATCH(request: Request, ctx: Ctx) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  const { id } = await ctx.params

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const body = await request.json()
  const supabase = createServiceRoleClient()

  const { data: current, error: curErr } = await supabase
    .from("supplier_invoices")
    .select("id, status")
    .eq("id", id)
    .maybeSingle()

  if (curErr || !current) return NextResponse.json({ error: "not_found" }, { status: 404 })
  if (current.status === "validee") {
    return NextResponse.json(
      { error: "La facture validée n'est plus modifiable" },
      { status: 400 },
    )
  }

  const header: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.supplierName != null) header.supplier_name_raw = String(body.supplierName)
  if (body.invoiceNumber != null) header.invoice_number = String(body.invoiceNumber)
  if (body.invoiceDate != null) header.invoice_date = String(body.invoiceDate)
  if (body.commentaire !== undefined) header.commentaire = body.commentaire
  if (body.status != null) header.status = String(body.status)
  if (body.total_ht != null) header.total_ht = Number(body.total_ht)
  if (body.tva != null) header.tva = Number(body.tva)
  if (body.total_ttc != null) header.total_ttc = Number(body.total_ttc)
  if (body.supplierId !== undefined) header.supplier_id = body.supplierId

  if (Object.keys(header).length > 1) {
    const { error: hErr } = await supabase.from("supplier_invoices").update(header).eq("id", id)
    if (hErr) return NextResponse.json({ error: hErr.message }, { status: 500 })
  }

  if (Array.isArray(body.items)) {
    const { data: ings } = await supabase.from("ingredients").select("id, name, unit")
    const ingList: IngredientRow[] = (ings ?? []) as IngredientRow[]

    await supabase.from("supplier_invoice_items").delete().eq("invoice_id", id)

    const rows = (body.items as Record<string, unknown>[]).map((row, idx) => {
      const raw = String(row.raw_name ?? "Produit")
      let lineStatus = (row.line_status as InvoiceItemLineStatus) ?? "pending"
      let mid = row.matched_ingredient_id ? String(row.matched_ingredient_id) : null
      if (lineStatus === "ignored") {
        mid = null
      } else if (mid) {
        lineStatus = "matched"
      } else {
        const m = matchIngredient(ingList, raw)
        if (m.ingredient) {
          mid = m.ingredient.id
          lineStatus = "matched"
        } else {
          lineStatus = "new_ingredient"
        }
      }
      return {
        invoice_id: id,
        line_no: idx + 1,
        raw_name: raw,
        matched_ingredient_id: lineStatus === "ignored" ? null : mid,
        line_status: lineStatus,
        quantity: Number(row.quantity) || 0,
        unit: String(row.unit ?? "kg"),
        unit_price: row.unit_price != null ? Number(row.unit_price) : null,
        line_total: row.line_total != null ? Number(row.line_total) : null,
        vat_rate: row.vat_rate != null ? Number(row.vat_rate) : null,
        confidence: row.confidence != null ? Number(row.confidence) : 0.8,
      }
    })

    if (rows.length) {
      const { error: itErr } = await supabase.from("supplier_invoice_items").insert(rows)
      if (itErr) return NextResponse.json({ error: itErr.message }, { status: 500 })
    }
  }

  const { data: full } = await supabase
    .from("supplier_invoices")
    .select(
      `*, supplier:suppliers(id, name), items:supplier_invoice_items(*)`,
    )
    .eq("id", id)
    .single()

  return NextResponse.json({ invoice: full })
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  const { id } = await ctx.params

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const supabase = createServiceRoleClient()
  const { data: current } = await supabase
    .from("supplier_invoices")
    .select("id, status, file_url")
    .eq("id", id)
    .maybeSingle()

  if (!current) return NextResponse.json({ error: "not_found" }, { status: 404 })
  if (current.status === "validee") {
    return NextResponse.json(
      { error: "Supprimez d'abord la dépense en comptabilité si besoin" },
      { status: 400 },
    )
  }
  if (current.status !== "brouillon" && current.status !== "rejetee") {
    return NextResponse.json(
      { error: "Seules les factures brouillon ou rejetées peuvent être supprimées" },
      { status: 400 },
    )
  }

  if (current.file_url) {
    const m = /supplier-invoices\/(.+)$/.exec(String(current.file_url)) ?? []
    if (m[1]) {
      const path = decodeURIComponent(m[1])
      await supabase.storage.from("supplier-invoices").remove([path])
    }
  }

  const { error } = await supabase.from("supplier_invoices").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
