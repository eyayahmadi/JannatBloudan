import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv, getSupabaseProjectRef } from "@/lib/supabase/config"
import { getLiveMenuCatalog } from "@/lib/menu/menu-catalog-service"

export const dynamic = "force-dynamic"

/** Lightweight production debug — confirms live Supabase menu source. */
export async function GET() {
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 503 })
  }

  const supabase = await createClient()
  const { categories, products, error } = await getLiveMenuCatalog(supabase)

  return NextResponse.json(
    {
      ok: !error,
      error,
      menu_source: "live-catalog",
      supabase_project: getSupabaseProjectRef(),
      deploy_commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      category_count: categories.length,
      product_count: products.length,
      category_slugs: categories.map((c) => c.slug),
      fetched_at: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  )
}
