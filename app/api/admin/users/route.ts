/**
 * GET  /api/admin/users        — liste tous les utilisateurs (admin only)
 * POST /api/admin/users        — crée un compte staff (admin only)
 *
 * Seul un ADMIN connecté peut appeler ces endpoints.
 * Un CLIENT ne peut JAMAIS créer un compte avec un rôle interne via l'API.
 */
import { NextResponse, type NextRequest } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { ASSIGNABLE_ROLES, normalizeRole, type AppRole } from "@/lib/auth/roles"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function sanitizeUser(u: any) {
  const meta = (u?.user_metadata as Record<string, any>) ?? {}
  return {
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    banned_until: u.banned_until ?? null,
    phone: meta.phone ?? u.phone ?? null,
    first_name: meta.first_name ?? "",
    last_name: meta.last_name ?? "",
    role: normalizeRole(meta.role),
    is_active: !u.banned_until || new Date(u.banned_until) < new Date(),
  }
}

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const admin = createServiceRoleClient()
  const all: any[] = []
  let page = 1
  const perPage = 200
  // Pagine jusqu'à récupérer tout (safe pour <~2000 users)
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    const users = data.users ?? []
    all.push(...users)
    if (users.length < perPage) break
    page += 1
  }

  const sorted = all
    .map(sanitizeUser)
    .sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""))

  return NextResponse.json({ users: sorted })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 })
  }

  const email = String(body.email ?? "").trim().toLowerCase()
  const password = String(body.password ?? "")
  const first_name = String(body.first_name ?? "").trim()
  const last_name = String(body.last_name ?? "").trim()
  const phone = String(body.phone ?? "").trim() || undefined
  const roleRaw = String(body.role ?? "CLIENT")
  const role = normalizeRole(roleRaw)

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 })
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "password_too_short (>=8)" }, { status: 400 })
  }
  if (!ASSIGNABLE_ROLES.includes(role as AppRole)) {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 })
  }

  const admin = createServiceRoleClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, first_name, last_name, phone },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ user: sanitizeUser(data.user) }, { status: 201 })
}
