import { NextResponse } from "next/server"

type Quad = "star" | "cash_cow" | "puzzle" | "dog"

export async function GET() {
  const items: Array<{
    id: string
    name: string
    popularity: number
    margin: number
    quad: Quad
    emoji: string
    aiRecommendation: string
    ordersTrend: number
  }> = [
    {
      id: "1",
      name: "Shawarma Poulet",
      popularity: 92,
      margin: 68,
      quad: "star",
      emoji: "🥙",
      aiRecommendation: "Mettre en hero digital + suggestion boisson fermentée.",
      ordersTrend: 12,
    },
    {
      id: "2",
      name: "Houmous",
      popularity: 78,
      margin: 82,
      quad: "cash_cow",
      emoji: "🧆",
      aiRecommendation: "Conserver prix ; bundle dessert léger sans cannibaliser.",
      ordersTrend: 4,
    },
    {
      id: "3",
      name: "Kebab Halabi",
      popularity: 71,
      margin: 55,
      quad: "star",
      emoji: "🍢",
      aiRecommendation: "Photo pro + mise en avant soir/week-end.",
      ordersTrend: 8,
    },
    {
      id: "4",
      name: "Pizza Orientale",
      popularity: 64,
      margin: 48,
      quad: "puzzle",
      emoji: "🍕",
      aiRecommendation: "Visibilité et bundle dessert — potentiel inexploité.",
      ordersTrend: -3,
    },
    {
      id: "5",
      name: "Burger Classic",
      popularity: 38,
      margin: 42,
      quad: "dog",
      emoji: "🍔",
      aiRecommendation: "Revoir recette ou retirer ; proposer substitution signature.",
      ordersTrend: -11,
    },
  ]

  const totals = items.reduce(
    (acc, it) => {
      acc.orders += it.popularity
      acc.marginWeighted += it.popularity * it.margin
      return acc
    },
    { orders: 0, marginWeighted: 0 },
  )
  const weightedMargin = totals.orders ? Math.round(totals.marginWeighted / totals.orders) : 0

  return NextResponse.json({
    agent: "menu_engineering",
    matrix: items,
    kpis: {
      avgWeightedMarginPercent: weightedMargin,
      starsCount: items.filter((i) => i.quad === "star").length,
      dogsCount: items.filter((i) => i.quad === "dog").length,
    },
    legend: {
      star: "Étoiles — forte popularité & marge",
      cash_cow: "Stars cash — défendre la marge",
      puzzle: "Puzzles — booster visibilité",
      dog: "Candidates — révision ou retrait",
    },
    charts: {
      topProfitable: [...items].sort((a, b) => b.margin - a.margin).slice(0, 3),
      topOrdered: [...items].sort((a, b) => b.popularity - a.popularity).slice(0, 3),
      lowPerformers: [...items].filter((i) => i.quad === "dog" || i.ordersTrend < 0),
    },
    actions: [
      { item: "Burger Classic", suggestion: "Bundle + boisson ou retirer du menu digital" },
      { item: "Pizza Orientale", suggestion: "Photo hero + upsell dessert" },
    ],
    generatedAt: new Date().toISOString(),
  })
}
