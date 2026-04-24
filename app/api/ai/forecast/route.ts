import { NextResponse } from "next/server"

function generateHistoricalData(days: number) {
  const data = []
  const now = new Date()
  for (let i = days; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 86400000)
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const baseRevenue = isWeekend ? 1200 : 800
    const noise = (Math.sin(i * 0.7) * 0.2 + (Math.random() - 0.5) * 0.3) * baseRevenue
    const trend = i * 2

    data.push({
      date: date.toISOString().split("T")[0],
      revenue: Math.round(baseRevenue + noise + trend),
      orders: Math.round((baseRevenue + noise) / 18),
      customers: Math.round((baseRevenue + noise) / 25),
      dayOfWeek,
    })
  }
  return data
}

function forecast(history: { revenue: number; orders: number; customers: number; dayOfWeek: number }[], daysAhead: number) {
  const n = history.length
  const avgRevenue = history.reduce((s, d) => s + d.revenue, 0) / n
  const avgOrders = history.reduce((s, d) => s + d.orders, 0) / n

  const weekdayAvg: Record<number, number> = {}
  for (let d = 0; d < 7; d++) {
    const dayData = history.filter((h) => h.dayOfWeek === d)
    weekdayAvg[d] = dayData.length > 0 ? dayData.reduce((s, h) => s + h.revenue, 0) / dayData.length : avgRevenue
  }

  const recentTrend = n > 7
    ? (history.slice(-7).reduce((s, d) => s + d.revenue, 0) / 7 - history.slice(-14, -7).reduce((s, d) => s + d.revenue, 0) / 7) / (history.slice(-14, -7).reduce((s, d) => s + d.revenue, 0) / 7 || 1)
    : 0

  const predictions = []
  const now = new Date()
  for (let i = 1; i <= daysAhead; i++) {
    const date = new Date(now.getTime() + i * 86400000)
    const dow = date.getDay()
    const base = weekdayAvg[dow] || avgRevenue
    const trended = base * (1 + recentTrend * 0.3)
    const confidence = Math.max(60, Math.round(90 - i * 4))

    predictions.push({
      date: date.toISOString().split("T")[0],
      dayName: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][dow],
      predictedRevenue: Math.round(trended),
      predictedOrders: Math.round(trended / 18),
      predictedCustomers: Math.round(trended / 25),
      confidence,
      lower: Math.round(trended * 0.8),
      upper: Math.round(trended * 1.2),
    })
  }

  const peakHours: Record<string, Record<string, number>> = {}
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
  const hours = ["11h", "12h", "13h", "14h", "18h", "19h", "20h", "21h", "22h"]
  days.forEach((day) => {
    peakHours[day] = {}
    hours.forEach((hour) => {
      const h = parseInt(hour)
      const isLunch = h >= 12 && h <= 13
      const isDinner = h >= 19 && h <= 21
      const isWeekend = day === "Sam" || day === "Dim"
      let intensity = 30
      if (isLunch) intensity = 60 + Math.round(Math.random() * 30)
      if (isDinner) intensity = 70 + Math.round(Math.random() * 25)
      if (isWeekend) intensity += 15
      peakHours[day][hour] = Math.min(100, intensity)
    })
  })

  return {
    predictions,
    weeklyTrend: Math.round(recentTrend * 1000) / 10,
    peakHours,
    healthScore: Math.round(Math.min(100, Math.max(0, 50 + recentTrend * 200 + (avgRevenue > 700 ? 20 : 0)))),
  }
}

export async function GET() {
  const history = generateHistoricalData(90)
  const result = forecast(history, 7)

  return NextResponse.json({
    ...result,
    historicalSummary: {
      avgDailyRevenue: Math.round(history.reduce((s, d) => s + d.revenue, 0) / history.length),
      avgDailyOrders: Math.round(history.reduce((s, d) => s + d.orders, 0) / history.length),
      totalRevenue: history.reduce((s, d) => s + d.revenue, 0),
      bestDay: history.reduce((best, d) => (d.revenue > best.revenue ? d : best), history[0]),
    },
    recommendations: [
      result.weeklyTrend > 5 ? "Croissance positive — maintenez les efforts actuels" : null,
      result.weeklyTrend < -5 ? "Tendance a la baisse — envisagez des promotions ciblees" : null,
      result.healthScore > 70 ? "Sante business excellente" : "Attention: indicateurs en dessous de la normale",
    ].filter(Boolean),
    algorithm: "linear_regression_seasonal_v1",
    generatedAt: new Date().toISOString(),
  })
}
