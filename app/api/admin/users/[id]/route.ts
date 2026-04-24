/**
 * PATCH  /api/admin/users/[id]  — met à jour rôle / infos / active
 * DELETE /api/admin/users/[id]  — supprime le compte
 */
import { NextResponse, type NextRequest } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { ASSIGNABLE_ROLES, normalizeRole, type AppRole } from "@/lib/auth/roles"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  let body: any = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 })
  }

  const admin = createServiceRoleClient()

  // Récupère l'utilisateur cible pour fusionner les métadonnées
  const { data: existing, error: getErr } = await admin.auth.admin.getUserById(id)
  if (getErr || !existing?.user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 })
  }

  const currentMeta = (existing.user.user_metadata as Record<string, any>) ?? {}
  const nextMeta: Record<string, any> = { ...currentMeta }

  if (typeof body.first_name === "string") nextMeta.first_name = body.first_name.trim()
  if (typeof body.last_name === "string") nextMeta.last_name = body.last_name.trim()
  if (typeof body.phone === "string") nextMeta.phone = body.phone.trim() || null

  if (body.role !== undefined) {
    const nextRole = normalizeRole(body.role)
    if (!ASSIGNABLE_ROLES.includes(nextRole as AppRole)) {
      return NextResponse.json({ error: "invalid_role" }, { status: 400 })
    }
    // Interdit de retirer le dernier admin
    if (currentMeta.role && normalizeRole(currentMeta.role) === "ADMIN" && nextRole !== "ADMIN") {
      const { data: all } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
      const adminsCount = (all?.users ?? []).filter(
        (u) => normalizeRole((u.user_metadata as any)?.role) === "ADMIN",
      ).length
      if (adminsCount <= 1) {
        return NextResponse.json(
          { error: "cannot_remove_last_admin" },
          { status: 400 },
        )
      }
    }
    nextMeta.role = nextRole
  }

  const updatePayload: any = { user_metadata: nextMeta }

  if (typeof body.password === "string" && body.password.length >= 8) {
    updatePayload.password = body.password
  }
  if (typeof body.email === "string" && body.email.includes("@")) {
    updatePayload.email = body.email.trim().toLowerCase()
  }

  // Activer / désactiver le compte (via banned_until)
  if (typeof body.is_active === "boolean") {
    // "none" réactive le compte ; "876000h" (~100 ans) = désactivation
    updatePayload.ban_duration = body.is_active ? "none" : "876000h"
  }

  const { data, error } = await admin.auth.admin.updateUserById(id, updatePayload)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ user: sanitize(data.user) })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  const admin = createServiceRoleClient()

  // Garde-fou : interdit de supprimer le dernier admin
  const { data: target } = await admin.auth.admin.getUserById(id)
  const targetRole = normalizeRole((target?.user?.user_metadata as any)?.role)
  if (targetRole === "ADMIN") {
    const { data: all } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
    const adminsCount = (all?.users ?? []).filter(
      (u) => normalizeRole((u.user_metadata as any)?.role) === "ADMIN",
    ).length
    if (adminsCount <= 1) {
      return NextResponse.json({ error: "cannot_delete_last_admin" }, { status: 400 })
    }
  }

  // Empêche la suppression de soi-même
  if (guard.user.id === id) {
    return NextResponse.json({ error: "cannot_delete_self" }, { status: 400 })
  }

  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

function sanitize(u: any) {
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
