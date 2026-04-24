import { NextResponse } from "next/server"

import { getRestaurantOperationalContext } from "@/lib/agent-context/context"
import { getClientMemory } from "@/lib/agent-memory/store"

const MENU_ITEMS = [
  { id: 1, name: "Shawarma Poulet", category: "shawarma", price: 8.5, rating: 4.9, reviews: 187, timeSlot: "all" },
  { id: 2, name: "Shawarma Viande", category: "shawarma", price: 9.5, rating: 4.8, reviews: 156, timeSlot: "all" },
  { id: 7, name: "Kibbeh", category: "hot-dishes", price: 12, rating: 4.9, reviews: 167, timeSlot: "dinner" },
  { id: 8, name: "Kebab Halabi", category: "hot-dishes", price: 14.5, rating: 4.9, reviews: 189, timeSlot: "dinner" },
  { id: 12, name: "Houmous", category: "mezze", price: 5.5, rating: 4.8, reviews: 156, timeSlot: "all" },
  { id: 22, name: "Baklava", category: "dessert", price: 6.5, rating: 4.9, reviews: 198, timeSlot: "all" },
  { id: 23, name: "Kunafa", category: "dessert", price: 7, rating: 4.8, reviews: 176, timeSlot: "all" },
  { id: 32, name: "Pizza Margherita", category: "pizza", price: 12.99, rating: 4.8, reviews: 124, timeSlot: "lunch" },
  { id: 36, name: "Pizza Orientale", category: "pizza", price: 15.99, rating: 4.9, reviews: 145, timeSlot: "dinner" },
  { id: 37, name: "Burger Classic", category: "burger", price: 10.5, rating: 4.7, reviews: 88, timeSlot: "lunch" },
  { id: 40, name: "Burger Syrien", category: "burger", price: 11.99, rating: 4.9, reviews: 156, timeSlot: "all" },
  { id: 44, name: "Jus d'Orange Frais", category: "drink", price: 4.5, rating: 4.9, reviews: 267, timeSlot: "all" },
  { id: 4, name: "Manakish Zaatar", category: "manakish", price: 5.5, rating: 4.7, reviews: 134, timeSlot: "lunch" },
  { id: 10, name: "Falafel Assiette", category: "hot-dishes", price: 9, rating: 4.7, reviews: 143, timeSlot: "lunch" },
  { id: 28, name: "The a la Menthe", category: "drink", price: 2.5, rating: 4.5, reviews: 167, timeSlot: "all" },
]

const WEATHER_CATEGORIES: Record<string, string[]> = {
  cold: ["hot-dishes", "shawarma", "drink"],
  hot: ["mezze", "drink", "dessert"],
  rainy: ["hot-dishes", "shawarma", "dessert"],
  sunny: ["mezze", "manakish", "drink"],
}

const TIME_SLOTS: Record<string, string> = {
  morning: "lunch",
  lunch: "lunch",
  afternoon: "all",
  dinner: "dinner",
  night: "all",
}

function getTimeSlot(hour: number) {
  if (hour < 11) return "morning"
  if (hour < 14) return "lunch"
  if (hour < 17) return "afternoon"
  if (hour < 22) return "dinner"
  return "night"
}

function simulateWeather() {
  const conditions = ["cold", "hot", "rainy", "sunny"]
  const idx = Math.floor((Date.now() / 3600000) % 4)
  return conditions[idx]
}

/** Affinite memoire agent (tags) -> categories menu */
const TAG_CATEGORY_WEIGHT: Record<string, string[]> = {
  spicy: ["shawarma", "hot-dishes"],
  sweet: ["dessert", "drink"],
  chicken: ["shawarma"],
  meat: ["hot-dishes", "shawarma"],
  vegan: ["mezze", "manakish"],
  light: ["mezze", "drink"],
}

const FAST_CATEGORIES = new Set(["shawarma", "manakish", "drink", "mezze"])

function memoryCategoryBoost(category: string, taste: Record<string, number>): number {
  let bonus = 0
  for (const [tag, w] of Object.entries(taste)) {
    const cats = TAG_CATEGORY_WEIGHT[tag]
    if (cats?.includes(category)) bonus += w * 0.12
  }
  return Math.min(bonus, 0.35)
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      viewedItems?: number[]
      hour?: number
      clientKey?: string
      weights?: { affinity?: number; popularity?: number; time?: number; weather?: number }
    }
    const viewedIds: number[] = body.viewedItems || []
    const hour: number = body.hour ?? new Date().getHours()
    const weights = {
      affinity: body.weights?.affinity ?? 0.4,
      popularity: body.weights?.popularity ?? 0.25,
      time: body.weights?.time ?? 0.2,
      weather: body.weights?.weather ?? 0.15,
    }

    const opCtx = getRestaurantOperationalContext(new Date())
    const clientKey = typeof body.clientKey === "string" ? body.clientKey.trim() : ""
    const mem = clientKey ? await getClientMemory(clientKey) : null
    const taste = mem?.tasteVector ?? {}

    const viewedCategories = new Set(
      MENU_ITEMS.filter((i) => viewedIds.includes(i.id)).map((i) => i.category),
    )

    const timeSlot = getTimeSlot(hour)
    const weather = simulateWeather()
    const weatherCategories = new Set(WEATHER_CATEGORIES[weather] || [])

    const scored = MENU_ITEMS.map((item) => {
      const affinityScore = viewedCategories.has(item.category) ? 1 : 0.2
      const popularityScore = Math.min(item.reviews / 200, 1)
      let timeScore =
        item.timeSlot === "all" || item.timeSlot === TIME_SLOTS[timeSlot] ? 1 : 0.3
      const weatherScore = weatherCategories.has(item.category) ? 1 : 0.3

      if (opCtx.rushLevel === "rush" && FAST_CATEGORIES.has(item.category)) {
        timeScore = Math.min(1, timeScore + 0.25)
      }
      if (opCtx.rushLevel === "calm" && (item.category === "dessert" || item.category === "drink")) {
        timeScore = Math.min(1, timeScore + 0.15)
      }

      const memoryBoost = memoryCategoryBoost(item.category, taste)

      const total =
        (affinityScore + memoryBoost) * weights.affinity +
        popularityScore * weights.popularity +
        timeScore * weights.time +
        weatherScore * weights.weather

      return {
        ...item,
        score: Math.round(total * 100) / 100,
        confidence: Math.round(total * 100),
        reasons: [
          memoryBoost > 0.05 ? "Aligne memoire client (gouts)" : null,
          affinityScore > 0.5 ? "Correspond a vos gouts" : null,
          popularityScore > 0.7 ? "Tres populaire" : null,
          timeScore > 0.5 ? `Ideal pour ${timeSlot === "lunch" ? "le dejeuner" : "le diner"}` : null,
          weatherScore > 0.5 ? `Parfait par temps ${weather}` : null,
          opCtx.rushLevel === "rush" && FAST_CATEGORIES.has(item.category) ? "Rapide a preparer (rush)" : null,
          opCtx.rushLevel === "calm" && item.category === "dessert" ? "Upsell dessert (calme)" : null,
        ].filter(Boolean),
      }
    })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)

    return NextResponse.json({
      recommendations: scored,
      context: {
        hour,
        timeSlot,
        weather,
        viewedCategories: Array.from(viewedCategories),
        operational: opCtx,
        memoryActive: Boolean(clientKey && mem),
      },
      algorithm: "weighted_scoring_v2_memory_context",
    })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
