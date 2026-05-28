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

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ ok: false, request: null, source: "disabled" })
  }

  try {
    const supabase = createServiceRoleClient()
    const { data: request, error } = await supabase
      .from("event_requests")
      .select(
        `
        *,
        package:event_packages(*),
        quotes:event_quotes(*),
        assignments:event_assignments(*)
      `,
      )
      .eq("id", id)
      .maybeSingle()

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    if (!request) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })

    const { data: prep } = await supabase
      .from("event_preparation_items")
      .select("*")
      .eq("request_id", id)
      .order("deadline", { ascending: true, nullsFirst: false })

    const { data: history } = await supabase
      .from("private_event_status_history")
      .select("*")
      .eq("request_id", id)
      .order("created_at", { ascending: false })
      .limit(80)

    const { data: reminders } = await supabase.from("event_reminder_log").select("*").eq("request_id", id).order(
      "sent_at",
      { ascending: false },
    )

    const rawQuotes = (request.quotes as unknown[]) ?? []
    const quotes = [...rawQuotes].sort((a: unknown, b: unknown) => {
      const ca = String((a as { created_at?: string }).created_at ?? "")
      const cb = String((b as { created_at?: string }).created_at ?? "")
      return cb.localeCompare(ca)
    }) as Record<string, unknown>[]

    const latest = quotes[0] as
      | {
          total?: number
          deposit_amount?: number
          deposit_paid?: boolean
          status?: string
        }
      | undefined

    const total = Number(latest?.total ?? request.estimated_budget ?? 0) || 0
    const depositAmount = Number(latest?.deposit_amount ?? 0) || 0
    const depositPaid = !!(latest?.deposit_paid ?? false)

    let balanceDue = Math.max(0, total - (depositPaid ? depositAmount : 0))

    return NextResponse.json({
      ok: true,
      source: "supabase",
      request: { ...request, quotes },
      enrichment: {
        latest_quote_total: total,
        deposit_amount: depositAmount,
        deposit_paid: depositPaid,
        balance_due: Number.isFinite(balanceDue) ? Math.round(balanceDue * 100) / 100 : 0,
      },
      preparation_items: prep ?? [],
      status_history: history ?? [],
      reminder_log: reminders ?? [],
    })
  } catch (e) {
    console.error("[admin/private-events/:id]", e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireRoles(STAFF_ROLES)
  if (!guard.ok) return guard.response
  const { id } = await params

  const body = await req.json().catch(() => ({}))

  const updates: Record<string, unknown> = {}
  if (body.status !== undefined) updates.status = body.status
  if (body.internalNotes !== undefined) updates.internal_notes = body.internalNotes
  if (body.assignedManagerId !== undefined) updates.assigned_manager_id = body.assignedManagerId
  if (body.eventDate) updates.event_date = body.eventDate
  if (body.eventTime !== undefined) updates.event_time = body.eventTime || null
  if (body.guestsCount) updates.guests_count = body.guestsCount
  if (body.estimatedBudget !== undefined) updates.estimated_budget = body.estimatedBudget
  if (body.packageId !== undefined) updates.package_id = body.packageId
  if (body.guestName !== undefined) updates.guest_name = body.guestName
  if (body.guestEmail !== undefined) updates.guest_email = body.guestEmail
  if (body.guestPhone !== undefined) updates.guest_phone = body.guestPhone
  if (body.specialRequests !== undefined) updates.special_requests = body.specialRequests

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ ok: false, message: "Supabase désactivé" }, { status: 503 })
  }

  try {
    const supabase = createServiceRoleClient()

    const { data: before } = await supabase.from("event_requests").select("status").eq("id", id).maybeSingle()
    const prevStatus = (before?.status as string) ?? ""

    const { data: updated, error } = await supabase
      .from("event_requests")
      .update(updates)
      .eq("id", id)
      .select("*")
      .maybeSingle()

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    if (!updated) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })

    if (updates.status !== undefined && String(updates.status) !== prevStatus) {
      await supabase.from("private_event_status_history").insert({
        request_id: id,
        actor_id: guard.user?.id ?? null,
        from_status: prevStatus,
        to_status: String(updates.status),
        note: typeof body.note === "string" ? body.note.slice(0, 2000) : null,
      })
    }

    return NextResponse.json({ ok: true, request: updated })
  } catch (e) {
    console.error("[admin/private-events/:id PATCH]", e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
