"use client"

import type React from "react"
import type { MenuItem } from "../types"
import { Clock, Flame, ChefHat } from "lucide-react"

interface MenuItemCardProps {
  item: MenuItem
  onAddToCart: () => void
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onAddToCart }) => {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-[#e8e0d5] hover:border-[#d4af37]/40 hover:shadow-xl transition-all duration-500">
      {/* Image */}
      <div className="relative h-64 bg-[#f5f1e8] overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl || "/placeholder.svg?height=256&width=400&query=delicious syrian food"}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-16 h-16 text-[#d4af37]/20" />
          </div>
        )}

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

        <button
          onClick={onAddToCart}
          disabled={!item.isAvailable}
          className="w-full py-3 px-6 bg-[#d4af37] hover:bg-[#c9a962] text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {item.isAvailable ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Ajouter au panier
            </span>
          ) : (
            "Non disponible"
          )}
        </button>
      </div>
    </div>
  )
}
