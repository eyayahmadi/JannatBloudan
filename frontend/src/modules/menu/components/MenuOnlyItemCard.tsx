"use client"

import type React from "react"
import type { MenuItem } from "../../delivery/types"
import { Clock, Flame } from "lucide-react"

interface MenuOnlyItemCardProps {
  item: MenuItem
}

export const MenuOnlyItemCard: React.FC<MenuOnlyItemCardProps> = ({ item }) => {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-[#e8e0d5] hover:border-[#d4af37]/40 hover:shadow-xl transition-all duration-500">
      {/* Image */}
      <div className="relative h-64 bg-[#f5f1e8] overflow-hidden">
        <img
          src={item.imageUrl || "/placeholder.svg?height=256&width=400&query=delicious food"}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />

        {!item.isAvailable && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <span className="text-[#6b5a47] font-semibold text-lg block">Non disponible</span>
              <span className="text-[#9c8b7a] text-sm">Bientôt de retour</span>
            </div>
          </div>
        )}

        {item.isFeatured && (
          <div className="absolute top-4 right-4 px-4 py-1.5 bg-[#d4af37] text-white rounded-full text-sm font-medium shadow-md">
            Populaire
          </div>
        )}

        <div className="absolute bottom-4 left-4 px-4 py-2 backdrop-blur-md bg-white/95 rounded-xl shadow-lg border border-[#d4af37]/20">
          <span className="text-2xl font-semibold text-[#8b7355]">{item.price.toFixed(2)} €</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <h3 className="font-semibold text-xl text-[#6b5a47] line-clamp-1">{item.name}</h3>

        <p className="text-sm text-[#9c8b7a] line-clamp-2 leading-relaxed">{item.description}</p>

        <div className="flex items-center gap-4">
          {item.preparationTime && (
            <div className="flex items-center gap-2 text-[#8b7355]">
              <div className="w-8 h-8 rounded-lg bg-[#f5f1e8] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-sm">{item.preparationTime} min</span>
            </div>
          )}
          {item.calories && (
            <div className="flex items-center gap-2 text-[#8b7355]">
              <div className="w-8 h-8 rounded-lg bg-[#f5f1e8] flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <span className="text-sm">{item.calories} cal</span>
            </div>
          )}
        </div>

        {/* Dietary Info */}
        {item.dietaryInfo && item.dietaryInfo.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.dietaryInfo.map((info) => (
              <span
                key={info}
                className="px-3 py-1 bg-[#6b7c3a]/10 text-[#6b7c3a] text-xs font-medium rounded-full border border-[#6b7c3a]/20"
              >
                {info}
              </span>
            ))}
          </div>
        )}

        {/* Allergens */}
        {item.allergens && item.allergens.length > 0 && (
          <p className="text-xs text-[#9c8b7a] italic">Allergènes: {item.allergens.join(", ")}</p>
        )}
      </div>
    </div>
  )
}
