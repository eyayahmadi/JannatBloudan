import { NextResponse } from "next/server"

const TABLES = [
  { id: 1, capacity: 2, zone: "interieur" }, { id: 2, capacity: 2, zone: "interieur" },
  { id: 3, capacity: 4, zone: "interieur" }, { id: 4, capacity: 4, zone: "terrasse" },
  { id: 5, capacity: 6, zone: "terrasse" }, { id: 6, capacity: 6, zone: "terrasse" },
  { id: 7, capacity: 2, zone: "vip" }, { id: 8, capacity: 4, zone: "vip" },
  { id: 9, capacity: 8, zone: "gaming" }, { id: 10, capacity: 4, zone: "interieur" },
]

const MOCK_RESERVATIONS = [
  { id: "R1", date: "2024-12-15", time: "19:00", guests: 4, name: "Dupont", tableId: 3, noShowRisk: 0.1, confirmed: true },
  { id: "R2", date: "2024-12-15", time: "19:30", guests: 2, name: "Martin", tableId: 1, noShowRisk: 0.35, confirmed: false },
  { id: "R3", date: "2024-12-15", time: "20:00", guests: 6, name: "Ahmed", tableId: 5, noShowRisk: 0.05, confirmed: true },
  { id: "R4", date: "2024-12-15", time: "20:00", guests: 2, name: "Leroy", tableId: 7, noShowRisk: 0.45, confirmed: false },
  { id: "R5", date: "2024-12-15", time: "20:30", guests: 4, name: "Ben Ali", tableId: 4, noShowRisk: 0.15, confirmed: true },
]

export async function POST(request: Request) {
  try {
    const { guests, date, time, zone } = await request.json()
    const guestCount = guests || 2

    const available = TABLES
      .filter((t) => t.capacity >= guestCount && (!zone || t.zone === zone))
      .sort((a, b) => a.capacity - b.capacity)

    const suggested = available[0] || null
    const alternatives = available.slice(1, 4)

    const noShowPredictions = MOCK_RESERVATIONS.map((r) => ({
      ...r,
      riskLevel: r.noShowRisk > 0.3 ? "high" : r.noShowRisk > 0.15 ? "medium" : "low",
      recommendation: r.noShowRisk > 0.3 ? "Envoyer rappel SMS" : r.noShowRisk > 0.15 ? "Rappel email" : "Aucune action",
    }))

    const occupancyByHour: Record<string, number> = {}
    const hours = ["11:30", "12:00", "12:30", "13:00", "19:00", "19:30", "20:00", "20:30", "21:00"]
    hours.forEach((h) => { occupancyByHour[h] = Math.round(30 + Math.random() * 60) })

    const overbookingCapacity = Math.round(TABLES.length * 0.1)

    return NextResponse.json({
      suggestedTable: suggested ? { ...suggested, reason: `Capacite optimale pour ${guestCount} personnes` } : null,
      alternatives: alternatives.map((t) => ({ ...t, reason: `Alternative — capacite ${t.capacity}` })),
      noShowPredictions,
      occupancyForecast: occupancyByHour,
      overbooking: { enabled: true, extraSlots: overbookingCapacity, noShowRate: 0.18, reason: `Taux no-show moyen 18% — ${overbookingCapacity} tables supplementaires autorisees` },
      metrics: { totalTables: TABLES.length, reservationsTonight: MOCK_RESERVATIONS.length, occupancyRate: Math.round((MOCK_RESERVATIONS.length / TABLES.length) * 100), highRiskNoShows: noShowPredictions.filter((r) => r.riskLevel === "high").length },
      algorithm: "smart_reservation_optimizer_v1",
    })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
