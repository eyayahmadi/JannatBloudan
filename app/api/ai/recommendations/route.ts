import { NextResponse } from "next/server"

import { getRestaurantOperationalContext } from "@/lib/agent-context/context"
import { getClientMemory } from "@/lib/agent-memory/store"
import { createClient } from "@/lib/supabase/server"
import { getActiveProducts } from "@/lib/menu/menu-catalog-service"

type ScoredMenuItem = {
  id: string
  name: string
  category: string
  section: string
  price: number
  rating: number
  reviews: number
  timeSlot: string
}

async function loadLiveMenuItems(): Promise<ScoredMenuItem[]> {
  const supabase = await createClient()
  const { rows, error } = await getActiveProducts(supabase)
  if (error) return []

  return rows.map((r) => {
    const cat = r.categories as { slug?: string; section?: string } | null
    const section = cat?.section ?? "food"
    return {
      id: String(r.id),
      name: String(r.name ?? ""),
      category: cat?.slug ?? "other",
      section,
      price: Number(r.price) || 0,
      rating: 4.5,
      reviews: r.is_popular ? 120 : 40,
      timeSlot: "all",
    }
  })
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
  spicy: ["shawarma", "grillades", "hauptgerichte"],
  sweet: ["desserts", "waffeln", "crepes"],
  chicken: ["shawarma"],
  meat: ["grillades", "hauptgerichte"],
  vegan: ["salades", "vorspeisen"],
  light: ["salades", "juices"],
}

function memoryCategoryBoost(category: string, taste: Record<string, number>): number {
  let bonus = 0
  for (const [tag, w] of Object.entries(taste)) {
    const cats = TAG_CATEGORY_WEIGHT[tag]
    if (cats?.includes(category)) bonus += w * 0.12
  }
  return Math.min(bonus, 0.35)
}

function weatherScoreFor(item: ScoredMenuItem, weather: string): number {
  switch (weather) {
    case "cold":
      return item.section === "food" || item.section === "drinks" ? 1 : 0.3
    case "hot":
      return item.section === "desserts" || item.section === "drinks" ? 1 : 0.3
    case "rainy":
      return item.section === "food" || item.section === "desserts" ? 1 : 0.3
    case "sunny":
      return item.section === "food" || item.section === "drinks" ? 1 : 0.3
    default:
      return 0.5
  }
}

function isFastItem(item: ScoredMenuItem): boolean {
  return item.section === "food" || item.section === "drinks"
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      viewedItems?: Array<string | number>
      hour?: number
      clientKey?: string
      weights?: { affinity?: number; popularity?: number; time?: number; weather?: number }
    }
    const viewedIdSet = new Set((body.viewedItems ?? []).map(String))
    const hour: number = body.hour ?? new Date().getHours()
    const weights = {
      affinity: body.weights?.affinity ?? 0.4,
      popularity: body.weights?.popularity ?? 0.25,
      time: body.weights?.time ?? 0.2,
      weather: body.weights?.weather ?? 0.15,
    }

    const menuItems = await loadLiveMenuItems()
    if (menuItems.length === 0) {
      return NextResponse.json({
        recommendations: [],
        context: { hour, source: "live-menu-empty" },
        algorithm: "weighted_scoring_v2_memory_context",
      })
    }

    const opCtx = getRestaurantOperationalContext(new Date())
    const clientKey = typeof body.clientKey === "string" ? body.clientKey.trim() : ""
    const mem = clientKey ? await getClientMemory(clientKey) : null
    const taste = mem?.tasteVector ?? {}

    const viewedCategories = new Set(
      menuItems.filter((i) => viewedIdSet.has(i.id)).map((i) => i.category),
    )

    const timeSlot = getTimeSlot(hour)
    const weather = simulateWeather()

    const scored = menuItems
      .map((item) => {
        const affinityScore = viewedCategories.has(item.category) ? 1 : 0.2
        const popularityScore = Math.min(item.reviews / 200, 1)
        let timeScore = item.timeSlot === "all" || item.timeSlot === TIME_SLOTS[timeSlot] ? 1 : 0.3
        const weatherScore = weatherScoreFor(item, weather)

        if (opCtx.rushLevel === "rush" && isFastItem(item)) {
          timeScore = Math.min(1, timeScore + 0.25)
        }
        if (opCtx.rushLevel === "calm" && item.section === "desserts") {
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
            opCtx.rushLevel === "rush" && isFastItem(item) ? "Rapide a preparer (rush)" : null,
            opCtx.rushLevel === "calm" && item.section === "desserts" ? "Upsell dessert (calme)" : null,
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
        source: "live-menu",
      },
      algorithm: "weighted_scoring_v2_memory_context",
    })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
