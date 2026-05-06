import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { extractInvoiceFromImage, extractInvoiceFromText, extractTextFromPdfBuffer } from "@/lib/supplier-invoices/extract"
import { matchIngredient } from "@/lib/supplier-invoices/match"
import type { IngredientRow, SupplierInvoiceInputMode } from "@/lib/supplier-invoices/types"

type Ctx = { params: Promise<{ id: string }> }

const IMAGE_MIME = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"])

export async function POST(_request: Request, ctx: Ctx) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  const { id: invoiceId } = await ctx.params

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const supabase = createServiceRoleClient()
  const { data: inv, error: invErr } = await supabase
    .from("supplier_invoices")
    .select("id, status")
    .eq("id", invoiceId)
    .maybeSingle()

  if (invErr || !inv) return NextResponse.json({ error: "not_found" }, { status: 404 })
  if (inv.status === "validee" || inv.status === "rejetee") {
    return NextResponse.json(
      { error: "Cette facture ne peut plus recevoir de fichier" },
      { status: 400 },
    )
  }

  const { error: upd0 } = await supabase
    .from("supplier_invoices")
    .update({ status: "extraction_en_cours", updated_at: new Date().toISOString() })
    .eq("id", invoiceId)

  if (upd0) {
    return NextResponse.json({ error: upd0.message }, { status: 500 })
  }

  const form = await _request.formData()
  const file = form.get("file")
  if (!(file instanceof File) || !file.size) {
    await supabase
      .from("supplier_invoices")
      .update({ status: "brouillon" })
      .eq("id", invoiceId)
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 })
  }

  const mime = file.type || "application/octet-stream"
  const buf = await file.arrayBuffer()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120)
  const objectPath = `${invoiceId}/${Date.now()}-${safeName}`

  const { data: up, error: upErr } = await supabase.storage
    .from("supplier-invoices")
    .upload(objectPath, new Uint8Array(buf), { contentType: mime, upsert: true })

  if (upErr) {
    console.error("[upload] storage", upErr)
    await supabase.from("supplier_invoices").update({ status: "brouillon" }).eq("id", invoiceId)
    return NextResponse.json(
      {
        error:
          "Upload stockage échoué. Créez le bucket 'supplier-invoices' ou vérifiez les droits.",
        detail: upErr.message,
      },
      { status: 500 },
    )
  }

  const { data: pub } = supabase.storage.from("supplier-invoices").getPublicUrl(up?.path ?? objectPath)
  const fileUrl = pub.publicUrl
  const inputMode: SupplierInvoiceInputMode = IMAGE_MIME.has(mime) ? "upload_image" : "upload_pdf"

  const { data: ings } = await supabase.from("ingredients").select("id, name, unit")
  const ingList: IngredientRow[] = (ings ?? []) as IngredientRow[]

  let extracted
  if (inputMode === "upload_image" && IMAGE_MIME.has(mime)) {
    const b64 = Buffer.from(buf).toString("base64")
    extracted = await extractInvoiceFromImage(b64, mime)
  } else {
    const text = await extractTextFromPdfBuffer(buf)
    extracted = await extractInvoiceFromText(
      text.length > 20 ? text : "Texte PDF vide — décrire la facture manuellement (contenu: " + text.slice(0, 200) + ")",
    )
  }

  await supabase.from("supplier_invoice_items").delete().eq("invoice_id", invoiceId)

  const lineRows = []
  for (let i = 0; i < extracted.lines.length; i++) {
    const line = extracted.lines[i]
    const m = matchIngredient(ingList, line.name)
    const lineStatus = m.ingredient ? "matched" : "new_ingredient"
    lineRows.push({
      invoice_id: invoiceId,
      line_no: i + 1,
      raw_name: line.name,
      matched_ingredient_id: m.ingredient?.id ?? null,
      line_status: lineStatus,
      quantity: line.quantity,
      unit: line.unit,
      unit_price: line.unit_price,
      line_total: line.line_total,
      vat_rate: line.vat_rate,
      confidence: line.confidence,
    })
  }

  if (lineRows.length) {
    const { error: itErr } = await supabase.from("supplier_invoice_items").insert(lineRows)
    if (itErr) {
      console.error("[upload] items", itErr)
    }
  }

  const { error: finErr } = await supabase
    .from("supplier_invoices")
    .update({
      file_url: fileUrl,
      file_mime: mime,
      original_filename: file.name,
      input_mode: inputMode,
      status: "a_verifier",
      supplier_name_raw: extracted.supplier_name || null,
      invoice_number: extracted.invoice_number || null,
      invoice_date: extracted.invoice_date,
      total_ht: extracted.total_ht,
      tva: extracted.tva,
      total_ttc: extracted.total_ttc,
      extraction_confidence: extracted.extraction_confidence,
      extracted_payload: {
        ...extracted,
        storage_path: objectPath,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId)

  if (finErr) {
    return NextResponse.json({ error: finErr.message }, { status: 500 })
  }

  const { data: full } = await supabase
    .from("supplier_invoices")
    .select(
      `*, supplier:suppliers(id, name), items:supplier_invoice_items(*)`,
    )
    .eq("id", invoiceId)
    .single()

  return NextResponse.json({ invoice: full })
}
