import { NextResponse } from "next/server"

const TABLES = Array.from({ length: 20 }, (_, i) => {
  const id = i + 1
  const zone = id <= 5 ? "interieur" : id <= 10 ? "terrasse" : id <= 15 ? "vip" : "gaming"
  const statuses = ["occupied", "empty", "needs_cleaning", "reserved"] as const
  const status = statuses[Math.floor((Date.now() / 60000 + i * 7) % 4)]
  const occupiedSince = status === "occupied" ? new Date(Date.now() - Math.random() * 3600000).toISOString() : null
  const emptySince = status === "empty" ? new Date(Date.now() - Math.random() * 600000).toISOString() : null
  return { id, number: id, zone, status, occupiedSince, emptySince, capacity: id % 3 === 0 ? 6 : id % 2 === 0 ? 4 : 2 }
})

export async function GET() {
  const occupied = TABLES.filter((t) => t.status === "occupied").length
  const empty = TABLES.filter((t) => t.status === "empty").length
  const needsCleaning = TABLES.filter((t) => t.status === "needs_cleaning").length
  const reserved = TABLES.filter((t) => t.status === "reserved").length

  const queueLength = Math.floor(Math.random() * 8)
  const avgOccupancy = Math.round((occupied / TABLES.length) * 100)

  const alerts = [
    ...TABLES.filter((t) => t.status === "empty" && t.emptySince && (Date.now() - new Date(t.emptySince).getTime()) > 300000)
      .map((t) => ({ type: "empty_table", message: `Table ${t.number} libre depuis ${Math.round((Date.now() - new Date(t.emptySince!).getTime()) / 60000)} min`, severity: "info" as const, tableId: t.id })),
    ...TABLES.filter((t) => t.status === "needs_cleaning")
      .map((t) => ({ type: "needs_cleaning", message: `Table ${t.number} a nettoyer`, severity: "warning" as const, tableId: t.id })),
    ...(queueLength > 5 ? [{ type: "queue_long", message: `File d'attente: ${queueLength} personnes`, severity: "warning" as const, tableId: 0 }] : []),
  ]

  return NextResponse.json({
    tables: TABLES,
    metrics: { total: TABLES.length, occupied, empty, needsCleaning, reserved, avgOccupancy, queueLength },
    alerts,
    heatmap: { zones: { interieur: Math.round(Math.random() * 100), terrasse: Math.round(Math.random() * 100), vip: Math.round(Math.random() * 100), gaming: Math.round(Math.random() * 100) } },
    algorithm: "simulated_computer_vision_v1",
    generatedAt: new Date().toISOString(),
  })
}
