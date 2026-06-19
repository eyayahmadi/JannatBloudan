/**
 * MyMemory translation fallback.
 *
 * Endpoint : https://api.mymemory.translated.net/get?q=...&langpair=fr|en
 * - Pas de clé requise pour la version anonyme (5 000 caractères / IP / jour).
 * - Optionnel : `MYMEMORY_EMAIL` (50 000 chars/jour) ou `MYMEMORY_KEY`
 *   (10 millions chars/mois sur compte premium).
 * Sert de **fallback** lorsque DeepL ou Google échoue (quota / panne).
 */

const ENDPOINT = "https://api.mymemory.translated.net/get"

const LANG_MAP: Record<string, string> = {
  fr: "fr",
  en: "en",
  de: "de",
  ar: "ar",
}

type Response = {
  responseData?: { translatedText?: string }
  responseStatus?: number
  responseDetails?: string
  matches?: Array<{ translation?: string; quality?: number | string }>
}

const TIMEOUT_MS = 6000

async function translateOne(text: string, source: string, target: string): Promise<string> {
  const params = new URLSearchParams()
  params.set("q", text)
  params.set("langpair", `${source}|${target}`)
  const email = process.env.MYMEMORY_EMAIL?.trim()
  if (email) params.set("de", email)
  const key = process.env.MYMEMORY_KEY?.trim()
  if (key) params.set("key", key)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${ENDPOINT}?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = (await res.json()) as Response
    const primary = json.responseData?.translatedText?.trim()
    if (primary && primary.toLowerCase() !== text.toLowerCase()) return primary
    // Fallback : choisir la meilleure correspondance dans matches
    const best = (json.matches ?? [])
      .filter((m) => typeof m.translation === "string")
      .sort((a, b) => Number(b.quality ?? 0) - Number(a.quality ?? 0))[0]
    if (best?.translation) return best.translation
    return text
  } catch {
    return text
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Traduit en lot via MyMemory. Effectue un appel par chaîne (l'API publique
 * ne supporte pas de vrai batch), avec un parallélisme limité pour éviter
 * d'être throttlé. Renvoie toujours un tableau de même longueur que l'entrée.
 */
export async function translateWithMyMemory(
  texts: string[],
  targetLanguage: string,
  sourceLanguage = "fr",
): Promise<string[]> {
  const src = LANG_MAP[sourceLanguage] ?? sourceLanguage
  const tgt = LANG_MAP[targetLanguage] ?? targetLanguage
  if (!src || !tgt || src === tgt) return [...texts]
  if (texts.length === 0) return []

  const CONCURRENCY = 5
  const out: string[] = new Array(texts.length).fill("")

  for (let i = 0; i < texts.length; i += CONCURRENCY) {
    const slice = texts.slice(i, i + CONCURRENCY)
    const results = await Promise.all(slice.map((t) => translateOne(t, src, tgt)))
    for (let k = 0; k < slice.length; k++) {
      out[i + k] = results[k] ?? slice[k]
    }
  }

  return out
}
