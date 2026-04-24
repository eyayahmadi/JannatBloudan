"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { deliveryApi } from "../services/deliveryApi"
import type { MenuItem, Category } from "../types"
import { MenuItemCard } from "./MenuItemCard"
import { MenuFilters } from "./MenuFilters"

interface MenuGridProps {
  restaurantId: string
  onAddToCart: (item: MenuItem) => void
}

export const MenuGrid: React.FC<MenuGridProps> = ({ restaurantId, onAddToCart }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100])

  useEffect(() => {
    loadCategories()
    loadMenuItems()
  }, [restaurantId, selectedCategory, searchQuery, dietaryFilters, priceRange])

  const loadCategories = async () => {
    try {
      const data = await deliveryApi.getCategories(restaurantId)
      setCategories(data)
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const loadMenuItems = async () => {
    try {
      setLoading(true)
      const data = await deliveryApi.getMenu({
        restaurantId,
        categoryId: selectedCategory || undefined,
        search: searchQuery || undefined,
        dietary: dietaryFilters.length > 0 ? dietaryFilters : undefined,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
      })
      setMenuItems(data.content)
    } catch (error) {
      console.error("Error loading menu:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#6b5a47] text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
          <span>Saveurs Authentiques</span>
        </div>
        <h1 className="text-5xl font-light text-[#6b5a47] tracking-tight">
          Notre <span className="font-semibold text-[#8b7355]">Menu</span>
        </h1>
        <p className="text-base text-[#9c8b7a] leading-relaxed">
          Découvrez nos plats délicieux, préparés avec des ingrédients frais et des recettes traditionnelles syriennes
        </p>
      </div>

      {/* Filters */}
      <MenuFilters
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        dietaryFilters={dietaryFilters}
        onDietaryFiltersChange={setDietaryFilters}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
      />

      {/* Menu Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[420px] bg-white/60 animate-pulse rounded-2xl border border-[#d4af37]/10" />
          ))}
        </div>
      ) : menuItems.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-[#d4af37]/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <p className="text-xl text-[#6b5a47] font-medium mb-2">Aucun plat trouvé</p>
          <p className="text-[#9c8b7a]">Essayez d'ajuster vos filtres de recherche</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item) => (
            <MenuItemCard key={item.id} item={item} onAddToCart={() => onAddToCart(item)} />
          ))}
        </div>
      )}
    </div>
  )
}
