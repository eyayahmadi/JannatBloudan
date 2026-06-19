/**
 * Trait commun pour POST /api/translate-page (batch chaînes).
 *
 * Chaîne de résolution :
 *   1. Dictionnaire statique seed (instantané, hors-ligne)
 *   2. Fournisseur principal (DeepL / Google / Google Cloud)
 *   3. Fournisseur de secours MyMemory si le principal échoue (quota / 5xx)
 *
 * Les chaînes résolues à l'étape (1) ne consomment AUCUN quota fournisseur.
 */
import { isLocale, type Locale } from "@/lib/i18n/config"
import { getSeedDictionary } from "@/lib/i18n/seed-dictionary"
import { resolveTranslationRuntime } from "@/lib/server/env-providers"
import { translateWithDeepLNode } from "@/lib/server/deepl-node-translate"
import {
  translationApiConfigured,
  translateStrings,
} from "@/lib/server/translation-service"
import { translateWithMyMemory } from "@/lib/server/mymemory-translate"

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

function applySeed(
  texts: string[],
  targetLanguage: Locale,
): {
  output: string[]
  pendingIdx: number[]
  pendingTexts: string[]
  seededCount: number
} {
  const dict = getSeedDictionary(targetLanguage)
  const output: string[] = new Array(texts.length)
  const pendingIdx: number[] = []
  const pendingTexts: string[] = []
  let seededCount = 0

  texts.forEach((src, idx) => {
    const seeded = dict[src] ?? dict[src.trim()]
    if (typeof seeded === "string" && seeded.length > 0) {
      output[idx] = seeded
      seededCount++
    } else {
      output[idx] = src
      pendingIdx.push(idx)
      pendingTexts.push(src)
    }
  })

  return { output, pendingIdx, pendingTexts, seededCount }
}

async function tryPrimaryProvider(
  texts: string[],
  targetLanguage: Locale,
): Promise<{ translations: string[]; provider: string; error?: string }> {
  const rt = resolveTranslationRuntime()
  if (!rt.ok) {
    return { translations: [...texts], provider: "none", error: rt.message }
  }
  try {
    if (rt.provider === "deepl") {
      const translations = await translateWithDeepLNode(texts, targetLanguage, rt)
      return { translations, provider: "deepl" }
    }
    // translateStrings applique déjà seed + cache Postgres. On laisse MyMemory
    // désactivé ici : runTranslatePage gère son propre fallback MyMemory au
    // niveau supérieur (avec stats explicites).
    const translations = await translateStrings(texts, targetLanguage, "fr")
    return { translations, provider: rt.provider }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error(`[translate-page] provider=${rt.provider}:`, message)
    return {
      translations: [...texts],
      provider: rt.provider,
      error: message,
    }
  }
}

function indexesStillFrench(
  pendingTexts: string[],
  attempt: string[],
): number[] {
  const out: number[] = []
  for (let i = 0; i < pendingTexts.length; i++) {
    if (!attempt[i] || attempt[i] === pendingTexts[i]) out.push(i)
  }
  return out
}

export async function runTranslatePage(input: {
  texts: string[]
  targetLanguage: Locale
}): Promise<{
  translations: string[]
  configured: boolean
  hint?: string
  error?: string
  stats?: { seeded: number; primary: number; fallback: number; unresolved: number }
}> {
  const { texts, targetLanguage } = input
  if (targetLanguage === "fr") {
    return { translations: [...texts], configured: translationApiConfigured() }
  }

  const { output, pendingIdx, pendingTexts, seededCount } = applySeed(texts, targetLanguage)

  let primaryCount = 0
  let fallbackCount = 0
  let primaryError: string | undefined

  if (pendingTexts.length === 0) {
    return {
      translations: output,
      configured: translationApiConfigured(),
      stats: { seeded: seededCount, primary: 0, fallback: 0, unresolved: 0 },
    }
  }

  // ── Tentative principale ────────────────────────────────────────────────
  const primary = await tryPrimaryProvider(pendingTexts, targetLanguage)
  primaryError = primary.error
  for (let i = 0; i < pendingIdx.length; i++) {
    const translated = primary.translations[i]
    if (translated && translated !== pendingTexts[i]) {
      output[pendingIdx[i]] = translated
      primaryCount++
    }
  }

  // ── Fallback MyMemory pour les chaînes encore en FR ─────────────────────
  const stillIdx = indexesStillFrench(pendingTexts, primary.translations)
  let fallbackError: string | undefined
  if (stillIdx.length > 0) {
    try {
      const stillTexts = stillIdx.map((i) => pendingTexts[i])
      const fb = await translateWithMyMemory(stillTexts, targetLanguage, "fr")
      stillIdx.forEach((localIdx, k) => {
        const out = fb[k]
        if (out && out !== pendingTexts[localIdx]) {
          output[pendingIdx[localIdx]] = out
          fallbackCount++
        }
      })
    } catch (e) {
      fallbackError = e instanceof Error ? e.message : String(e)
      console.error("[translate-page] fallback mymemory:", fallbackError)
    }
  }

  const unresolved = pendingTexts.length - primaryCount - fallbackCount
  const errorParts: string[] = []
  if (primaryError) errorParts.push(`primary(${primary.provider}): ${primaryError}`)
  if (fallbackError) errorParts.push(`fallback(mymemory): ${fallbackError}`)

  return {
    translations: output,
    configured: translationApiConfigured(),
    ...(errorParts.length && unresolved > 0 ? { error: errorParts.join(" | ") } : {}),
    stats: {
      seeded: seededCount,
      primary: primaryCount,
      fallback: fallbackCount,
      unresolved,
    },
  }
}
