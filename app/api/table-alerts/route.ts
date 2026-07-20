import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { ensureStaffUserIdFromCtx, staffPaymentCtxFromAuth } from "@/lib/caisse/resolve-staff-user-id"
import {
  alertTypeToRequestType,
  deriveServiceRequestStatus,
  type ServiceRequestType,
} from "@/lib/table/service-requests"

export type TableAlertType = "call_server" | "request_bill" | "help" | "payment_done" | "call_cashier"

export type TableAlertRow = {
  id: string
  tableId: string
  type: TableAlertType
  message: string
  createdAt: string
  resolvedAt: string | null
  acknowledgedAt: string | null
  acknowledgedBy: string | null
  orderId: string | null
  sessionId: string | null
  requestType: ServiceRequestType | null
  status: "PENDING" | "ACKNOWLEDGED" | "RESOLVED"
}

const STAFF_ROLES = ["ADMIN", "SERVER", "CASHIER"] as const

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function mapRow(row: Record<string, unknown>): TableAlertRow {
  const alertType = (row.alert_type ?? row.type) as TableAlertType
  const resolvedAt = (row.resolved_at as string | null) ?? null
  const acknowledgedAt = (row.acknowledged_at as string | null) ?? null
  return {
    id: String(row.id),
    tableId: String(row.table_id),
    type: alertType,
    message: String(row.message ?? ""),
    createdAt: String(row.created_at),
    resolvedAt,
    acknowledgedAt,
    acknowledgedBy: row.acknowledged_by ? String(row.acknowledged_by) : null,
    orderId: row.order_id ? String(row.order_id) : null,
    sessionId: row.session_id ? String(row.session_id) : null,
    requestType: alertTypeToRequestType(alertType),
    status: deriveServiceRequestStatus({
      resolved_at: resolvedAt,
      acknowledged_at: acknowledgedAt,
    }),
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const activeOnly = searchParams.get("active") === "true"

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ alerts: [], source: "mock" })
  }

  try {
    const supabase = await createClient()
    let query = supabase
      .from("table_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)

    if (activeOnly) query = query.is("resolved_at", null)

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ alerts: [], error: error.message })
    }
    return NextResponse.json({
      alerts: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)),
      source: "supabase",
    })
  } catch (err) {
    console.error("[table-alerts] GET exception", err)
    return NextResponse.json({ alerts: [], source: "mock-fallback" })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const tableId = Number(body.tableId)
    const type: TableAlertType = body.type
    const message: string = body.message ?? ""
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : null
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : null

    if (!tableId || !type) {
      return NextResponse.json({ error: "tableId et type requis" }, { status: 400 })
    }

    const row: TableAlertRow = {
      id: genId(),
      tableId: String(tableId),
      type,
      message,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      acknowledgedAt: null,
      acknowledgedBy: null,
      orderId,
      sessionId,
      requestType: alertTypeToRequestType(type),
      status: "PENDING",
    }

    if (!hasServerSupabaseEnv()) {
      return NextResponse.json({ alert: row, source: "mock" }, { status: 201 })
    }

    const supabase = await createClient()
    const insertRow: Record<string, unknown> = {
      table_id: tableId,
      type,
      message: message || null,
    }
    if (orderId) insertRow.order_id = orderId
    if (sessionId) insertRow.session_id = sessionId

    let { data, error } = await supabase.from("table_alerts").insert(insertRow).select("*").single()

    if (error) {
      console.error("[table-alerts] insert error (anon)", error)
      const admin = createServiceRoleClient()
      const retry = await admin.from("table_alerts").insert(insertRow).select("*").single()
      data = retry.data
      error = retry.error
      if (error) console.error("[table-alerts] insert error (service role)", error)
    }

    if (error || !data) {
      console.error("[table-alerts] insert error", error)
      return NextResponse.json(
        { alert: row, source: "mock-fallback", warning: error?.message },
        { status: 201 },
      )
    }

    return NextResponse.json(
      { alert: mapRow(data as Record<string, unknown>), source: "supabase" },
      { status: 201 },
    )
  } catch (err) {
    console.error("[table-alerts] POST exception", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const id: string | undefined = typeof body.id === "string" ? body.id.trim() : undefined
    const tableId: string | number | undefined = body.tableId
    const type: TableAlertType | undefined = body.type
    const action: "acknowledge" | "resolve" =
      body.action === "acknowledge" ? "acknowledge" : "resolve"

    if (!hasServerSupabaseEnv()) {
      return NextResponse.json({ success: true, source: "mock" })
    }

    const now = new Date().toISOString()
    let staffUserId: string | null = null

    if (action === "acknowledge") {
      const guard = await requireRoles(STAFF_ROLES)
      if (!guard.ok) return guard.response

      const supabaseAdmin = createServiceRoleClient()
      staffUserId = await ensureStaffUserIdFromCtx(
        supabaseAdmin,
        staffPaymentCtxFromAuth(guard.user, guard.role),
      )

      if (id) {
        const { data: alertRow } = await supabaseAdmin
          .from("table_alerts")
          .select("type")
          .eq("id", id)
          .maybeSingle()

        const reqType = alertTypeToRequestType(
          String((alertRow as { type?: string } | null)?.type ?? "") as TableAlertType,
        )
        const role = guard.role
        const can =
          role === "ADMIN" ||
          (reqType === "WAITER" && role === "SERVER") ||
          (reqType === "BILL" && (role === "SERVER" || role === "CASHIER"))

        if (!can) {
          return NextResponse.json({ error: "forbidden" }, { status: 403 })
        }
      }

      const supabase = createServiceRoleClient()
      const patch = {
        acknowledged_at: now,
        acknowledged_by: staffUserId,
        resolved_at: now,
        resolved_by: staffUserId,
      }

      if (id) {
        const { error } = await supabase.from("table_alerts").update(patch).eq("id", id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      } else if (tableId) {
        let q = supabase
          .from("table_alerts")
          .update(patch)
          .eq("table_id", Number(tableId))
          .is("resolved_at", null)
        if (type) q = q.eq("type", type)
        const { error } = await q
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      } else {
        return NextResponse.json({ error: "id ou tableId requis" }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        source: "supabase",
        acknowledgedAt: now,
        resolvedAt: now,
      })
    }

    const supabase = await createClient()
    if (id) {
      const { error } = await supabase
        .from("table_alerts")
        .update({ resolved_at: now })
        .eq("id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else if (tableId) {
      let q = supabase
        .from("table_alerts")
        .update({ resolved_at: now })
        .eq("table_id", Number(tableId))
        .is("resolved_at", null)
      if (type) q = q.eq("type", type)
      const { error } = await q
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, source: "supabase", resolvedAt: now })
  } catch (err) {
    console.error("[table-alerts] PATCH exception", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
