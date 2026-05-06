import { NextResponse } from "next/server"
import { translationApiConfigured, translateStrings } from "@/lib/server/translation-service"

export const runtime = "nodejs"

const MAX_ITEMS = 120
const MAX_STRING_LEN = 12000

const VALID_TARGETS = new Set(["en", "de", "ar", "fr"])

/**
 * Traduction serveur avec cache Postgres (voir translation_service / translation_cache).
 * Les clés API ne sont jamais envoyées au client.
 */
export async function POST(req: Request) {
  let body: { texts?: unknown; targetLanguage?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const tl = body.targetLanguage
  const rawTarget =
    typeof tl === "string" ? tl.trim().toLowerCase() : ""

  if (!rawTarget || !VALID_TARGETS.has(rawTarget)) {
    return NextResponse.json(
      { error: "targetLanguage must be one of fr, en, de, ar" },
      { status: 400 },
    )
  }

  const textsIn = body.texts
  if (!Array.isArray(textsIn)) {
    return NextResponse.json({ error: "texts must be an array of strings" }, { status: 400 })
  }
  if (textsIn.length === 0 || textsIn.length > MAX_ITEMS) {
    return NextResponse.json(
      { error: `texts must have 1 to ${MAX_ITEMS} items` },
      { status: 400 },
    )
  }

  const texts = textsIn.map((x) => String(x ?? "").slice(0, MAX_STRING_LEN))

  if (!translationApiConfigured()) {
    return NextResponse.json({ translations: [...texts] })
  }

  try {
    const translations = await translateStrings(texts, rawTarget, "fr")
    return NextResponse.json({ translations })
  } catch {
    return NextResponse.json({ translations: [...texts] })
  }
}
