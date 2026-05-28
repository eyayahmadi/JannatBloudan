const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/** Valeurs d'exemple du .env.example — refusées en production runtime */
function looksLikePlaceholderUrl(url: string | undefined): boolean {
  if (!url?.trim()) return true
  const u = url.trim()
  if (/your-project-ref|xxxxx|example\.com|placeholder/i.test(u)) return true
  try {
    const parsed = new URL(u)
    return parsed.hostname === "your-project-ref.supabase.co"
  } catch {
    return true
  }
}

function looksLikePlaceholderJwt(key: string | undefined): boolean {
  if (!key?.trim()) return true
  const k = key.trim()
  if (/your-anon|your-service|xxxxx|placeholder/i.test(k)) return true
  // JWT historique Supabase (anon / service_role)
  if (k.startsWith("eyJ") && k.length >= 80) return false
  // Nouveaux préfixes tableau Supabase (2025+) — compat dashboard « nouvelles clés »
  if (k.startsWith("sb_publishable_") && k.length >= 24) return false
  if (k.startsWith("sb_secret_") && k.length >= 24) return false
  return true
}

/**
 * Vérifie que l'URL et la clé anon ne sont plus les placeholders du .env.example
 * et que les clés ressemblent aux JWT legacy (eyJ…) ou aux clés tableau (sb_publishable_ / sb_secret_).
 */
export function hasBrowserSupabaseEnv() {
  if (!supabaseUrl || !supabaseAnonKey) return false
  if (looksLikePlaceholderUrl(supabaseUrl)) return false
  if (looksLikePlaceholderJwt(supabaseAnonKey)) return false
  return true
}

export function hasServerSupabaseEnv() {
  if (!supabaseUrl || !supabaseServiceRoleKey) return false
  if (looksLikePlaceholderUrl(supabaseUrl)) return false
  if (looksLikePlaceholderJwt(supabaseServiceRoleKey)) return false
  return true
}

/** Message affiché si l’environnement Supabase n’est pas prêt côté navigateur. */
export function getSupabaseBrowserSetupMessage(): string {
  return "Supabase n’est pas configuré : dans le fichier .env.local (à la racine du projet Next, dossier pfe-main), remplacez NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY par les valeurs de votre projet (Supabase → Paramètres → API), puis redémarrez « npm run dev »."
}

export function getBrowserSupabaseEnv() {
  if (!hasBrowserSupabaseEnv()) {
    return null
  }

  return {
    url: supabaseUrl as string,
    anonKey: supabaseAnonKey as string,
  }
}

/**
 * Origine pour `emailRedirectTo` (liens « confirmer l’e-mail »).
 * En dev sur localhost, si `NEXT_PUBLIC_SITE_URL` pointe vers votre URL publique (sans placeholder),
 * on l’utilise : les liens dans les e-mails matchent alors les « Redirect URLs » du dashboard Supabase.
 * Sinon : origine du navigateur (pensez à ajouter `http://localhost:3000/auth/confirm` dans Supabase).
 */
export function getAuthRedirectOrigin(): string {
  const raw = typeof process.env.NEXT_PUBLIC_SITE_URL === "string" ? process.env.NEXT_PUBLIC_SITE_URL : ""
  const site = raw.trim().replace(/\/$/, "")
  const siteOk = site.length > 0 && !looksLikePlaceholderUrl(site)

  if (typeof window !== "undefined") {
    const o = window.location.origin
    const isLocal =
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(o) || /^https?:\/\/0\.0\.0\.0(:\d+)?$/i.test(o)
    if (siteOk && isLocal) return site
    return o || (siteOk ? site : "")
  }
  return siteOk ? site : ""
}

export function getServerSupabaseEnv() {
  if (!hasServerSupabaseEnv()) {
    return null
  }

  return {
    url: supabaseUrl as string,
    serviceRoleKey: supabaseServiceRoleKey as string,
  }
}
