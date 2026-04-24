import { NextResponse } from "next/server"

const PRODUCTS = [
  { id: 1, name: "Shawarma Poulet", basePrice: 8.5, category: "shawarma", demand: "high", stock: 50 },
  { id: 2, name: "Shawarma Viande", basePrice: 9.5, category: "shawarma", demand: "high", stock: 40 },
  { id: 7, name: "Kibbeh", basePrice: 12, category: "hot-dishes", demand: "medium", stock: 30 },
  { id: 8, name: "Kebab Halabi", basePrice: 14.5, category: "hot-dishes", demand: "high", stock: 20 },
  { id: 12, name: "Houmous", basePrice: 5.5, category: "mezze", demand: "medium", stock: 60 },
  { id: 22, name: "Baklava", basePrice: 6.5, category: "dessert", demand: "high", stock: 45 },
  { id: 28, name: "The a la Menthe", basePrice: 2.5, category: "drink", demand: "medium", stock: 100 },
  { id: 29, name: "Cafe Turc", basePrice: 3, category: "drink", demand: "low", stock: 80 },
  { id: 32, name: "Pizza Margherita", basePrice: 12.99, category: "pizza", demand: "medium", stock: 25 },
  { id: 36, name: "Pizza Orientale", basePrice: 15.99, category: "pizza", demand: "high", stock: 15 },
  { id: 37, name: "Burger Classic", basePrice: 10.5, category: "burger", demand: "medium", stock: 35 },
  { id: 40, name: "Burger Syrien", basePrice: 11.99, category: "burger", demand: "high", stock: 20 },
]

export async function GET() {
  const now = new Date()
  const hour = now.getHours()
  const day = now.getDay()
  const isWeekend = day === 0 || day === 6
  const isHappyHour = hour >= 17 && hour < 19
  const isLunchRush = hour >= 12 && hour < 14
  const isDinnerRush = hour >= 19 && hour < 21

  const pricing = PRODUCTS.map((p) => {
    let modifier = 0
    const reasons: string[] = []

    if (isHappyHour && p.category === "drink") {
      modifier -= 0.15
      reasons.push("Happy Hour -15%")
    }
    if (p.demand === "low" && !isLunchRush && !isDinnerRush) {
      modifier -= 0.10
      reasons.push("Faible demande -10%")
    }
    if (p.demand === "high" && p.stock < 25) {
      modifier += 0.10
      reasons.push("Forte demande + stock bas +10%")
    }
    if (isWeekend && p.demand === "high") {
      modifier += 0.05
      reasons.push("Premium weekend +5%")
    }
    if (isLunchRush && (p.category === "shawarma" || p.category === "manakish")) {
      modifier += 0.05
      reasons.push("Rush dejeuner +5%")
    }

    const suggestedPrice = Math.round(p.basePrice * (1 + modifier) * 100) / 100
    const revenueImpact = modifier > 0 ? "increase" : modifier < 0 ? "decrease" : "neutral"

    return {
      id: p.id,
      name: p.name,
      category: p.category,
      originalPrice: p.basePrice,
      suggestedPrice,
      discountPercent: Math.round(modifier * 100),
      reasons: reasons.length > 0 ? reasons : ["Prix standard"],
      revenueImpact,
      autoEnabled: true,
    }
  })

  return NextResponse.json({
    pricing,
    context: { hour, day, isWeekend, isHappyHour, isLunchRush, isDinnerRush },
    summary: {
      increased: pricing.filter((p) => p.suggestedPrice > p.originalPrice).length,
      decreased: pricing.filter((p) => p.suggestedPrice < p.originalPrice).length,
      unchanged: pricing.filter((p) => p.suggestedPrice === p.originalPrice).length,
      avgModifier: Math.round(pricing.reduce((s, p) => s + p.discountPercent, 0) / pricing.length),
    },
    algorithm: "rule_based_dynamic_pricing_v1",
  })
}
