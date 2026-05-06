import { createHash } from "node:crypto"
import { createServiceRoleClient } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

const GOOGLE_KEY =
  process.env.GOOGLE_TRANSLATE_API_KEY ?? process.env.GOOGLE_CLOUD_TRANSLATION_API_KEY

/** Code langue pour l’API Google Translation v2 */
const GOOGLE_TARGET: Record<string, string> = {
  en: "en",
  de: "de",
  ar: "ar",
  fr: "fr",
}

const CHUNK = 72

export function translationApiConfigured(): boolean {
  return typeof GOOGLE_KEY === "string" && GOOGLE_KEY.length > 8
}

function lookupHash(sourceLang: string, targetLang: string, text: string): string {
  return createHash("sha256")
    .update(`${sourceLang}\x1f${targetLang}\x1f${text}`, "utf8")
    .digest("hex")
}

async function translateChunkGoogle(texts: string[], source: string, target: string): Promise<string[]> {
  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(GOOGLE_KEY!)}`,
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

/**
 * Traduit une liste de chaînes FR → locale cible, avec cache Postgres (service role).
 * En cas d’échec partiel ou d’API absente, renvoie le texte source pour les entrées concernées.
 */
export async function translateStrings(
  inputs: readonly string[],
  targetLanguage: string,
  sourceLanguage = "fr",
): Promise<string[]> {
  const src = sourceLanguage.slice(0, 5).toLowerCase()
  const tgtNorm = targetLanguage.trim().toLowerCase()
  const tgt = GOOGLE_TARGET[tgtNorm] ?? tgtNorm

  const out = inputs.map((s) => s)
  if (src === tgt || inputs.length === 0) return out
  if (!translationApiConfigured()) return out

  const placeholders: Array<{ idx: number; text: string; hash: string }> = []
  for (let i = 0; i < inputs.length; i++) {
    const raw = inputs[i]
    if (typeof raw !== "string") continue
    const text = raw
    if (!text.trim()) continue
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
  try {
    for (let i = 0; i < uniqOrder.length; i += CHUNK) {
      const slice = uniqOrder.slice(i, i + CHUNK)
      const part = await translateChunkGoogle(slice, src, tgt)
      slice.forEach((orig, k) => {
        translatedByOriginal.set(orig, part[k] ?? orig)
      })
    }
  } catch {
    return inputs.map((s) => (typeof s === "string" ? s : ""))
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
