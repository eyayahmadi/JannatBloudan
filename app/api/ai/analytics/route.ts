import { NextResponse } from "next/server"

const TOP_PRODUCTS = [
  { name: "Shawarma Poulet", category: "Shawarma", sold: 189, revenue: 1606.5, marginPct: 42 },
  { name: "Kebab Halabi", category: "Plats chauds", sold: 112, revenue: 1624, marginPct: 38 },
  { name: "Pizza Orientale", category: "Pizzas", sold: 108, revenue: 1726.92, marginPct: 35 },
  { name: "Houmous", category: "Mezze", sold: 203, revenue: 1116.5, marginPct: 55 },
  { name: "Baklava", category: "Desserts", sold: 98, revenue: 637, marginPct: 48 },
]

const KPIS = [
  { id: "revenue_7d", label: "CA 7 jours", value: 28450, unit: "EUR", changePct: 5.2 },
  { id: "orders_7d", label: "Commandes 7j", value: 612, unit: "", changePct: 3.1 },
  { id: "aov", label: "Panier moyen", value: 46.5, unit: "EUR", changePct: -0.8 },
  { id: "repeat_rate", label: "Clients recidivistes", value: 34, unit: "%", changePct: 2.4 },
]

function buildNarrative(salesDelta: number, top: string, weak: string) {
  const dir = salesDelta >= 0 ? "augmente" : "diminue"
  return `Cette semaine, le chiffre d'affaires a ${dir} d'environ ${Math.abs(salesDelta).toFixed(1)}%. Le plat le plus porteur est « ${top} ». Point d'attention: la categorie « ${weak} » sous-performe par rapport a la moyenne — envisager une promo ciblee ou un ajustement de stock.`
}

export async function GET() {
  const top = TOP_PRODUCTS[0]!
  const weakCategory = "Burgers"
  const narrative = buildNarrative(5.2, top.name, weakCategory)

  return NextResponse.json({
    kpis: KPIS,
    topProducts: TOP_PRODUCTS,
    narrative,
    insights: [
      { type: "positive", text: "Le creneau 19h-21h concentre 41% du CA — renforcer le staffing cuisine." },
      { type: "warning", text: "Taux d'annulation +8% sur la livraison mardi — verifier les temps de preparation." },
      { type: "action", text: "Croisement anomalies + stock: 2 SKUs critiques impactent 4 plats du menu digital." },
    ],
    algorithm: "rule_based_bi_nlg_v1",
    generatedAt: new Date().toISOString(),
  })
}
