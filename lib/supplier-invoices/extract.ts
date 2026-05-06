import type { ExtractedInvoice } from "./types"

const SYSTEM_PROMPT = `Tu es un expert comptable pour des restaurants. Tu reçois le texte ou l'image d'une facture fournisseur.
Extrais un JSON strict avec cette structure (chiffres en nombre, pas de texte):
{
  "supplier_name": "string (nom fournisseur visible)",
  "invoice_number": "string",
  "invoice_date": "YYYY-MM-DD ou null",
  "lines": [
    {
      "name": "string (libellé produit)",
      "quantity": number,
      "unit": "string (kg, L, unites, colis, etc.)",
      "unit_price": number,
      "line_total": number,
      "vat_rate": number or null (ex 20 pour 20%),
      "confidence": number entre 0 et 1
    }
  ],
  "total_ht": number,
  "tva": number (montant total TVA),
  "total_ttc": number,
  "extraction_confidence": number entre 0 et 1
}
Si une donnée manque, mets 0 pour les nombres, "" pour les textes, null pour la date, et baisse extraction_confidence. Ne balance pas d'explication hors JSON.`

function emptyExtraction(err?: string): ExtractedInvoice {
  return {
    supplier_name: "",
    invoice_number: "",
    invoice_date: null,
    lines: [],
    total_ht: 0,
    tva: 0,
    total_ttc: 0,
    extraction_confidence: 0,
    raw_error: err,
  }
}

function parseJson(content: string): ExtractedInvoice {
  const start = content.indexOf("{")
  const end = content.lastIndexOf("}")
  if (start < 0 || end < start) return emptyExtraction("JSON manquant")
  const raw = JSON.parse(content.slice(start, end + 1)) as Record<string, unknown>
  const linesRaw = Array.isArray(raw.lines) ? raw.lines : []
  return {
    supplier_name: String(raw.supplier_name ?? ""),
    invoice_number: String(raw.invoice_number ?? ""),
    invoice_date: raw.invoice_date ? String(raw.invoice_date) : null,
    lines: linesRaw.map((l) => {
      const o = l as Record<string, unknown>
      return {
        name: String(o.name ?? ""),
        quantity: Number(o.quantity) || 0,
        unit: String(o.unit ?? "u"),
        unit_price: Number(o.unit_price) || 0,
        line_total: Number(o.line_total) || 0,
        vat_rate: o.vat_rate == null || o.vat_rate === "" ? null : Number(o.vat_rate),
        confidence: Math.min(1, Math.max(0, Number(o.confidence) || 0.5)),
      }
    }),
    total_ht: Number(raw.total_ht) || 0,
    tva: Number(raw.tva) || 0,
    total_ttc: Number(raw.total_ttc) || 0,
    extraction_confidence: Math.min(1, Math.max(0, Number(raw.extraction_confidence) || 0)),
  }
}

async function callOpenAI(body: object): Promise<string> {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error("OPENAI_API_KEY manquant")
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t.slice(0, 500) || res.statusText)
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  return data.choices?.[0]?.message?.content ?? ""
}

/**
 * Extraction texte (PDF) via modèle de chat.
 */
export async function extractInvoiceFromText(plainText: string): Promise<ExtractedInvoice> {
  if (!process.env.OPENAI_API_KEY) {
    return emptyExtraction("Variable OPENAI_API_KEY non configuree (extraction manuelle requise)")
  }
  const content = await callOpenAI({
    model: process.env.OPENAI_INVOICE_MODEL ?? "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.1,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Contenu de facture (texte extrait d'un PDF):\n\n${plainText.slice(0, 32000)}`,
      },
    ],
  })
  try {
    return parseJson(content)
  } catch {
    return emptyExtraction("Echec parsing JSON de l'IA")
  }
}

/**
 * Vision: image (PNG, JPEG, WebP).
 */
export async function extractInvoiceFromImage(
  base64: string,
  mime: string,
): Promise<ExtractedInvoice> {
  if (!process.env.OPENAI_API_KEY) {
    return emptyExtraction("Variable OPENAI_API_KEY non configuree (extraction manuelle requise)")
  }
  const content = await callOpenAI({
    model: process.env.OPENAI_INVOICE_VISION_MODEL ?? "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.1,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Extrais toutes les données de cette facture scannée." },
          { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } },
        ],
      },
    ],
  })
  try {
    return parseJson(content)
  } catch {
    return emptyExtraction("Echec parsing JSON de l'IA (image)")
  }
}

export async function extractTextFromPdfBuffer(buf: ArrayBuffer): Promise<string> {
  try {
    const { PDFParse } = await import("pdf-parse")
    const parser = new PDFParse({ data: new Uint8Array(buf) })
    const result = await parser.getText()
    await parser.destroy().catch(() => {})
    return result.text ?? ""
  } catch (e) {
    console.error("[pdf-parse]", e)
    return ""
  }
}
