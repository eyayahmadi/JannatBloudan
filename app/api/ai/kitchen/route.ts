import { NextResponse } from "next/server"

type OrderItem = { name: string; category: string; prepTime: number; quantity: number }

const PREP_TIMES: Record<string, number> = {
  shawarma: 12, manakish: 10, "hot-dishes": 18, mezze: 5, pizza: 18, burger: 14, dessert: 5, drink: 3,
}

const MOCK_QUEUE: OrderItem[] = [
  { name: "Shawarma Poulet", category: "shawarma", prepTime: 12, quantity: 2 },
  { name: "Baklava", category: "dessert", prepTime: 5, quantity: 1 },
  { name: "Kebab Halabi", category: "hot-dishes", prepTime: 18, quantity: 1 },
  { name: "The a la Menthe", category: "drink", prepTime: 3, quantity: 3 },
  { name: "Pizza Orientale", category: "pizza", prepTime: 18, quantity: 2 },
  { name: "Shawarma Viande", category: "shawarma", prepTime: 12, quantity: 1 },
  { name: "Houmous", category: "mezze", prepTime: 5, quantity: 2 },
  { name: "Burger Syrien", category: "burger", prepTime: 14, quantity: 1 },
  { name: "Kunafa", category: "dessert", prepTime: 5, quantity: 2 },
  { name: "Manakish Zaatar", category: "manakish", prepTime: 10, quantity: 2 },
  { name: "Pizza Margherita", category: "pizza", prepTime: 18, quantity: 1 },
  { name: "Cafe Turc", category: "drink", prepTime: 3, quantity: 2 },
]

function optimizeQueue(queue: OrderItem[]) {
  const batches: Record<string, OrderItem[]> = {}
  queue.forEach((item) => {
    if (!batches[item.category]) batches[item.category] = []
    batches[item.category].push(item)
  })

  const sortedCategories = Object.entries(batches).sort(
    ([, a], [, b]) => (PREP_TIMES[a[0]?.category] || 10) - (PREP_TIMES[b[0]?.category] || 10),
  )

  const optimized: OrderItem[] = []
  sortedCategories.forEach(([, items]) => optimized.push(...items))

  return { optimized, batches: sortedCategories.map(([cat, items]) => ({ category: cat, count: items.length, totalItems: items.reduce((s, i) => s + i.quantity, 0) })) }
}

export async function GET() {
  const fifoTime = MOCK_QUEUE.reduce((sum, item) => sum + item.prepTime * item.quantity, 0)
  const { optimized, batches } = optimizeQueue(MOCK_QUEUE)

  const batchedTime = batches.reduce((sum, b) => {
    const catTime = PREP_TIMES[b.category] || 10
    return sum + catTime * Math.ceil(b.totalItems / 3)
  }, 0)

  return NextResponse.json({
    originalQueue: MOCK_QUEUE,
    optimizedQueue: optimized,
    batches,
    metrics: {
      fifoEstimate: fifoTime,
      optimizedEstimate: batchedTime,
      timeSaved: fifoTime - batchedTime,
      savingsPercent: Math.round(((fifoTime - batchedTime) / fifoTime) * 100),
    },
    algorithm: "batch_category_optimization_v1",
  })
}
