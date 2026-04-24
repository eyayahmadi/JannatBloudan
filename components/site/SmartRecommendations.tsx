"use client"

import { ShoppingCart, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/ui/Reveal"

type RecommendedItem = {
  id: number
  name: string
  price: number
  image: string
  rating: number
}

type Props = {
  items: RecommendedItem[]
  onAdd: (item: RecommendedItem) => void
}

export function SmartRecommendations({ items, onAdd }: Props) {
  if (items.length === 0) return null

  return (
    <Reveal className="mb-8">
      <div className="rounded-2xl border border-amber-900/10 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-600" />
          <h3 className="font-display text-lg font-semibold text-amber-950 dark:text-amber-100">
            Vous aimerez aussi
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group overflow-hidden rounded-xl border border-amber-200/40 bg-white transition hover:shadow-md dark:border-white/10 dark:bg-white/5"
            >
              <img
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                className="h-28 w-full object-cover transition group-hover:scale-105"
              />
              <div className="p-3">
                <p className="text-sm font-medium text-amber-950 dark:text-amber-100 line-clamp-1">
                  {item.name}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    {item.price.toFixed(2)}€
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => onAdd(item)}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  )
}
