/**
 * Configuration OCR / Traduction / Google Maps — lectures serveur uniquement.
 * Jamais importer ce module dans du code client ou du code exposé au bundle navigateur.
 */

export type OcrProviderId = "openai" | "disabled"

export type TranslationProviderId = "google" | "google_cloud" | "deepl" | "none"

export type OcrRuntime =
  | { ok: true; provider: Exclude<OcrProviderId, "disabled">; apiKey: string; visionModel?: string; textModel?: string }
  | { ok: false; provider: OcrProviderId; message: string }

export type TranslationRuntime =
  | { ok: true; provider: "google"; apiKey: string }
  | {
      ok: true
      provider: "google_cloud"
      /** Clé API (équivalent REST) — optionnel si compte de service ou ADC */
      apiKey?: string
      /** Chemin vers le JSON du compte de service */
      keyFilename?: string
      projectId?: string
    }
  | { ok: true; provider: "deepl"; apiKey: string; endpoint: string }
  | { ok: false; provider: TranslationProviderId; message: string }

export type MapsRuntime =
  | { ok: true; apiKey: string; placeId: string }
  | { ok: false; message: string }

function nz(s: string | undefined): string {
  return (s ?? "").trim()
}

/** OCR : OPENAI_* reste toléré pour compat (OCR_PROVIDER + OCR_API_KEY recommandés en prod). */
export function resolveOcrRuntime(): OcrRuntime {
  const raw = nz(process.env.OCR_PROVIDER).toLowerCase()
  if (raw === "disabled" || raw === "none" || raw === "off") {
    return {
      ok: false,
      provider: "disabled",
      message:
        "OCR_PROVIDER=disabled ou non configuré avec clé fournisseur. Définissez OCR_PROVIDER=openai et OCR_API_KEY (ou fallback OPENAI_API_KEY).",
    }
  }
  const implicitOpenAi = !raw || raw === "openai"
  if (!implicitOpenAi && raw !== "openai") {
    return {
      ok: false,
      provider: "disabled",
      message: `OCR_PROVIDER « ${raw} » non pris en charge. Valeurs acceptées : openai, disabled.`,
    }
  }

  const key = nz(process.env.OCR_API_KEY) || nz(process.env.OPENAI_API_KEY)
  if (!key) {
    return {
      ok: false,
      provider: "disabled",
      message:
        "Clé OCR manquante : définissez OCR_API_KEY (ou OPENAI_API_KEY en compat) avec OCR_PROVIDER=openai.",
    }
  }

  return {
    ok: true,
    provider: "openai",
    apiKey: key,
    visionModel: nz(process.env.OPENAI_INVOICE_VISION_MODEL) || "gpt-4o-mini",
    textModel: nz(process.env.OPENAI_INVOICE_MODEL) || "gpt-4o-mini",
  }
}

/** Traduction : TRANSLATION_API_KEY ou compat GOOGLE_TRANSLATE_API_KEY */
export function resolveTranslationRuntime(): TranslationRuntime {
  const prov = nz(process.env.TRANSLATION_PROVIDER).toLowerCase()
  const keyRaw =
    nz(process.env.TRANSLATION_API_KEY) ||
    nz(process.env.GOOGLE_TRANSLATE_API_KEY) ||
    nz(process.env.GOOGLE_CLOUD_TRANSLATION_API_KEY)

  if (prov === "none" || prov === "disabled" || prov === "off") {
    return {
      ok: false,
      provider: "none",
      message:
        "TRANSLATION_PROVIDER=none (ou désactivé). Définissez TRANSLATION_PROVIDER=google|deepl et TRANSLATION_API_KEY pour activer.",
    }
  }

  if (prov === "deepl") {
    if (!keyRaw || keyRaw.length < 8) {
      return {
        ok: false,
        provider: "none",
        message:
          "DeepL : TRANSLATION_API_KEY manquante (avec TRANSLATION_PROVIDER=deepl).",
      }
    }
    const endpoint =
      nz(process.env.DEEPL_API_URL) || "https://api-free.deepl.com/v2/translate"
    return { ok: true, provider: "deepl", apiKey: keyRaw, endpoint }
  }

  if (prov === "google_cloud") {
    const credPath = nz(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    const projectId = nz(process.env.GOOGLE_CLOUD_PROJECT)
    if (credPath) {
      return {
        ok: true,
        provider: "google_cloud",
        keyFilename: credPath,
        projectId: projectId || undefined,
        ...(keyRaw.length >= 8 ? { apiKey: keyRaw } : {}),
      }
    }
    if (keyRaw.length >= 8) {
      return { ok: true, provider: "google_cloud", apiKey: keyRaw, projectId: projectId || undefined }
    }
    if (projectId) {
      return { ok: true, provider: "google_cloud", projectId }
    }
    return {
      ok: false,
      provider: "none",
      message:
        "google_cloud : définissez GOOGLE_APPLICATION_CREDENTIALS (JSON compte de service), ou TRANSLATION_API_KEY / GOOGLE_TRANSLATE_API_KEY, ou GOOGLE_CLOUD_PROJECT (ADC).",
    }
  }

  /* google ou vide : Google v2 HTTP (clé API) par défaut */
  if (prov !== "" && prov !== "google") {
    return {
      ok: false,
      provider: "none",
      message: `TRANSLATION_PROVIDER « ${prov} » non prise en charge. Utilisez google, google_cloud, deepl ou none.`,
    }
  }

  if (!keyRaw || keyRaw.length < 8) {
    return {
      ok: false,
      provider: "none",
      message:
        "Traduction inactive : TRANSLATION_API_KEY manquante (compat : GOOGLE_TRANSLATE_API_KEY / GOOGLE_CLOUD_TRANSLATION_API_KEY).",
    }
  }

  return { ok: true, provider: "google", apiKey: keyRaw }
}

export function resolveMapsReviewsRuntime(): MapsRuntime {
  const apiKey = nz(process.env.GOOGLE_MAPS_API_KEY)
  const placeId = nz(process.env.GOOGLE_PLACE_ID)
  if (!apiKey || apiKey.length < 8)
    return { ok: false, message: "GOOGLE_MAPS_API_KEY manquante ou trop courte." }
  if (!placeId) return { ok: false, message: "GOOGLE_PLACE_ID manquant." }
  return { ok: true, apiKey, placeId }
}
