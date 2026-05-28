import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const STAFF_ROLES = ["ADMIN", "SERVER", "CASHIER", "KITCHEN", "BAR", "SHISHA"] as const

type Params = { params: Promise<{ id: string; itemId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireRoles(STAFF_ROLES)
  if (!guard.ok) return guard.response
  const { id, itemId } = await params
  const body = await req.json().catch(() => ({}))

  const updates: Record<string, unknown> = {}
  if (body.label !== undefined) updates.label = String(body.label).slice(0, 280)
  if (body.quantity !== undefined) updates.quantity = body.quantity === null ? null : Number(body.quantity)
  if (body.unit !== undefined) updates.unit = body.unit === null ? null : String(body.unit).slice(0, 32)
  if (body.assigneeId !== undefined) updates.assignee_id = body.assigneeId
  if (body.deadline !== undefined) updates.deadline = body.deadline
  if (body.notes !== undefined) updates.notes = body.notes
  if (body.status !== undefined) {
    const s = String(body.status)
    if (["to_buy", "purchased", "cancelled"].includes(s)) updates.status = s
  }

  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase absent" }, { status: 503 })

  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from("event_preparation_items")
      .update(updates)
      .eq("id", itemId)
      .eq("request_id", id)
      .select("*")
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: "Non trouvé" }, { status: 404 })
    return NextResponse.json({ item: data })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireRoles(STAFF_ROLES)
  if (!guard.ok) return guard.response
  const { id, itemId } = await params
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase absent" }, { status: 503 })

  try {
    const supabase = createServiceRoleClient()
    const { error } = await supabase
      .from("event_preparation_items")
      .delete()
      .eq("id", itemId)
      .eq("request_id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
