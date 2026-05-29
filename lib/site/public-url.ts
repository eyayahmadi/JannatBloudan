/**
 * Helper central pour résoudre l'URL publique du site, utilisée par les
 * générateurs de QR codes, les liens d'invitation, les emails transactionnels,
 * etc.
 *
 * Stratégie (du plus prioritaire au moins prioritaire) :
 *
 *   1. `NEXT_PUBLIC_SITE_URL`            — défini manuellement (Vercel, .env)
 *   2. `https://${VERCEL_URL}`           — déploiement Vercel automatique
 *   3. `request.headers.host` + protocol — détection runtime (utile derrière
 *                                          n'importe quel reverse proxy)
 *   4. `http://localhost:3000`           — UNIQUEMENT en dev (NODE_ENV !== 'production')
 *
 * Côté client : on suit la même logique avec `window.location.origin` à la
 * place de l'en-tête HTTP.
 *
 * Les chaînes "placeholder" ou contenant `your-project-ref` / `example.com`
 * sont considérées invalides et ignorées.
 */

const PLACEHOLDER_RE = /your-project-ref|placeholder|example\.com|tobereplaced/i

/** Vrai si la chaîne ressemble à une URL HTTP(S) absolue et qu'elle n'est pas un placeholder. */
export function isValidPublicSiteUrl(value: unknown): value is string {
  if (typeof value !== "string") return false
  const v = value.trim()
  if (!v) return false
  if (!/^https?:\/\//i.test(v)) return false
  if (PLACEHOLDER_RE.test(v)) return false
  return true
}

function clean(url: string): string {
  return url.trim().replace(/\/+$/, "")
}

function fromEnv(): string | null {
  const raw = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SITE_URL : undefined
  return isValidPublicSiteUrl(raw) ? clean(raw) : null
}

function fromVercel(): string | null {
  const vu = typeof process !== "undefined" ? process.env.VERCEL_URL : undefined
  if (typeof vu !== "string" || !vu.trim()) return null
  const candidate = vu.startsWith("http") ? vu : `https://${vu}`
  return isValidPublicSiteUrl(candidate) ? clean(candidate) : null
}

function fromRequest(req?: Request | null): string | null {
  if (!req) return null
  try {
    const h = req.headers
    const host =
      h.get("x-forwarded-host") ?? h.get("host") ?? new URL(req.url).host ?? ""
    if (!host) return null
    const proto =
      h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
    const candidate = `${proto}://${host}`
    return isValidPublicSiteUrl(candidate) ? clean(candidate) : null
  } catch {
    return null
  }
}

function devFallback(): string | null {
  if (typeof process === "undefined") return null
  if (process.env.NODE_ENV === "production") return null
  return "http://localhost:3000"
}

/**
 * Résolution côté serveur. Passe la `Request` quand possible pour bénéficier
 * de la détection runtime du host (utile en preview Vercel sans NEXT_PUBLIC_SITE_URL).
 *
 * Lance jamais — renvoie une chaîne vide si aucune source n'est valide en prod.
 */
export function getPublicSiteUrl(req?: Request | null): string {
  return fromEnv() ?? fromVercel() ?? fromRequest(req ?? null) ?? devFallback() ?? ""
}

/**
 * Diagnostic du résultat — utile pour l'UI admin (afficher quelle source est
 * utilisée et alerter quand on retombe sur localhost en prod).
 */
export function getPublicSiteUrlSource(
  req?: Request | null,
): { url: string; source: "env" | "vercel" | "request" | "dev" | "none" } {
  const env = fromEnv()
  if (env) return { url: env, source: "env" }
  const vercel = fromVercel()
  if (vercel) return { url: vercel, source: "vercel" }
  const reqUrl = fromRequest(req ?? null)
  if (reqUrl) return { url: reqUrl, source: "request" }
  const dev = devFallback()
  if (dev) return { url: dev, source: "dev" }
  return { url: "", source: "none" }
}

/** Résolution côté client (browser). */
export function getClientPublicSiteUrl(): string {
  const env = fromEnv()
  if (env) return env
  if (typeof window !== "undefined" && window.location?.origin) {
    const o = window.location.origin
    return isValidPublicSiteUrl(o) ? clean(o) : o
  }
  return devFallback() ?? ""
}
