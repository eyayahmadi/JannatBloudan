/**
 * Traduction batch via DeepL (deepl-node) — serveur uniquement, clé jamais exposée au client.
 */
import * as deepl from "deepl-node"
import type { Locale } from "@/lib/i18n/config"
import type { TranslationRuntime } from "@/lib/server/env-providers"

const BATCH = 48

const TARGET: Record<Exclude<Locale, "fr">, deepl.TargetLanguageCode> = {
  en: "en-US",
  de: "de",
  ar: "ar",
}

function serverBaseUrl(endpoint: string): string {
  try {
    return new URL(endpoint).origin
  } catch {
    return "https://api-free.deepl.com"
  }
}

export async function translateWithDeepLNode(
  texts: string[],
  targetLanguage: Locale,
  rt: Extract<TranslationRuntime, { ok: true; provider: "deepl" }>,
): Promise<string[]> {
  if (targetLanguage === "fr") return [...texts]

  const target = TARGET[targetLanguage as Exclude<Locale, "fr">]
  if (!target) return [...texts]

  const translator = new deepl.Translator(rt.apiKey, {
    serverUrl: serverBaseUrl(rt.endpoint),
  })

  const out: string[] = new Array(texts.length)
  for (let i = 0; i < texts.length; i += BATCH) {
    const slice = texts.slice(i, i + BATCH)
    const result = await translator.translateText(slice, "fr", target)
    const arr = Array.isArray(result) ? result : [result]
    slice.forEach((_, j) => {
      out[i + j] = arr[j]?.text ?? slice[j]!
    })
  }
  return out
}
