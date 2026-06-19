import { createHash } from "node:crypto"
import googleTranslatePkg from "@google-cloud/translate"
import { createServiceRoleClient } from "@/lib/auth/admin-api"

/** Équivalent ESM de : `const { Translate } = require('@google-cloud/translate').v2` */
const { Translate } = googleTranslatePkg.v2
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { resolveTranslationRuntime, type TranslationRuntime } from "@/lib/server/env-providers"
import { shouldBypassMachineTranslation } from "@/lib/server/translation-guards"
import { getSeedDictionary } from "@/lib/i18n/seed-dictionary"
import { translateWithMyMemory } from "@/lib/server/mymemory-translate"
import type { Locale } from "@/lib/i18n/config"

const CHUNK = 72

/** Code langue pour l’API Google Translation v2 */
const GOOGLE_TARGET: Record<string, string> = {
  en: "en",
  de: "de",
  ar: "ar",
  fr: "fr",
}

export function translationApiConfigured(): boolean {
  return resolveTranslationRuntime().ok
}

/** Message humain lorsque non configuré (logs / API sans exposer la clé). */
export function translationConfigureHint(): string {
  const rt = resolveTranslationRuntime()
  if (rt.ok) {
    if (rt.provider === "deepl") return "deepl"
    if (rt.provider === "google_cloud") return "google_cloud"
    return "google"
  }
  return rt.message
}

function lookupHash(sourceLang: string, targetLang: string, text: string): string {
  return createHash("sha256")
    .update(`${sourceLang}\x1f${targetLang}\x1f${text}`, "utf8")
    .digest("hex")
}

async function translateChunkGoogle(apiKey: string, texts: string[], source: string, target: string): Promise<string[]> {
  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: texts,
        source,
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

async function translateChunkGoogleCloud(
  texts: string[],
  source: string,
  target: string,
  rt: Extract<TranslationRuntime, { ok: true; provider: "google_cloud" }>,
): Promise<string[]> {
  const cfg: ConstructorParameters<typeof Translate>[0] = {}
  if (rt.projectId) cfg.projectId = rt.projectId
  if (rt.keyFilename) cfg.keyFilename = rt.keyFilename
  if (rt.apiKey) cfg.key = rt.apiKey
  const client = new Translate(cfg)
  const [raw] = await client.translate(texts, { from: source, to: target, format: "text" })
  if (Array.isArray(raw)) {
    if (raw.length !== texts.length) throw new Error("google_cloud_translate_length_mismatch")
    return raw
  }
  if (typeof raw === "string" && texts.length === 1) return [raw]
  throw new Error("google_cloud_translate_unexpected_response")
}

const DEEPL_TARGET_MAP: Record<string, string> = {
  en: "EN",
  de: "DE",
  ar: "AR",
  fr: "FR",
}
const DEEPL_SOURCE_MAP: Record<string, string> = {
  fr: "FR",
  en: "EN",
  de: "DE",
  ar: "AR",
}

async function translateChunkDeepL(
  endpoint: string,
  apiKey: string,
  texts: string[],
  source: string,
  target: string,
): Promise<string[]> {
  const body = new URLSearchParams()
  for (const q of texts) body.append("text", q)
  body.set("target_lang", DEEPL_TARGET_MAP[target] ?? target.toUpperCase())
  const srcLang = DEEPL_SOURCE_MAP[source]
  if (srcLang) body.set("source_lang", srcLang)

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: body.toString(),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(errText || res.statusText)
  }
  const data = (await res.json()) as { translations?: { text: string }[] }
  const arr = data.translations ?? []
  if (arr.length !== texts.length) throw new Error("deepl_length_mismatch")
  return arr.map((x) => x.text)
}

export type TranslateStringsOptions = {
  /**
   * Activer le fallback MyMemory si le fournisseur principal échoue / renvoie
   * la chaîne d'origine. Désactivé par défaut pour les appels massifs
   * (typiquement le namespace messages.fr complet) afin de ne pas brûler la
   * quota anonyme de MyMemory. À activer côté routes de traduction page
   * (`/api/translate-page`) qui traitent des lots plus petits et plus visibles.
   */
  enableMyMemoryFallback?: boolean
}

/**
 * Traduit une liste de chaînes FR → locale cible, avec cache Postgres (service role).
 * En cas d’échec partiel ou d’API absente, renvoie le texte source pour les entrées concernées.
 *
 * Ordre des résolutions :
 *   1. Dictionnaire seed (instantané, hors-ligne)
 *   2. Cache Postgres (translation_cache) si disponible
 *   3. Fournisseur principal (DeepL / Google / Google Cloud)
 *   4. (Optionnel) Fallback MyMemory si `enableMyMemoryFallback=true`
 */
export async function translateStrings(
  inputs: readonly string[],
  targetLanguage: string,
  sourceLanguage = "fr",
  options: TranslateStringsOptions = {},
): Promise<string[]> {
  const { enableMyMemoryFallback = false } = options
  const src = sourceLanguage.slice(0, 5).toLowerCase()
  const tgtNorm = targetLanguage.trim().toLowerCase()
  const tgt = GOOGLE_TARGET[tgtNorm] ?? tgtNorm

  const out = inputs.map((s) => s)
  if (src === tgt || inputs.length === 0) return out

  const rt = resolveTranslationRuntime()

  // Seed-only path : si AUCUN provider n'est configuré, on applique au moins
  // le dictionnaire statique avant de rendre la main. Cela garantit que les
  // chaînes UI critiques sont toujours traduites, même hors API distante.
  if (!rt.ok) {
    const seedOnly = getSeedDictionary(tgt as Locale)
    if (Object.keys(seedOnly).length === 0) return out
    for (let i = 0; i < inputs.length; i++) {
      const raw = inputs[i]
      if (typeof raw !== "string") continue
      const seeded = seedOnly[raw] ?? seedOnly[raw.trim()]
      if (typeof seeded === "string" && seeded.length > 0) out[i] = seeded
    }
    return out
  }

  const placeholders: Array<{ idx: number; text: string; hash: string }> = []
  for (let i = 0; i < inputs.length; i++) {
    const raw = inputs[i]
    if (typeof raw !== "string") continue
    const text = raw
    if (!text.trim()) continue
    if (shouldBypassMachineTranslation(text)) continue
    placeholders.push({ idx: i, text, hash: lookupHash(src, tgt, text) })
  }
  if (placeholders.length === 0) return out

  const hashToTranslated = new Map<string, string>()

  if (hasServerSupabaseEnv()) {
    try {
      const supabase = createServiceRoleClient()
      const hashes = [...new Set(placeholders.map((p) => p.hash))]
      const { data: cached } = await supabase
        .from("translation_cache")
        .select("lookup_hash, translated_text")
        .in("lookup_hash", hashes)

      for (const row of cached ?? []) {
        const h = String((row as { lookup_hash?: string }).lookup_hash ?? "")
        const tr = String((row as { translated_text?: string }).translated_text ?? "")
        if (h && tr) hashToTranslated.set(h, tr)
      }
    } catch {
      /* pas de cache : on continue uniquement avec Google */
    }
  }

  const toFetch: typeof placeholders = []
  for (const p of placeholders) {
    const hit = hashToTranslated.get(p.hash)
    if (hit != null && hit !== "") {
      out[p.idx] = hit
    } else {
      toFetch.push(p)
    }
  }

  if (toFetch.length === 0) return out

  const uniqOrder: string[] = []
  const seen = new Set<string>()
  for (const p of toFetch) {
    if (!seen.has(p.text)) {
      seen.add(p.text)
      uniqOrder.push(p.text)
    }
  }

  const translatedByOriginal = new Map<string, string>()

  // ── 1. SEED dictionary : zéro appel API pour les chaînes connues ────────
  const seed = getSeedDictionary(tgt as Locale)
  const stillToFetch: string[] = []
  for (const orig of uniqOrder) {
    const seeded = seed[orig] ?? seed[orig.trim()]
    if (typeof seeded === "string" && seeded.length > 0) {
      translatedByOriginal.set(orig, seeded)
    } else {
      stillToFetch.push(orig)
    }
  }

  // ── 2. Fournisseur principal (DeepL / Google / Google Cloud) ────────────
  let primaryFailed = false
  try {
    for (let i = 0; i < stillToFetch.length; i += CHUNK) {
      const slice = stillToFetch.slice(i, i + CHUNK)
      const part =
        rt.provider === "deepl"
          ? await translateChunkDeepL(rt.endpoint, rt.apiKey, slice, src, tgt)
          : rt.provider === "google_cloud"
            ? await translateChunkGoogleCloud(slice, src, tgt, rt)
            : await translateChunkGoogle(rt.apiKey, slice, src, tgt)
      slice.forEach((orig, k) => {
        translatedByOriginal.set(orig, part[k] ?? orig)
      })
    }
  } catch (err) {
    primaryFailed = true
    console.warn(
      `[translation-service] primary provider ${rt.provider} failed:`,
      err instanceof Error ? err.message : err,
    )
  }

  // ── 3. (Optionnel) Fallback MyMemory pour les entrées restées en source.
  //       Désactivé sur les gros lots (namespace messages complet) afin de
  //       préserver la quota anonyme. Activé sur /api/translate-page (lots
  //       petits, visibles, déjà filtrés par AutoTranslateDom).
  if (enableMyMemoryFallback) {
    const stillFr: string[] = []
    for (const orig of stillToFetch) {
      const t = translatedByOriginal.get(orig)
      if (primaryFailed || !t || t === orig) stillFr.push(orig)
    }
    if (stillFr.length > 0) {
      try {
        const fb = await translateWithMyMemory(stillFr, tgt, src)
        stillFr.forEach((orig, k) => {
          const v = fb[k]
          if (v && v !== orig) translatedByOriginal.set(orig, v)
        })
      } catch (err) {
        console.warn(
          "[translation-service] mymemory fallback failed:",
          err instanceof Error ? err.message : err,
        )
      }
    }
  }

  const upsertMap = new Map<
    string,
    {
      lookup_hash: string
      source_lang: string
      target_lang: string
      source_text: string
      translated_text: string
    }
  >()
  for (const p of toFetch) {
    const tr = translatedByOriginal.get(p.text) ?? p.text
    out[p.idx] = tr
    if (tr !== p.text && tr.trim()) {
      upsertMap.set(p.hash, {
        lookup_hash: p.hash,
        source_lang: src,
        target_lang: tgt,
        source_text: p.text,
        translated_text: tr,
      })
    }
  }
  const upsertRows = [...upsertMap.values()]

  if (hasServerSupabaseEnv() && upsertRows.length) {
    try {
      const supabase = createServiceRoleClient()
      const { error } = await supabase.from("translation_cache").upsert(upsertRows, {
        onConflict: "lookup_hash",
      })
      if (error) console.warn("[translation_cache]", error.message)
    } catch {
      /* ignore persistence errors */
    }
  }

  return out
}
