import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

const MOCK_SETTINGS: Record<string, unknown> = {
  "restaurant.name": "Joseph Bechara",
  "restaurant.currency": "EUR",
  "restaurant.tva_rate": 0.19,
  "ai.chatbot_enabled": true,
  "ai.recommendation_enabled": true,
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const key = searchParams.get("key")

  if (!hasServerSupabaseEnv()) {
    if (key) {
      return NextResponse.json({ value: MOCK_SETTINGS[key] ?? null, source: "mock" })
    }
    return NextResponse.json({ settings: MOCK_SETTINGS, source: "mock" })
  }

  try {
    const supabase = await createClient()
    let query = supabase.from("restaurant_settings").select("key,value,description,category,updated_at")
    if (category) query = query.eq("category", category)
    if (key) query = query.eq("key", key)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (key && data && data.length === 1) {
      const row = data[0] as Record<string, unknown>
      return NextResponse.json({ ...row, source: "supabase" as const })
    }

    const settings: Record<string, unknown> = {}
    for (const row of data ?? []) settings[row.key] = row.value
    return NextResponse.json({ settings, rows: data ?? [], source: "supabase" })
  } catch (err) {
    console.error("[settings] GET exception", err)
    return NextResponse.json({ settings: MOCK_SETTINGS, source: "mock-fallback" })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const updates: Array<{ key: string; value: unknown; description?: string; category?: string }> =
      Array.isArray(body) ? body : body.updates ?? [body]

    if (!hasServerSupabaseEnv()) {
      return NextResponse.json({ success: true, count: updates.length, source: "mock" })
    }

    const supabase = await createClient()
    const payload = updates
      .filter((u) => u && typeof u.key === "string")
      .map((u) => ({
        key: u.key,
        value: u.value,
        description: u.description ?? null,
        category: u.category ?? null,
        updated_at: new Date().toISOString(),
      }))

    if (payload.length === 0) {
      return NextResponse.json({ error: "Aucune mise a jour valide" }, { status: 400 })
    }

    const { error } = await supabase.from("restaurant_settings").upsert(payload, { onConflict: "key" })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, count: payload.length, source: "supabase" })
  } catch (err) {
    console.error("[settings] PATCH exception", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
