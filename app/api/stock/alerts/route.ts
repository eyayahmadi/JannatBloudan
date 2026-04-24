import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

const MOCK_ALERTS = [
  { productId: "1", name: "Poulet", stock: 3, threshold: 10, status: "critical" },
  { productId: "2", name: "Pain saj", stock: 8, threshold: 15, status: "warning" },
  { productId: "3", name: "Tahini", stock: 5, threshold: 10, status: "warning" },
]

export async function GET() {
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ alerts: MOCK_ALERTS, source: "mock" })
  }

  try {
    const supabase = await createClient()

    // Vue v_low_stock creee dans la migration 06
    const { data, error } = await supabase
      .from("v_low_stock")
      .select("id, name, stock_quantity, threshold_low, threshold_critical, alert_status")

    if (error) {
      console.error("[stock/alerts] view error, fallback mock", error)
      return NextResponse.json({ alerts: MOCK_ALERTS, source: "mock", warning: error.message })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ alerts: [], source: "supabase" })
    }

    const alerts = data.map((row: any) => ({
      productId: row.id,
      name: row.name,
      stock: Number(row.stock_quantity),
      threshold: Number(row.threshold_low),
      thresholdCritical: Number(row.threshold_critical),
      status: row.alert_status as "critical" | "warning" | "ok",
    }))

    return NextResponse.json({ alerts, source: "supabase" })
  } catch (err) {
    console.error("[stock/alerts] exception", err)
    return NextResponse.json({ alerts: MOCK_ALERTS, source: "mock-fallback" })
  }
}
