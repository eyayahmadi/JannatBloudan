import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

export type TableAlertType = "call_server" | "request_bill" | "help" | "payment_done"

export type TableAlertRow = {
  id: string
  tableId: string
  type: TableAlertType
  message: string
  createdAt: string
  resolvedAt: string | null
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function mapRow(row: any): TableAlertRow {
  return {
    id: String(row.id),
    tableId: String(row.table_id),
    type: row.alert_type,
    message: row.message ?? "",
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
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
      alerts: (data ?? []).map(mapRow),
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
    }

    if (!hasServerSupabaseEnv()) {
      return NextResponse.json({ alert: row, source: "mock" }, { status: 201 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("table_alerts")
      .insert({
        table_id: tableId,
        alert_type: type,
        message,
        status: "pending",
      })
      .select("*")
      .single()

    if (error || !data) {
      console.error("[table-alerts] insert error", error)
      return NextResponse.json(
        { alert: row, source: "mock-fallback", warning: error?.message },
        { status: 201 },
      )
    }

    return NextResponse.json({ alert: mapRow(data), source: "supabase" }, { status: 201 })
  } catch (err) {
    console.error("[table-alerts] POST exception", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const id: string | undefined = body.id
    const tableId: string | number | undefined = body.tableId
    const type: TableAlertType | undefined = body.type

    if (!hasServerSupabaseEnv()) {
      return NextResponse.json({ success: true, source: "mock" })
    }

    const supabase = await createClient()
    const resolvedAt = new Date().toISOString()

    if (id) {
      const { error } = await supabase
        .from("table_alerts")
        .update({ resolved_at: resolvedAt, status: "resolved" })
        .eq("id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else if (tableId) {
      let q = supabase
        .from("table_alerts")
        .update({ resolved_at: resolvedAt, status: "resolved" })
        .eq("table_id", Number(tableId))
        .is("resolved_at", null)
      if (type) q = q.eq("alert_type", type)
      const { error } = await q
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, source: "supabase", resolvedAt })
  } catch (err) {
    console.error("[table-alerts] PATCH exception", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
