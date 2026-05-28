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

/** Liste complète des tables (admin). */
export async function GET() {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ tables: [], disabled: true })

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from("restaurant_tables")
    .select(
      "id,table_number,display_name,table_code,zone,plan_zone,capacity,status,qr_token,current_session_id,last_activity,position_x,position_y,is_active,created_at,updated_at",
    )
    .order("table_number", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tables: data ?? [] })
}

/** Créer une table (ID = max+1). */
export async function POST(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const tableNumber = Number(body.table_number)
  if (!Number.isFinite(tableNumber) || tableNumber < 1) {
    return NextResponse.json({ error: "table_number invalide" }, { status: 400 })
  }

  const zone = typeof body.zone === "string" ? normZone(body.zone) : null
  if (!zone) {
    return NextResponse.json({ error: "zone invalide (salle|terrasse|interieur|vip|evenement)" }, { status: 400 })
  }

  const capacity = Number(body.capacity)
  const cap = Number.isFinite(capacity) && capacity > 0 ? Math.min(99, Math.floor(capacity)) : 4

  const planZone =
    typeof body.plan_zone === "string" && normPlanZone(body.plan_zone)
      ? normPlanZone(body.plan_zone)!
      : zone === "terrasse"
        ? "terrasse"
        : zone === "interieur" || zone === "evenement"
          ? "interieur"
          : "salle"

  const displayName =
    typeof body.display_name === "string" && body.display_name.trim() ? body.display_name.trim().slice(0, 120) : null

  const posX = Number(body.position_x)
  const posY = Number(body.position_y)
  const position_x = Number.isFinite(posX) ? posX : 0
  const position_y = Number.isFinite(posY) ? posY : 0

  const requestedCode = typeof body.table_code === "string" ? body.table_code : ""
  const table_code = slugCode(requestedCode || `t${tableNumber}`, tableNumber)

  const status =
    typeof body.status === "string" && normStatus(body.status) ? normStatus(body.status)! : "FREE"

  const supabase = createServiceRoleClient()

  const { data: maxRow } = await supabase
    .from("restaurant_tables")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextId = (maxRow?.id != null ? Number(maxRow.id) : 0) + 1

  const { data: inserted, error } = await supabase
    .from("restaurant_tables")
    .insert({
      id: nextId,
      table_number: tableNumber,
      display_name: displayName,
      table_code,
      zone,
      plan_zone: planZone,
      capacity: cap,
      status,
      position_x,
      position_y,
      is_active: body.is_active === false ? false : true,
    })
    .select("*")
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, table: inserted })
}
