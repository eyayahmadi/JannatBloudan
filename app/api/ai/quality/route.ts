import { NextResponse } from "next/server"

const INGREDIENTS = [
  { id: "1", name: "Poulet frais", category: "Viandes", receivedDate: "2024-12-10", expiryDate: "2024-12-17", temperature: 3.2, tempMax: 4, status: "ok", supplier: "Ferme Bio", lot: "LOT-2024-1210-A" },
  { id: "2", name: "Boeuf hache", category: "Viandes", receivedDate: "2024-12-12", expiryDate: "2024-12-16", temperature: 2.8, tempMax: 4, status: "warning", supplier: "Boucherie Halal", lot: "LOT-2024-1212-B" },
  { id: "3", name: "Fromage Akkawi", category: "Produits laitiers", receivedDate: "2024-12-08", expiryDate: "2024-12-22", temperature: 5.1, tempMax: 6, status: "ok", supplier: "Laiterie Orientale", lot: "LOT-2024-1208-C" },
  { id: "4", name: "Tomates", category: "Legumes", receivedDate: "2024-12-13", expiryDate: "2024-12-18", temperature: 8, tempMax: 12, status: "ok", supplier: "Marche Central", lot: "LOT-2024-1213-D" },
  { id: "5", name: "Yaourt", category: "Produits laitiers", receivedDate: "2024-12-05", expiryDate: "2024-12-15", temperature: 4.5, tempMax: 6, status: "critical", supplier: "Laiterie Orientale", lot: "LOT-2024-1205-E" },
  { id: "6", name: "Pate filo", category: "Patisserie", receivedDate: "2024-12-11", expiryDate: "2024-12-25", temperature: -2, tempMax: 0, status: "ok", supplier: "Import Orient", lot: "LOT-2024-1211-F" },
  { id: "7", name: "Huile d'olive", category: "Huiles", receivedDate: "2024-11-01", expiryDate: "2025-11-01", temperature: 20, tempMax: 25, status: "ok", supplier: "Oleiculture Med", lot: "LOT-2024-1101-G" },
  { id: "8", name: "Pistaches", category: "Fruits secs", receivedDate: "2024-12-01", expiryDate: "2025-03-01", temperature: 18, tempMax: 22, status: "ok", supplier: "Import Orient", lot: "LOT-2024-1201-H" },
]

const HACCP_CHECKS = [
  { id: "H1", name: "Temperature frigo viandes", status: "pass", lastCheck: "2024-12-15T08:00:00", nextCheck: "2024-12-15T14:00:00", value: "3.2°C", limit: "< 4°C" },
  { id: "H2", name: "Temperature frigo laitier", status: "warning", lastCheck: "2024-12-15T08:00:00", nextCheck: "2024-12-15T14:00:00", value: "5.8°C", limit: "< 6°C" },
  { id: "H3", name: "Temperature congelateur", status: "pass", lastCheck: "2024-12-15T08:00:00", nextCheck: "2024-12-15T14:00:00", value: "-18°C", limit: "< -15°C" },
  { id: "H4", name: "Proprete surfaces cuisine", status: "pass", lastCheck: "2024-12-15T10:00:00", nextCheck: "2024-12-15T16:00:00", value: "Conforme", limit: "Norme HACCP" },
  { id: "H5", name: "Lavage mains personnel", status: "pass", lastCheck: "2024-12-15T07:30:00", nextCheck: "2024-12-15T12:00:00", value: "100%", limit: "100%" },
]

export async function GET() {
  const expiringSoon = INGREDIENTS.filter((i) => {
    const daysLeft = Math.round((new Date(i.expiryDate).getTime() - Date.now()) / 86400000)
    return daysLeft <= 3 && daysLeft >= 0
  })
  const expired = INGREDIENTS.filter((i) => new Date(i.expiryDate).getTime() < Date.now())
  const tempAlerts = INGREDIENTS.filter((i) => i.temperature > i.tempMax)

  return NextResponse.json({
    ingredients: INGREDIENTS.map((i) => ({ ...i, daysUntilExpiry: Math.round((new Date(i.expiryDate).getTime() - Date.now()) / 86400000) })),
    haccpChecks: HACCP_CHECKS,
    alerts: {
      expiringSoon: expiringSoon.length,
      expired: expired.length,
      temperatureAlerts: tempAlerts.length,
      totalAlerts: expiringSoon.length + expired.length + tempAlerts.length,
    },
    compliance: {
      score: Math.round(((HACCP_CHECKS.filter((c) => c.status === "pass").length) / HACCP_CHECKS.length) * 100),
      checksTotal: HACCP_CHECKS.length,
      checksPassed: HACCP_CHECKS.filter((c) => c.status === "pass").length,
    },
    algorithm: "haccp_compliance_monitoring_v1",
    generatedAt: new Date().toISOString(),
  })
}
