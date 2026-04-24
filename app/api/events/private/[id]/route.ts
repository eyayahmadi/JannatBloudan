import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ request: null, source: "mock" })
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("event_requests")
      .select("*, package:event_packages(*), quotes:event_quotes(*), assignments:event_assignments(*)")
      .eq("id", id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 })

    return NextResponse.json({ request: data, source: "supabase" })
  } catch (err) {
    console.error("[events/private/:id] GET exception", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const updates: Record<string, unknown> = {}
  if (body.status) updates.status = body.status
  if (body.internalNotes !== undefined) updates.internal_notes = body.internalNotes
  if (body.assignedManagerId !== undefined) updates.assigned_manager_id = body.assignedManagerId
  if (body.eventDate) updates.event_date = body.eventDate
  if (body.eventTime) updates.event_time = body.eventTime
  if (body.guestsCount) updates.guests_count = body.guestsCount
  if (body.estimatedBudget !== undefined) updates.estimated_budget = body.estimatedBudget
  if (body.packageId !== undefined) updates.package_id = body.packageId
  if (body.customMenu !== undefined) updates.custom_menu = body.customMenu
  if (body.options !== undefined) updates.options = body.options
  if (body.specialRequests !== undefined) updates.special_requests = body.specialRequests

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({
      request: { id, ...updates, updated_at: new Date().toISOString() },
      source: "mock",
    })
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("event_requests")
      .update(updates)
      .eq("id", id)
      .select("*")
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 })
    return NextResponse.json({ request: data, source: "supabase" })
  } catch (err) {
    console.error("[events/private/:id] PATCH exception", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
