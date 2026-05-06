import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import type { InvoiceItemLineStatus } from "@/lib/supplier-invoices/types"

type Ctx = { params: Promise<{ id: string }> }

type LineIn = {
  id?: string
  raw_name: string
  line_status: InvoiceItemLineStatus
  matched_ingredient_id?: string | null
  new_ingredient?: { name: string; unit: string }
  quantity: number
  unit: string
  unit_price?: number | null
  line_total?: number | null
  vat_rate?: number | null
  confidence?: number | null
}

type Resolved = LineIn & { resolved_ingredient_id: string | null }

/**
 * Validation humaine : stock + mouvement + dépense. Aucun effet sur le stock si statut interdit.
 */
export async function POST(request: Request, ctx: Ctx) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  const { id: invoiceId } = await ctx.params

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const lines: LineIn[] = Array.isArray(body.items) ? body.items : []
  const supabase = createServiceRoleClient()

  const { data: inv, error: invErr } = await supabase
    .from("supplier_invoices")
    .select(
      "id, status, supplier_id, supplier_name_raw, invoice_number, invoice_date, file_url, total_ht, tva, total_ttc, expense_id",
    )
    .eq("id", invoiceId)
    .maybeSingle()

  if (invErr || !inv) return NextResponse.json({ error: "not_found" }, { status: 404 })
  if (inv.status === "validee" || inv.status === "rejetee") {
    return NextResponse.json(
      { error: "Cette facture a déjà été traitée" },
      { status: 400 },
    )
  }
  if (inv.expense_id) {
    return NextResponse.json(
      { error: "Dépense déjà liée" },
      { status: 400 },
    )
  }
  if (!lines.length) {
    return NextResponse.json(
      { error: "Aucune ligne: ajoutez des produits ou corrigez l'extraction" },
      { status: 400 },
    )
  }

  for (const line of lines) {
    if (line.line_status === "ignored") continue
    if (line.line_status === "new_ingredient") {
      if (!line.new_ingredient?.name?.trim()) {
        return NextResponse.json(
          { error: `Ligne "${line.raw_name}": nom et unité requis pour créer l'ingrédient` },
          { status: 400 },
        )
      }
    } else {
      if (!line.matched_ingredient_id) {
        return NextResponse.json(
          { error: `Ligne "${line.raw_name}": ingrédient manquant` },
          { status: 400 },
        )
      }
    }
  }

  for (const line of lines) {
    if (line.line_status === "ignored") continue
    const qty = Number(line.quantity) || 0
    if (qty <= 0) {
      return NextResponse.json(
        { error: `Quantité invalide pour ${line.raw_name}` },
        { status: 400 },
      )
    }
  }

  const resolved: Resolved[] = []
  for (const line of lines) {
    if (line.line_status === "ignored") {
      resolved.push({ ...line, resolved_ingredient_id: null })
      continue
    }
    let ingId: string
    if (line.line_status === "new_ingredient" && line.new_ingredient) {
      const { data: created, error: cErr } = await supabase
        .from("ingredients")
        .insert({
          name: line.new_ingredient.name.trim(),
          unit: line.new_ingredient.unit.trim() || "kg",
          stock_quantity: 0,
        })
        .select("id")
        .single()
      if (cErr) {
        return NextResponse.json(
          { error: `${cErr.message} (ingrédient existant ?)` },
          { status: 400 },
        )
      }
      ingId = created!.id
    } else {
      ingId = line.matched_ingredient_id as string
    }
    resolved.push({ ...line, resolved_ingredient_id: ingId })
  }

  const vendorName =
    (await getSupplierName(supabase, inv.supplier_id as string | null)) ??
    (inv as { supplier_name_raw?: string | null }).supplier_name_raw ??
    "Fournisseur"
  const invNumber = (inv as { invoice_number?: string | null }).invoice_number ?? "sans-no"

  const toStock = resolved.filter((l) => l.line_status !== "ignored")
  if (!toStock.length) {
    return NextResponse.json(
      { error: "Toutes les lignes sont ignorées — impossible de valider" },
      { status: 400 },
    )
  }

  const { data: cat } = await supabase
    .from("expense_categories")
    .select("id")
    .eq("name", "Matieres premieres")
    .maybeSingle()

  const totalFromLines = toStock.reduce((s, l) => s + (Number(l.line_total) || 0), 0)
  const amountTtc = Number(
    (inv as { total_ttc?: string | number | null }).total_ttc ?? totalFromLines,
  )
  if (!Number.isFinite(amountTtc) || amountTtc <= 0) {
    return NextResponse.json(
      { error: "Montant total TTC / lignes manquant. Renseignez le total TTC de la facture." },
      { status: 400 },
    )
  }

  for (const line of resolved) {
    if (line.line_status === "ignored" || !line.resolved_ingredient_id) continue
    const ingId = line.resolved_ingredient_id
    const { data: before, error: bErr } = await supabase
      .from("ingredients")
      .select("id, stock_quantity, cost_per_unit, supplier_name")
      .eq("id", ingId)
      .maybeSingle()
    if (bErr || !before) {
      return NextResponse.json(
        { error: `Ingrédient ${ingId} introuvable` },
        { status: 400 },
      )
    }
    const adj = Math.abs(Number(line.quantity) || 0)
    const unitCost = line.unit_price != null ? Number(line.unit_price) : null
    const newStock = Number(before.stock_quantity) + adj
    const { error: movErr } = await supabase.from("stock_movements").insert({
      ingredient_id: ingId,
      movement_type: "in",
      quantity: adj,
      unit_cost: unitCost,
      reason: `Achat facture ${invNumber}`,
      reference_id: invoiceId,
      reference_type: "supplier_invoice",
      performed_by: null,
    })
    if (movErr) return NextResponse.json({ error: movErr.message }, { status: 500 })
    const { error: uIng } = await supabase
      .from("ingredients")
      .update({
        stock_quantity: newStock,
        last_restocked_at: new Date().toISOString(),
        cost_per_unit: unitCost != null && unitCost > 0 ? unitCost : before.cost_per_unit,
        supplier_name: vendorName || before.supplier_name,
      })
      .eq("id", ingId)
    if (uIng) return NextResponse.json({ error: uIng.message }, { status: 500 })
  }

  const { data: expense, error: expErr } = await supabase
    .from("expenses")
    .insert({
      category_id: cat?.id ?? null,
      label: `Achat fournisseur — facture ${invNumber}`,
      amount: amountTtc,
      currency: "EUR",
      expense_date:
        (inv as { invoice_date?: string | null }).invoice_date ??
        new Date().toISOString().slice(0, 10),
      payment_method: "bank_transfer",
      vendor: vendorName,
      invoice_ref: invNumber,
      invoice_url: (inv as { file_url?: string | null }).file_url ?? null,
      notes: `supplier_invoice:${invoiceId}`,
      recorded_by: null,
    })
    .select("id")
    .single()
  if (expErr || !expense) {
    return NextResponse.json({ error: expErr?.message ?? "Dépense" }, { status: 500 })
  }
  const { error: exLink } = await supabase
    .from("expenses")
    .update({ supplier_invoice_id: invoiceId })
    .eq("id", expense.id)
  if (exLink) {
    return NextResponse.json({ error: exLink.message }, { status: 500 })
  }

  await supabase.from("supplier_invoice_items").delete().eq("invoice_id", invoiceId)
  const rows = resolved.map((l, idx) => ({
    invoice_id: invoiceId,
    line_no: idx + 1,
    raw_name: l.raw_name,
    matched_ingredient_id: l.resolved_ingredient_id,
    line_status: l.line_status,
    quantity: l.line_status === "ignored" ? 0 : l.quantity,
    unit: l.unit,
    unit_price: l.unit_price ?? null,
    line_total: l.line_total ?? null,
    vat_rate: l.vat_rate ?? null,
    confidence: l.confidence ?? 1,
  }))

  if (rows.length) {
    const { error: itErr } = await supabase.from("supplier_invoice_items").insert(rows)
    if (itErr) {
      console.error("[validate] snapshot items", itErr)
    }
  }

  const { error: vErr } = await supabase
    .from("supplier_invoices")
    .update({
      status: "validee",
      expense_id: expense.id,
      total_ttc: amountTtc,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId)
  if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 })

  const { data: out } = await supabase
    .from("supplier_invoices")
    .select("*, supplier:suppliers(id, name), items:supplier_invoice_items(*), expense_id")
    .eq("id", invoiceId)
    .maybeSingle()

  return NextResponse.json({ success: true, invoice: out })
}

async function getSupplierName(
  supabase: ReturnType<typeof createServiceRoleClient>,
  id: string | null,
) {
  if (!id) return null
  const { data } = await supabase.from("suppliers").select("name").eq("id", id).maybeSingle()
  return data?.name ?? null
}
