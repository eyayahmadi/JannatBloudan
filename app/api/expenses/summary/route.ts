import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = Number(searchParams.get("days") || 30)

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({
      totalExpenses: 0,
      totalRevenue: 0,
      profit: 0,
      byCategory: [],
      byDay: [],
      source: "mock",
    })
  }

  try {
    const supabase = await createClient()
    const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

    const [{ data: expenses }, { data: pnl }] = await Promise.all([
      supabase
        .from("expenses")
        .select("amount, expense_date, category:expense_categories(id,name,color)")
        .gte("expense_date", since),
      supabase
        .from("v_daily_pnl")
        .select("*")
        .gte("day", since)
        .order("day", { ascending: true }),
    ])

    const totalExpenses = (expenses ?? []).reduce(
      (s: number, e: any) => s + Number(e.amount ?? 0),
      0,
    )

    // Aggregations par categorie
    const byCategoryMap = new Map<string, { name: string; color: string; total: number }>()
    for (const e of expenses ?? []) {
      const cat = (e as any).category
      const key = cat?.id ?? "uncategorized"
      const existing = byCategoryMap.get(key) ?? {
        name: cat?.name ?? "Non categorise",
        color: cat?.color ?? "#71717a",
        total: 0,
      }
      existing.total += Number(e.amount ?? 0)
      byCategoryMap.set(key, existing)
    }
    const byCategory = [...byCategoryMap.values()].sort((a, b) => b.total - a.total)

    const totalRevenue = (pnl ?? []).reduce(
      (s: number, p: any) => s + Number(p.revenue ?? 0),
      0,
    )

    return NextResponse.json({
      totalExpenses,
      totalRevenue,
      profit: totalRevenue - totalExpenses,
      byCategory,
      byDay: pnl ?? [],
      periodDays: days,
      source: "supabase",
    })
  } catch (err) {
    console.error("[expenses/summary] exception", err)
    return NextResponse.json({
      totalExpenses: 0,
      totalRevenue: 0,
      profit: 0,
      byCategory: [],
      byDay: [],
      source: "mock-fallback",
    })
  }
}
