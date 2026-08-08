import { NextResponse, type NextRequest } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import {
  MENU_HOMEPAGE_SECTION_DEFS,
  type MenuHomepageSectionKey,
} from "@/lib/menu/menu-homepage-sections"
import { invalidateMenuCache } from "@/lib/menu/menu-catalog-service"

export const dynamic = "force-dynamic"

const VALID_KEYS = new Set<string>(MENU_HOMEPAGE_SECTION_DEFS.map((d) => d.key))

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const supabase = createServiceRoleClient()
  const [sectionsRes, productsRes] = await Promise.all([
    supabase
      .from("menu_homepage_sections")
      .select("id, section_key, product_id, display_order, is_active")
      .order("section_key")
      .order("display_order"),
    supabase
      .from("products")
      .select("id, name, name_ar, image_url, is_available, is_archived, categories ( name, slug )")
      .eq("is_archived", false)
      .order("name"),
  ])

  if (sectionsRes.error?.code !== "42P01" && sectionsRes.error) {
    return NextResponse.json({ error: sectionsRes.error.message }, { status: 500 })
  }
  if (productsRes.error) {
    return NextResponse.json({ error: productsRes.error.message }, { status: 500 })
  }

  const byKey: Record<string, string[]> = {}
  for (const def of MENU_HOMEPAGE_SECTION_DEFS) {
    byKey[def.key] = []
  }
  for (const row of sectionsRes.data ?? []) {
    const key = String(row.section_key)
    if (!byKey[key]) byKey[key] = []
    byKey[key].push(String(row.product_id))
  }

  return NextResponse.json({
    section_defs: MENU_HOMEPAGE_SECTION_DEFS,
    sections: byKey,
    rows: sectionsRes.data ?? [],
    products: productsRes.data ?? [],
  })
}

export async function PUT(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const body = (await request.json()) as {
    sections?: Record<string, string[]>
  }

  const sections = body.sections ?? {}
  const supabase = createServiceRoleClient()

  for (const [key, productIds] of Object.entries(sections)) {
    if (!VALID_KEYS.has(key)) {
      return NextResponse.json({ error: `Unbekannte Sektion: ${key}` }, { status: 400 })
    }

    const { error: delError } = await supabase
      .from("menu_homepage_sections")
      .delete()
      .eq("section_key", key)

    if (delError?.code === "42P01") {
      return NextResponse.json(
        { error: "Tabelle menu_homepage_sections fehlt — bitte scripts/58-menu-homepage-sections.sql ausführen." },
        { status: 503 },
      )
    }
    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 500 })
    }

    const uniqueIds = [...new Set(productIds.map(String).filter(Boolean))]
    if (uniqueIds.length === 0) continue

    const rows = uniqueIds.map((product_id, i) => ({
      section_key: key as MenuHomepageSectionKey,
      product_id,
      display_order: i,
      is_active: true,
    }))

    const { error: insError } = await supabase.from("menu_homepage_sections").insert(rows)
    if (insError) {
      return NextResponse.json({ error: insError.message }, { status: 500 })
    }
  }

  invalidateMenuCache()
  return NextResponse.json({ ok: true })
}
