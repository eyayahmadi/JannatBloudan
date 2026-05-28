import { NextResponse } from "next/server"
import {
  parseTranslatePageBody,
  runTranslatePage,
} from "@/lib/server/translate-page-batch"

export const runtime = "nodejs"

/** @deprecated Alias historique ; préférez POST /api/translate-page avec le même corps. */
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

  /** Compat ancien contrat `{ translations }` + champs facultatifs. */
  const body: Record<string, unknown> = {
    translations: result.translations,
    configured: result.configured,
  }
  if (result.hint) body.hint = result.hint
  if (result.error) body.error = result.error

  return NextResponse.json(body)
}
