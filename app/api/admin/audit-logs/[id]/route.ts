/**
 * GET /api/admin/audit-logs/:id — détail une entrée (JSON sanitisé + diff), admin only.
 */
import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { sanitizeDetailPayload } from "@/lib/audit/audit-display"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const rawId = (await ctx.params).id
  const id = Number.parseInt(rawId, 10)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "id invalide" }, { status: 400 })
  }

  const admin = createServiceRoleClient()
  const { data, error } = await admin.from("audit_logs").select("*").eq("id", id).maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  return NextResponse.json({ detail: sanitizeDetailPayload(data as Record<string, unknown>) })
}
