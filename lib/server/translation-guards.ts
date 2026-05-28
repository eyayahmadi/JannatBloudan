/** Heuristiques pour ne pas envoyer à la MT des segments purement techniques / données. */

const EMAIL_RE = /\S+@\S+\.\S+/
/** Téléphone avec au moins 8 chiffres */
const PHONE_RE = /(?:\+\d{1,4}[\s-]?)?(?:\(0\)|\(|)?\d{2,4}[\s).-]*\d{4,}/

/** Prix / devise (laissés tels quels) */
const PRICE_LINE = /^\s*[\d\s.,]+\s*(?:€|\$|USD|EUR|eur|usd)?\s*$/i

/** Code promo court majuscules + chiffres */
const PROMO_TOKEN = /^[A-Z0-9]{4,20}$/

const EXACT_KEEP = new Set<string>(["Jannat Bloudan", "SMS", "QR", "POS", "TVA", "IBAN", "EUR"])

/** Bypass traduction automatique pour toute une chaîne (une entrée liste). */
export function shouldBypassMachineTranslation(text: string): boolean {
  const t = text.trim()
  if (t.length <= 1) return true
  if (EXACT_KEEP.has(t)) return true
  if (EMAIL_RE.test(t) && t.length < 320) return true
  /** Code postal + ville (court) — souvent données brutes */
  if (/^\s*\d{4,5}\s+[A-Za-zÀ-ÿ]/.test(t) && t.length < 280) return true
  if (PHONE_RE.test(t)) {
    const digits = (t.match(/\d/g) ?? []).length
    const compact = t.replace(/\s/g, "")
    if (digits >= 8 && compact.length < 48) return true
  }
  const collapsed = t.replace(/\u00a0/g, " ")
  if (PRICE_LINE.test(collapsed)) return true
  if (/\b\d+[.,]\d{2}\s*€|\b\d+[.,]\d{2}\s*EUR\b/i.test(t)) return true
  if (PROMO_TOKEN.test(t) && /\d/.test(t) && /[A-Z]/.test(t)) return true
  if (/^[\d\s.,:%+\-]+$/.test(t)) return true

  return false
}
