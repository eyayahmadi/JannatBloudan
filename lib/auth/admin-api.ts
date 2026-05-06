/**
 * Helpers serveur pour les API `/api/admin/*`.
 * - Vérifie que l'appelant est authentifié et a le rôle ADMIN.
 * - Expose un client Supabase avec la service role key (admin.*).
 *
 * NE JAMAIS importer ce fichier dans du code client ou composant React
 * rendu côté client : il lit `SUPABASE_SERVICE_ROLE_KEY`.
 */
import { createClient as createAdminSupabaseClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getBrowserSupabaseEnv, getServerSupabaseEnv } from "@/lib/supabase/config"
import { normalizeRole, type AppRole } from "@/lib/auth/roles"

/**
 * Client Supabase avec service_role (opérations admin.*).
 * ⚠ Jamais côté client.
 */
export function createServiceRoleClient() {
  const env = getServerSupabaseEnv()
  if (!env) {
    throw new Error(
      "Missing Supabase service role env (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    )
  }
  return createAdminSupabaseClient(env.url, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Récupère la session courante (depuis les cookies) et retourne l'utilisateur.
 * On utilise la anon key ici — on ne veut pas élever les privilèges involontairement.
 */
export async function getCurrentSessionUser() {
  const browser = getBrowserSupabaseEnv()
  if (!browser) return null
  const cookieStore = await cookies()
  const supabase = createServerClient(browser.url, browser.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {
        /* read-only */
      },
    },
  })
  const { data } = await supabase.auth.getSession()
  return data.session?.user ?? null
}

/**
 * Garde : n'autorise que les admins. Retourne soit l'utilisateur, soit une
 * NextResponse d'erreur à renvoyer directement depuis la route.
 */
type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentSessionUser>>>

export async function requireAdmin(): Promise<
  { ok: true; user: SessionUser } | { ok: false; response: NextResponse }
> {
  const user = await getCurrentSessionUser()
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "unauthenticated" }, { status: 401 }),
    }
  }
  const role = normalizeRole((user.user_metadata as { role?: unknown })?.role)
  if (role !== "ADMIN") {
    return {
      ok: false,
      response: NextResponse.json({ error: "forbidden" }, { status: 403 }),
    }
  }
  return { ok: true, user }
}

/**
 * Garde : utilisateur auth avec un rôle dans `allowed`.
 * Utile pour caisse (CASHIER) ou autres routes staff hors ADMIN seul.
 */
export async function requireRoles(
  allowed: readonly AppRole[],
): Promise<
  { ok: true; user: SessionUser; role: AppRole } | { ok: false; response: NextResponse }
> {
  const user = await getCurrentSessionUser()
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "unauthenticated" }, { status: 401 }),
    }
  }
  const role = normalizeRole((user.user_metadata as { role?: unknown })?.role)
  if (!(allowed as readonly string[]).includes(role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "forbidden" }, { status: 403 }),
    }
  }
  return { ok: true, user, role }
}
