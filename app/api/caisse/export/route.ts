import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

const ALLOW = ["ADMIN", "CASHIER"] as const

/** Export CSV — factures jour (pour Excel). */
export async function GET(request: Request) {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase requis" }, { status: 503 })

  const { searchParams } = new URL(request.url)
  const day = searchParams.get("date")?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  const start = `${day}T00:00:00`
  const endIso = `${day}T23:59:59.999Z`

  const supabase = createServiceRoleClient()
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select(
      "id,session_id,subtotal,tva_amount,total,status,payment_stage,payment_method,paid_at,cancel_reason,created_at",
    )
    .gte("created_at", start)
    .lte("created_at", endIso)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const header = [
    "id",
    "session_id",
    "subtotal",
    "tva_amount",
    "total",
    "status",
    "payment_stage",
    "payment_method",
    "paid_at",
    "cancel_reason",
    "created_at",
  ]

  const csvRows = [header.join(";")]
  for (const row of invoices ?? []) {
    const r = row as Record<string, unknown>
    csvRows.push(header.map((h) => csvEscape(String(r[h] ?? ""))).join(";"))
  }

  const csvWithBom = "\uFEFF" + csvRows.join("\r\n")

  return new NextResponse(csvWithBom, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="factures-caisse-${day}.csv"`,
    },
  })
}

function csvEscape(s: string) {
  if (s.includes(";") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}
