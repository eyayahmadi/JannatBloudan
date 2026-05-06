import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import type { SupplierInvoiceInputMode, SupplierInvoiceStatus } from "@/lib/supplier-invoices/types"

function defaultStatusForManual(hasItems: boolean): SupplierInvoiceStatus {
  return hasItems ? "a_verifier" : "brouillon"
}

/**
 * GET: liste des factures fournisseurs
 * POST: créer une facture (brouillon / manuel avec lignes)
 */
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ invoices: [], source: "mock" })
  }

  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from("supplier_invoices")
      .select(
        `id, supplier_id, supplier_name_raw, invoice_number, invoice_date, file_url, file_mime, input_mode, status,
         total_ht, tva, total_ttc, extraction_confidence, commentaire, expense_id, created_at,
         supplier:suppliers(id, name),
         items:supplier_invoice_items(id, line_no, raw_name, matched_ingredient_id, line_status, quantity, unit, unit_price, line_total, confidence)`,
      )
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ invoices: data ?? [], source: "supabase" })
  } catch (e) {
    console.error("[supplier-invoices] GET", e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase requis pour enregistrer les factures" },
      { status: 503 },
    )
  }

  try {
    const body = await request.json()
    const inputMode = (body.inputMode ?? "manuel") as SupplierInvoiceInputMode
    const supplierName: string | undefined = body.supplierName
    const supplierId: string | undefined = body.supplierId
    const invoiceNumber = body.invoiceNumber ?? ""
    const invoiceDate = body.invoiceDate ?? null
    const commentaire = body.commentaire ?? null
    const itemsIn = Array.isArray(body.items) ? body.items : []

    const supabase = createServiceRoleClient()

    let resolvedSupplierId: string | null = supplierId ?? null
    if (!resolvedSupplierId && supplierName?.trim()) {
      const { data: existing } = await supabase
        .from("suppliers")
        .select("id")
        .ilike("name", supplierName.trim())
        .maybeSingle()
      if (existing?.id) {
        resolvedSupplierId = existing.id
      } else {
        const { data: ins, error: insErr } = await supabase
          .from("suppliers")
          .insert({ name: supplierName.trim() })
          .select("id")
          .single()
        if (!insErr && ins) resolvedSupplierId = ins.id
      }
    }

    const hasItems = itemsIn.length > 0
    const status = defaultStatusForManual(hasItems) as SupplierInvoiceStatus

    const { data: inv, error: invErr } = await supabase
      .from("supplier_invoices")
      .insert({
        supplier_id: resolvedSupplierId,
        supplier_name_raw: supplierName ?? null,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        input_mode: inputMode,
        status: inputMode === "manuel" ? status : "brouillon",
        file_url: null,
        commentaire,
        total_ht: body.total_ht ?? null,
        tva: body.tva ?? null,
        total_ttc: body.total_ttc ?? null,
        extracted_payload: null,
        extraction_confidence: null,
        created_by: guard.user.id,
      })
      .select(
        `id, supplier_id, supplier_name_raw, invoice_number, invoice_date, file_url, file_mime, input_mode, status, total_ht, tva, total_ttc, commentaire, created_at, supplier:suppliers(id, name)`,
      )
      .single()

    if (invErr || !inv) {
      return NextResponse.json({ error: invErr?.message ?? "Echec création" }, { status: 500 })
    }

    if (hasItems) {
      const rows = itemsIn.map(
        (row: Record<string, unknown>, idx: number) => ({
          invoice_id: inv.id,
          line_no: idx + 1,
          raw_name: String(row.raw_name ?? row.name ?? "Produit"),
          matched_ingredient_id: row.matched_ingredient_id
            ? String(row.matched_ingredient_id)
            : null,
          line_status: (row.line_status as string) ?? (row.matched_ingredient_id ? "matched" : "new_ingredient"),
          quantity: Number(row.quantity) || 0,
          unit: String(row.unit ?? "kg"),
          unit_price: row.unit_price != null ? Number(row.unit_price) : null,
          line_total: row.line_total != null ? Number(row.line_total) : null,
          vat_rate: row.vat_rate != null ? Number(row.vat_rate) : null,
          confidence: row.confidence != null ? Number(row.confidence) : 1,
        }),
      )
      const { error: itErr } = await supabase.from("supplier_invoice_items").insert(rows)
      if (itErr) {
        await supabase.from("supplier_invoices").delete().eq("id", inv.id)
        return NextResponse.json({ error: itErr.message }, { status: 500 })
      }
    }

    const { data: full } = await supabase
      .from("supplier_invoices")
      .select(
        `*, supplier:suppliers(id, name), items:supplier_invoice_items(id, line_no, raw_name, matched_ingredient_id, line_status, quantity, unit, unit_price, line_total, confidence)`,
      )
      .eq("id", inv.id)
      .single()

    return NextResponse.json({ invoice: full ?? inv }, { status: 201 })
  } catch (e) {
    console.error("[supplier-invoices] POST", e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
