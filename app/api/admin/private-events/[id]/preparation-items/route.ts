import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const STAFF_ROLES = ["ADMIN", "SERVER", "CASHIER", "KITCHEN", "BAR", "SHISHA"] as const

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireRoles(STAFF_ROLES)
  if (!guard.ok) return guard.response
  const { id } = await params
  if (!hasServerSupabaseEnv()) return NextResponse.json({ items: [] })
  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from("event_preparation_items")
      .select("*")
      .eq("request_id", id)
      .order("deadline", { ascending: true, nullsFirst: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requireRoles(STAFF_ROLES)
  if (!guard.ok) return guard.response
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const label = typeof body.label === "string" ? body.label.trim() : ""
  if (!label) return NextResponse.json({ error: "label requis" }, { status: 400 })
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase absent" }, { status: 503 })

  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from("event_preparation_items")
      .insert({
        request_id: id,
        label: label.slice(0, 280),
        quantity: body.quantity != null ? Number(body.quantity) : null,
        unit: body.unit != null ? String(body.unit).slice(0, 32) : null,
        assignee_id: body.assigneeId ?? null,
        deadline: body.deadline ?? null,
        notes: body.notes != null ? String(body.notes).slice(0, 2000) : null,
        status: body.status === "purchased" || body.status === "cancelled" ? body.status : "to_buy",
      })
      .select("*")
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ item: data }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
