import { NextResponse } from "next/server"

const MOCK_PRODUCTS = [
  { id: "1", name: "Poulet", stock: 25, unit: "kg", avgDailyUsage: 8 },
  { id: "2", name: "Pain Saj", stock: 40, unit: "pieces", avgDailyUsage: 15 },
  { id: "3", name: "Tahini", stock: 5, unit: "litres", avgDailyUsage: 1.2 },
  { id: "4", name: "Boeuf hache", stock: 12, unit: "kg", avgDailyUsage: 4 },
  { id: "5", name: "Huile d'olive", stock: 8, unit: "litres", avgDailyUsage: 0.8 },
  { id: "6", name: "Tomates", stock: 30, unit: "kg", avgDailyUsage: 6 },
  { id: "7", name: "Oignons", stock: 20, unit: "kg", avgDailyUsage: 3 },
  { id: "8", name: "Fromage Akkawi", stock: 4, unit: "kg", avgDailyUsage: 1.5 },
  { id: "9", name: "Pois chiches", stock: 15, unit: "kg", avgDailyUsage: 2 },
  { id: "10", name: "Pistaches", stock: 2, unit: "kg", avgDailyUsage: 0.5 },
  { id: "11", name: "Miel", stock: 3, unit: "litres", avgDailyUsage: 0.3 },
  { id: "12", name: "Boulgour", stock: 10, unit: "kg", avgDailyUsage: 1.8 },
]

export async function GET() {
  const predictions = MOCK_PRODUCTS.map((p) => {
    const daysUntilStockout = p.avgDailyUsage > 0 ? Math.round(p.stock / p.avgDailyUsage * 10) / 10 : 999
    const confidence = Math.min(95, Math.round(70 + Math.random() * 25))
    const reorderQty = Math.round(p.avgDailyUsage * 7)
    const urgency = daysUntilStockout <= 2 ? "critical" : daysUntilStockout <= 5 ? "warning" : "ok"

    return {
      ...p,
      daysUntilStockout,
      recommendedReorderQty: reorderQty,
      confidence,
      urgency,
      projectedStockoutDate: new Date(Date.now() + daysUntilStockout * 86400000).toISOString().split("T")[0],
      supplierOrder: urgency !== "ok" ? {
        product: p.name,
        quantity: reorderQty,
        estimatedCost: Math.round(reorderQty * (3 + Math.random() * 10) * 100) / 100,
        priority: urgency,
      } : null,
    }
  }).sort((a, b) => a.daysUntilStockout - b.daysUntilStockout)

  return NextResponse.json({
    predictions,
    summary: {
      totalProducts: predictions.length,
      critical: predictions.filter((p) => p.urgency === "critical").length,
      warning: predictions.filter((p) => p.urgency === "warning").length,
      healthy: predictions.filter((p) => p.urgency === "ok").length,
    },
    algorithm: "moving_average_forecast_v1",
    generatedAt: new Date().toISOString(),
  })
}
