import { NextResponse } from "next/server"
import { fr } from "@/lib/i18n/messages/fr"
import { flattenMessages } from "@/lib/i18n/flatten-messages"
import { I18N_SOURCE_VERSION } from "@/lib/i18n/source-version"
import type { Locale } from "@/lib/i18n/config"

const GOOGLE_KEY = process.env.GOOGLE_TRANSLATE_API_KEY

const TARGET: Record<Exclude<Locale, "fr">, string> = {
  en: "en",
  de: "de",
  ar: "ar",
}

const CHUNK = 80

async function translateChunk(
  texts: string[],
  target: string,
): Promise<string[]> {
  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(
      GOOGLE_KEY!,
    )}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: texts,
        source: "fr",
        target,
        format: "text",
      }),
    },
  )
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || res.statusText)
  }
  const data = (await res.json()) as {
    data: { translations: { translatedText: string }[] }
  }
  return data.data.translations.map((x) => x.translatedText)
}

export async function POST(req: Request) {
  if (!GOOGLE_KEY) {
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

  const targetLocale = body.target
  if (
    !targetLocale ||
    targetLocale === "fr" ||
    !(targetLocale in TARGET)
  ) {
    return NextResponse.json(
      { error: "target must be en, de, or ar" },
      { status: 400 },
    )
  }

  const target = TARGET[targetLocale as Exclude<Locale, "fr">]
  const flat = flattenMessages(fr)
  const keys = Object.keys(flat)
  const values = keys.map((k) => flat[k]!)

  const translated: string[] = []
  for (let i = 0; i < values.length; i += CHUNK) {
    const slice = values.slice(i, i + CHUNK)
    const part = await translateChunk(slice, target)
    translated.push(...part)
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
