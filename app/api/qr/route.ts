import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { qrImageUrlForTable, publicTableUrl } from "@/lib/admin/restaurant-tables"
import { getPublicSiteUrlSource } from "@/lib/site/public-url"

type TableRow = {
  id: number
  table_number: number
  zone: string
  table_code?: string | null
  capacity?: number | null
  status?: string | null
  is_active?: boolean | null
}

function mockTables() {
  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    zone: i < 5 ? "interieur" : i < 10 ? "terrasse" : i < 15 ? "vip" : "evenement",
    table_code: `t${i + 1}`,
    capacity: i < 15 ? 4 : 6,
    status: "FREE",
    is_active: true,
  }))
}

export async function GET(request: Request) {
  const { url: SITE_URL, source: siteUrlSource } = getPublicSiteUrlSource(request)

  if (hasServerSupabaseEnv()) {
    try {
      const supabase = createServiceRoleClient()
      const { data, error } = await supabase
        .from("restaurant_tables")
        .select("id,table_number,zone,table_code,capacity,status,is_active")
        .eq("is_active", true)
        .order("table_number", { ascending: true })

      if (!error && data?.length) {
        const tables = (data as TableRow[]).map((t) => {
          const code = (t.table_code && String(t.table_code).trim()) || `t${t.id}`
          const url = publicTableUrl(SITE_URL, code)
          return {
            id: t.id,
            number: t.table_number,
            zone: t.zone,
            capacity: t.capacity ?? 4,
            status: t.status ?? "FREE",
            table_code: code,
            url,
            qrDataUrl: qrImageUrlForTable(SITE_URL, code, 200),
          }
        })
        return NextResponse.json({
          tables,
          source: "database",
          siteUrl: SITE_URL,
          siteUrlSource,
        })
      }
    } catch {
      /* fallback mock */
    }
  }

  const tables = mockTables().map((t) => {
    const url = publicTableUrl(SITE_URL, t.table_code)
    return {
      ...t,
      url,
      qrDataUrl: qrImageUrlForTable(SITE_URL, t.table_code, 200),
    }
  })
  return NextResponse.json({
    tables,
    source: "mock",
    siteUrl: SITE_URL,
    siteUrlSource,
  })
}
