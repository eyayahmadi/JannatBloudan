import { NextResponse } from "next/server"
import {
  parseTranslatePageBody,
  runTranslatePage,
} from "@/lib/server/translate-page-batch"

export const runtime = "nodejs"

/**
 * Traduction page / batch chaînes (clé API serveur uniquement).
 * Contrat attendu :
 * POST { "texts": ["...", "..."], "targetLanguage": "ar" }
 * → { "translations": ["...", "..."] }
 */
export async function POST(req: Request) {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = parseTranslatePageBody(raw)
  if (!parsed.ok) {
    return NextResponse.json(parsed.body, { status: parsed.status })
  }

  const result = await runTranslatePage(parsed)
  return NextResponse.json({
    translations: result.translations,
    configured: result.configured,
    ...(result.hint ? { hint: result.hint } : {}),
    ...(result.error ? { error: result.error } : {}),
  })
}
