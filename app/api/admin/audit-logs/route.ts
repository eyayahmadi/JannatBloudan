/**
 * GET /api/admin/audit-logs — journal (lignes allégées sans JSON brut, résumé calculé).
 */
import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { toAuditListRow } from "@/lib/audit/audit-display"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Chaîne courte pour filtres ILIKE (sans %) */
function searchInner(s: string) {
  return s.trim().replace(/[^\p{L}\p{N}@._+\- ]/gu, "").slice(0, 80)
}

function isUuidLike(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.trim())
}

function endOfDayUtc(isoDate: string): string {
  const d = new Date(`${isoDate.trim()}T23:59:59.999Z`)
  return Number.isFinite(d.getTime()) ? d.toISOString() : `${isoDate.trim()}T23:59:59.999Z`
}

function startOfDayUtc(isoDate: string): string {
  const d = new Date(`${isoDate.trim()}T00:00:00.000Z`)
  return Number.isFinite(d.getTime()) ? d.toISOString() : `${isoDate.trim()}T00:00:00.000Z`
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1)
  const pageSizeRaw = Number.parseInt(searchParams.get("pageSize") ?? "50", 10) || 50
  const pageSize = Math.min(100, Math.max(10, pageSizeRaw))

  const action = searchParams.get("action")?.trim() || null
  const entityType = searchParams.get("entity_type")?.trim() || null
  const entityId = searchParams.get("entity_id")?.trim() || null
  const userQ = searchParams.get("user")?.trim() || null
  const dateFrom = searchParams.get("date_from")?.trim() || null
  const dateTo = searchParams.get("date_to")?.trim() || null
  const qRaw = searchParams.get("q")?.trim() || null

  const admin = createServiceRoleClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let qb = admin.from("audit_logs").select("*", { count: "exact" }).order("created_at", { ascending: false })

  if (action) qb = qb.eq("action", action)
  if (entityType) qb = qb.eq("entity_type", entityType)
  if (entityId) qb = qb.eq("entity_id", entityId)

  if (userQ) {
    if (isUuidLike(userQ)) qb = qb.eq("user_id", userQ.trim())
    else {
      const inner = searchInner(userQ)
      if (inner.length >= 2) qb = qb.ilike("user_email", `%${inner}%`)
    }
  }

  if (dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
    qb = qb.gte("created_at", startOfDayUtc(dateFrom))
  }
  if (dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
    qb = qb.lte("created_at", endOfDayUtc(dateTo))
  }

  /** Recherche large : selon la forme (email, UUID, sinon entité + action comme OR via deux filtres successifs Impossible — une seule heuristique par requête) */
  if (qRaw) {
    const inner = searchInner(qRaw)
    if (inner.length >= 2) {
      if (inner.includes("@")) qb = qb.ilike("user_email", `%${inner}%`)
      else if (isUuidLike(inner)) qb = qb.eq("entity_id", inner)
      else {
        qb = qb.ilike("entity_type", `%${inner}%`)
      }
    }
  }

  const { data, error, count } = await qb.range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows: ReturnType<typeof toAuditListRow>[] = []
  for (const raw of data ?? []) {
    const r = toAuditListRow(raw as Record<string, unknown>)
    if (r) rows.push(r)
  }

  return NextResponse.json({
    rows,
    total: count ?? 0,
    page,
    pageSize,
  })
}
