import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get("date")
  const day = dateParam || new Date().toISOString().split("T")[0]

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({
      date: day,
      cashTotal: 0,
      cardTotal: 0,
      onlineTotal: 0,
      total: 0,
      orderCount: 0,
      source: "mock",
      message: "Utilisez les donnees locales du POS",
    })
  }

  try {
    const supabase = await createClient()

    // Vue v_daily_revenue creee dans la migration 06
    const { data: revenue, error } = await supabase
      .from("v_daily_revenue")
      .select("*")
      .eq("day", day)
      .maybeSingle()

    // Compte des orders du jour
    const { count: orderCount } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${day}T00:00:00`)
      .lte("created_at", `${day}T23:59:59`)

    if (error) {
      console.error("[pos/daily-summary] error", error)
    }

    return NextResponse.json({
      date: day,
      cashTotal: Number(revenue?.cash_total ?? 0),
      cardTotal: Number(revenue?.card_total ?? 0),
      onlineTotal: Number(revenue?.online_total ?? 0),
      total: Number(revenue?.total ?? 0),
      paymentsCount: Number(revenue?.payments_count ?? 0),
      orderCount: orderCount ?? 0,
      source: "supabase",
    })
  } catch (err) {
    console.error("[pos/daily-summary] exception", err)
    return NextResponse.json({
      date: day,
      cashTotal: 0,
      cardTotal: 0,
      onlineTotal: 0,
      total: 0,
      orderCount: 0,
      source: "mock-fallback",
    })
  }
}
