import { NextResponse } from "next/server"
import { fr } from "@/lib/i18n/messages/fr"
import { flattenMessages } from "@/lib/i18n/flatten-messages"
import { I18N_SOURCE_VERSION } from "@/lib/i18n/source-version"
import type { Locale } from "@/lib/i18n/config"
import {
  translationApiConfigured,
  translateStrings,
} from "@/lib/server/translation-service"

export const runtime = "nodejs"

const ALLOWED_NON_FR: Exclude<Locale, "fr">[] = ["en", "de", "ar"]

export async function POST(req: Request) {
  if (!translationApiConfigured()) {
    return NextResponse.json(
      { error: "GOOGLE_TRANSLATE_API_KEY is not set", code: "NO_KEY" },
      { status: 503 },
    )
  }

  let body: { target?: string }
  try {
    body = (await req.json()) as { target?: string }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const targetLocale = body.target as Locale | undefined
  if (
    !targetLocale ||
    targetLocale === "fr" ||
    !(ALLOWED_NON_FR as string[]).includes(targetLocale)
  ) {
    return NextResponse.json(
      { error: "target must be en, de, or ar" },
      { status: 400 },
    )
  }

  const flat = flattenMessages(fr)
  const keys = Object.keys(flat)
  const values = keys.map((k) => flat[k]!)

  let translated: string[]
  try {
    translated = await translateStrings(values, targetLocale, "fr")
  } catch {
    return NextResponse.json(
      { error: "Translation failed", code: "TRANSLATE_FAILED" },
      { status: 503 },
    )
  }

  if (translated.length !== keys.length) {
    return NextResponse.json(
      { error: "Translation count mismatch" },
      { status: 502 },
    )
  }

  const map: Record<string, string> = {}
  keys.forEach((k, i) => {
    map[k] = translated[i]!
  })

  return NextResponse.json({
    version: I18N_SOURCE_VERSION,
    target: targetLocale,
    map,
  })
}
