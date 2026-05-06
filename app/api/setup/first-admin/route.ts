/**
 * Création ponctuelle du premier compte ADMIN (serveur uniquement, clé service_role).
 * À activer explicitement en local / premier déploiement, puis désactiver.
 *
 * Prérequis (.env.local):
 *   ALLOW_SETUP_ADMIN=1
 *   FIRST_ADMIN_SETUP_SECRET=une_chaine_longue_secrete
 *
 * POST JSON: { "email", "password", "secret", "firstName?", "lastName?" }
 */
import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { normalizeRole } from "@/lib/auth/roles"

function safeEqualStr(a: string, b: string): boolean {
  try {
    const x = Buffer.from(a, "utf8")
    const y = Buffer.from(b, "utf8")
    if (x.length !== y.length) return false
    return timingSafeEqual(x, y)
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  if (process.env.ALLOW_SETUP_ADMIN !== "1") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const expected = process.env.FIRST_ADMIN_SETUP_SECRET?.trim() ?? ""
  if (expected.length < 16) {
    return NextResponse.json(
      {
        error:
          "FIRST_ADMIN_SETUP_SECRET manquant ou trop court (min. 16 caracteres) dans .env.local",
        code: "MISSING_SECRET",
      },
      { status: 503 },
    )
  }

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase serveur non configure (SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 503 },
    )
  }

  let body: {
    email?: string
    password?: string
    secret?: string
    firstName?: string
    lastName?: string
  }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 })
  }

  const secret = typeof body.secret === "string" ? body.secret : ""
  if (!safeEqualStr(secret, expected)) {
    return NextResponse.json({ error: "Secret incorrect" }, { status: 403 })
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body.password === "string" ? body.password : ""
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Mot de passe : au moins 8 caracteres" },
      { status: 400 },
    )
  }

  const firstName = typeof body.firstName === "string" && body.firstName.trim()
    ? body.firstName.trim()
    : "Admin"
  const lastName = typeof body.lastName === "string" && body.lastName.trim()
    ? body.lastName.trim()
    : "Restaurant"

  const supabase = createServiceRoleClient()

  try {
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 500,
    })
    if (listErr) {
      console.error("[setup/first-admin] listUsers", listErr.message)
      return NextResponse.json(
        { error: "Impossible de verifier les utilisateurs existants" },
        { status: 502 },
      )
    }

    const hasAdmin = list.users.some(
      (u) => normalizeRole((u.user_metadata as { role?: string })?.role) === "ADMIN",
    )
    if (hasAdmin) {
      return NextResponse.json(
        {
          error:
            "Un utilisateur ADMIN existe deja : utilisez le dashboard Supabase (User metadata → role ADMIN) ou /api/admin/users connecte.",
          code: "ADMIN_EXISTS",
        },
        { status: 409 },
      )
    }
  } catch (e) {
    console.error("[setup/first-admin]", e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      role: "ADMIN",
    },
  })

  if (error) {
    return NextResponse.json(
      { error: error.message || "Creation echouee", code: error.name },
      { status: 400 },
    )
  }

  return NextResponse.json({
    ok: true,
    email: data.user?.email ?? email,
    message:
      "Compte ADMIN cree. Connectez-vous sur /login puis allez sur /admin. Desactivez ALLOW_SETUP_ADMIN en production.",
  })
}
