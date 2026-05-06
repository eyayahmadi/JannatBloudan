export type SupplierInvoiceStatus =
  | "brouillon"
  | "extraction_en_cours"
  | "a_verifier"
  | "validee"
  | "rejetee"

export type SupplierInvoiceInputMode = "upload_image" | "upload_pdf" | "manuel"

export type InvoiceItemLineStatus = "pending" | "matched" | "new_ingredient" | "ignored"

export type ExtractedLine = {
  name: string
  quantity: number
  unit: string
  unit_price: number
  line_total: number
  vat_rate: number | null
  confidence: number
}

export type ExtractedInvoice = {
  supplier_name: string
  invoice_number: string
  invoice_date: string | null
  lines: ExtractedLine[]
  total_ht: number
  tva: number
  total_ttc: number
  extraction_confidence: number
  raw_error?: string
}

export type IngredientRow = { id: string; name: string; unit: string | null }
