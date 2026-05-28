import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import {
  TABLE_BUSINESS_ZONES,
  TABLE_PLAN_ZONES,
  TABLE_ADMIN_STATUSES,
} from "@/lib/admin/restaurant-tables"

const ALLOW = ["ADMIN", "SERVER"] as const

function normZone(z: string): string | null {
  const s = z.toLowerCase().trim()
  return (TABLE_BUSINESS_ZONES as readonly string[]).includes(s) ? s : null
}

function normPlanZone(z: string): string | null {
  const s = z.toLowerCase().trim()
  return (TABLE_PLAN_ZONES as readonly string[]).includes(s) ? s : null
}

function normStatus(z: string): string | null {
  const s = z.trim().toUpperCase()
  return (TABLE_ADMIN_STATUSES as readonly string[]).includes(s) ? s : null
}

function slugCode(raw: string, tableNumber: number): string {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 40)
  if (s.length >= 2) return s
  return `t${tableNumber}`
}

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, ctx: Ctx) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const id = Number((await ctx.params).id)
  if (!Number.isFinite(id)) return NextResponse.json({ error: "id invalide" }, { status: 400 })

  const body = await request.json().catch(() => ({}))
  const patch: Record<string, unknown> = {}

  if (typeof body.display_name === "string") {
    patch.display_name = body.display_name.trim() ? body.display_name.trim().slice(0, 120) : null
  }

  if (typeof body.zone === "string") {
    const z = normZone(body.zone)
    if (!z) return NextResponse.json({ error: "zone invalide" }, { status: 400 })
    patch.zone = z
  }

  if (typeof body.plan_zone === "string") {
    const p = normPlanZone(body.plan_zone)
    if (!p) return NextResponse.json({ error: "plan_zone invalide" }, { status: 400 })
    patch.plan_zone = p
  }

  if (body.capacity != null) {
    const capacity = Number(body.capacity)
    if (!Number.isFinite(capacity) || capacity < 1) {
      return NextResponse.json({ error: "capacity invalide" }, { status: 400 })
    }
    patch.capacity = Math.min(99, Math.floor(capacity))
  }

  if (body.table_number != null) {
    const tableNumber = Number(body.table_number)
    if (!Number.isFinite(tableNumber) || tableNumber < 1) {
      return NextResponse.json({ error: "table_number invalide" }, { status: 400 })
    }
    patch.table_number = tableNumber
  }

  if (typeof body.table_code === "string") {
    const { data: row } = await createServiceRoleClient()
      .from("restaurant_tables")
      .select("table_number")
      .eq("id", id)
      .maybeSingle()
    const tn = Number((row as { table_number?: number } | null)?.table_number ?? 0)
    patch.table_code = slugCode(body.table_code, Number.isFinite(tn) ? tn : id)
  }

  if (body.position_x != null) {
    const n = Number(body.position_x)
    if (Number.isFinite(n)) patch.position_x = n
  }
  if (body.position_y != null) {
    const n = Number(body.position_y)
    if (Number.isFinite(n)) patch.position_y = n
  }

  if (typeof body.status === "string") {
    const st = normStatus(body.status)
    if (!st) return NextResponse.json({ error: "status invalide" }, { status: 400 })
    patch.status = st
  }

  if (typeof body.is_active === "boolean") {
    const supa = createServiceRoleClient()
    if (body.is_active === false) {
      const { data: cur } = await supa.from("restaurant_tables").select("current_session_id").eq("id", id).maybeSingle()
      if ((cur as { current_session_id?: string | null } | null)?.current_session_id) {
        return NextResponse.json(
          { error: "Session ouverte sur cette table : fermez ou transférez avant désactivation." },
          { status: 409 },
        )
      }
      patch.current_session_id = null
      patch.status = "FREE"
    }
    patch.is_active = body.is_active
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 })
  }

  patch.updated_at = new Date().toISOString()

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.from("restaurant_tables").update(patch).eq("id", id).select("*").maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ error: "Table introuvable" }, { status: 404 })

  return NextResponse.json({ ok: true, table: data })
}

/** Désactivation douce par défaut (DELETE dur = risque FK). */
export async function DELETE(_request: Request, ctx: Ctx) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const id = Number((await ctx.params).id)
  if (!Number.isFinite(id)) return NextResponse.json({ error: "id invalide" }, { status: 400 })

  const supabase = createServiceRoleClient()
  const { data: cur } = await supabase.from("restaurant_tables").select("current_session_id").eq("id", id).maybeSingle()
  if ((cur as { current_session_id?: string | null } | null)?.current_session_id) {
    return NextResponse.json(
      { error: "Session ouverte : fermez ou transférez avant de désactiver la table." },
      { status: 409 },
    )
  }

  const { data, error } = await supabase
    .from("restaurant_tables")
    .update({
      is_active: false,
      status: "FREE",
      current_session_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "Table introuvable" }, { status: 404 })

  return NextResponse.json({ ok: true, table: data, message: "Table désactivée (soft delete)" })
}
