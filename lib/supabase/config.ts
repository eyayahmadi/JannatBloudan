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
  // Clés API Supabase (anon / service_role) = JWT
  if (!k.startsWith("eyJ")) return true
  return k.length < 80
}

/**
 * Vérifie que l'URL et la clé anon ne sont plus les placeholders du .env.example
 * et que la clé ressemble à un JWT Supabase.
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

export function getServerSupabaseEnv() {
  if (!hasServerSupabaseEnv()) {
    return null
  }

  return {
    url: supabaseUrl as string,
    serviceRoleKey: supabaseServiceRoleKey as string,
  }
}
