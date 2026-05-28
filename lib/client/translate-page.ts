"use client"

import type { Locale } from "@/lib/i18n/config"

export type TranslatePageResponse = {
  translations: string[]
  configured?: boolean
  hint?: string
  error?: string
}

/**
 * Traduction batch côté client : appelle uniquement la route serveur (clé DeepL / Google jamais exposée).
 */
export async function translatePage(texts: string[], targetLanguage: Locale): Promise<TranslatePageResponse> {
  const res = await fetch("/api/translate-page", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      texts,
      targetLanguage,
    }),
  })

  let body: TranslatePageResponse
  try {
    body = (await res.json()) as TranslatePageResponse
  } catch {
    return { translations: texts, configured: false, error: "Invalid response" }
  }

  const translations = Array.isArray(body.translations) ? body.translations : texts
  if (translations.length !== texts.length) {
    return { translations: texts, configured: body.configured, error: "Length mismatch" }
  }

  return {
    translations,
    configured: body.configured,
    hint: body.hint,
    error: body.error,
  }
}
