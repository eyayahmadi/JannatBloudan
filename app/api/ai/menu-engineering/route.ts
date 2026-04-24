import { NextResponse } from "next/server"

type Quad = "star" | "cash_cow" | "puzzle" | "dog"

export async function GET() {
  const items: Array<{ name: string; popularity: number; margin: number; quad: Quad }> = [
    { name: "Shawarma Poulet", popularity: 92, margin: 68, quad: "star" },
    { name: "Houmous", popularity: 78, margin: 82, quad: "cash_cow" },
    { name: "Kebab Halabi", popularity: 71, margin: 55, quad: "star" },
    { name: "Pizza Orientale", popularity: 64, margin: 48, quad: "puzzle" },
    { name: "Burger Classic", popularity: 38, margin: 42, quad: "dog" },
  ]

  return NextResponse.json({
    agent: "menu_engineering",
    matrix: items,
    legend: {
      star: "⭐ Haute popularite + marge — mettre en avant",
      cash_cow: "💰 Marge forte — defendre sans sur-promouvoir",
      puzzle: "🧩 Potentiel — besoin visibilite / photo / bundle",
      dog: "❌ Faible perf — revisiter recette ou retirer",
    },
    actions: [
      { item: "Burger Classic", suggestion: "Bundle + boisson ou retirer du menu digital" },
      { item: "Pizza Orientale", suggestion: "Photo hero + upsell dessert" },
    ],
    generatedAt: new Date().toISOString(),
  })
}
