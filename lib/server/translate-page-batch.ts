/**
 * Trait commun pour POST /api/translate-page (batch chaînes).
 * DeepL : deepl-node + TRANSLATION_PROVIDER=deepl. Google : translateStrings (REST / google_cloud).
 */
import { isLocale, type Locale } from "@/lib/i18n/config"
import { resolveTranslationRuntime } from "@/lib/server/env-providers"
import { translateWithDeepLNode } from "@/lib/server/deepl-node-translate"
import {
  translationApiConfigured,
  translationConfigureHint,
  translateStrings,
} from "@/lib/server/translation-service"

export const TRANSLATE_PAGE_MAX_ITEMS = 250
export const TRANSLATE_PAGE_MAX_STRING_LEN = 12000

const VALID_TARGETS = new Set(["en", "de", "ar", "fr"])

export type TranslatePageInput =
  | { ok: false; status: number; body: Record<string, unknown> }
  | { ok: true; texts: string[]; targetLanguage: Locale }

export function parseTranslatePageBody(raw: unknown): TranslatePageInput {
  if (!raw || typeof raw !== "object") {
    return { ok: false, status: 400, body: { error: "Invalid JSON" } }
  }
  const body = raw as Record<string, unknown>
  const tl = body.targetLanguage
  const target = typeof tl === "string" ? tl.trim().toLowerCase() : ""

  if (!isLocale(target) || !VALID_TARGETS.has(target)) {
    return {
      ok: false,
      status: 400,
      body: { error: "targetLanguage must be one of fr, en, de, ar" },
    }
  }

  const textsIn = body.texts
  if (!Array.isArray(textsIn)) {
    return { ok: false, status: 400, body: { error: "texts must be an array of strings" } }
  }
  if (textsIn.length === 0 || textsIn.length > TRANSLATE_PAGE_MAX_ITEMS) {
    return {
      ok: false,
      status: 400,
      body: { error: `texts must have 1 to ${TRANSLATE_PAGE_MAX_ITEMS} items` },
    }
  }

  const texts = textsIn.map((x) => String(x ?? "").slice(0, TRANSLATE_PAGE_MAX_STRING_LEN))
  return { ok: true, texts, targetLanguage: target as Locale }
}

export async function runTranslatePage(input: {
  texts: string[]
  targetLanguage: Locale
}): Promise<{
  translations: string[]
  configured: boolean
  hint?: string
  error?: string
}> {
  const { texts, targetLanguage } = input
  if (targetLanguage === "fr") {
    return { translations: [...texts], configured: translationApiConfigured() }
  }

  const rt = resolveTranslationRuntime()
  if (!rt.ok) {
    return {
      translations: [...texts],
      configured: false,
      hint: rt.message,
      error: "Translation API not configured",
    }
  }

  try {
    if (rt.provider === "deepl") {
      const translations = await translateWithDeepLNode(texts, targetLanguage, rt)
      return { translations, configured: true }
    }

    const translations = await translateStrings(texts, targetLanguage, "fr")
    return { translations, configured: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error(`[translate-page] provider=${rt.provider}:`, message)
    return {
      translations: [...texts],
      configured: true,
      error: `Translation failed (${rt.provider}): ${message}`,
    }
  }
}
