"use client"

import { useMemo } from "react"

type MenuItem = {
  id: number
  name: string
  price: number
  image: string
  category: string
  rating: number
  reviews: number
  isAvailable: boolean
}

const STORAGE_KEY = "jb-viewed-items"

export function trackItemView(itemId: number) {
  if (typeof window === "undefined") return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const viewed: number[] = raw ? JSON.parse(raw) : []
    if (!viewed.includes(itemId)) {
      viewed.push(itemId)
      if (viewed.length > 30) viewed.shift()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(viewed))
    }
  } catch {
    // ignore
  }
}

export function useRecommendations(
  allItems: MenuItem[],
  cartIds: number[],
  limit = 4,
) {
  return useMemo(() => {
    let viewedIds: number[] = []
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        viewedIds = raw ? JSON.parse(raw) : []
      } catch {
        // ignore
      }
    }

    const viewedCategories = new Set(
      allItems
        .filter((item) => viewedIds.includes(item.id))
        .map((item) => item.category),
    )

    const excluded = new Set([...cartIds, ...viewedIds])

    const candidates = allItems
      .filter((item) => item.isAvailable && !excluded.has(item.id))
      .map((item) => {
        let score = item.reviews * 0.5 + item.rating * 20
        if (viewedCategories.has(item.category)) score += 100
        return { ...item, score }
      })
      .sort((a, b) => b.score - a.score)

    return candidates.slice(0, limit)
  }, [allItems, cartIds, limit])
}
