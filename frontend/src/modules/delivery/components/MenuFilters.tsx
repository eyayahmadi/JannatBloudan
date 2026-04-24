"use client"

import type React from "react"
import type { Category } from "../types"
import { Search, Filter } from "lucide-react"

interface MenuFiltersProps {
  categories: Category[]
  selectedCategory: string | null
  onCategoryChange: (categoryId: string | null) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  dietaryFilters: string[]
  onDietaryFiltersChange: (filters: string[]) => void
  priceRange: [number, number]
  onPriceRangeChange: (range: [number, number]) => void
}

const dietaryOptions = [
  { value: "vegetarian", label: "Végétarien" },
  { value: "vegan", label: "Végan" },
  { value: "gluten-free", label: "Sans gluten" },
  { value: "dairy-free", label: "Sans lactose" },
]

export const MenuFilters: React.FC<MenuFiltersProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  dietaryFilters,
  onDietaryFiltersChange,
  priceRange,
  onPriceRangeChange,
}) => {
  const toggleDietaryFilter = (value: string) => {
    if (dietaryFilters.includes(value)) {
      onDietaryFiltersChange(dietaryFilters.filter((f) => f !== value))
    } else {
      onDietaryFiltersChange([...dietaryFilters, value])
    }
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-2xl mx-auto">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="w-5 h-5 text-[#9c8b7a]" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher un plat délicieux..."
          className="w-full px-6 py-4 pl-14 backdrop-blur-sm bg-white/80 border border-[#e8e0d5] rounded-xl text-[#6b5a47] placeholder:text-[#9c8b7a] focus:outline-none focus:border-[#d4af37] focus:shadow-md transition-all duration-300"
        />
      </div>

      {/* Categories */}
      <div className="backdrop-blur-sm bg-white/60 rounded-2xl p-6 border border-[#e8e0d5]">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-[#8b7355]" />
          <h3 className="text-sm font-semibold text-[#6b5a47]">Catégories</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onCategoryChange(null)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              selectedCategory === null
                ? "bg-[#d4af37] text-white shadow-md"
                : "bg-white text-[#6b5a47] border border-[#e8e0d5] hover:border-[#d4af37]/40 hover:shadow-sm"
            }`}
          >
            Tous
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                selectedCategory === category.id
                  ? "bg-[#d4af37] text-white shadow-md"
                  : "bg-white text-[#6b5a47] border border-[#e8e0d5] hover:border-[#d4af37]/40 hover:shadow-sm"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Dietary Filters */}
      <div className="backdrop-blur-sm bg-white/60 rounded-2xl p-6 border border-[#e8e0d5]">
        <h3 className="text-sm font-semibold text-[#6b5a47] mb-4">Préférences alimentaires</h3>
        <div className="flex flex-wrap gap-3">
          {dietaryOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => toggleDietaryFilter(option.value)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                dietaryFilters.includes(option.value)
                  ? "bg-[#6b7c3a] text-white shadow-md"
                  : "bg-white text-[#6b5a47] border border-[#e8e0d5] hover:border-[#6b7c3a]/40 hover:shadow-sm"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="backdrop-blur-sm bg-white/60 rounded-2xl p-6 border border-[#e8e0d5]">
        <h3 className="text-sm font-semibold text-[#6b5a47] mb-4">
          Prix:{" "}
          <span className="text-[#8b7355]">
            {priceRange[0]}€ - {priceRange[1]}€
          </span>
        </h3>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="100"
            value={priceRange[0]}
            onChange={(e) => onPriceRangeChange([Number(e.target.value), priceRange[1]])}
            className="flex-1 accent-[#d4af37]"
          />
          <input
            type="range"
            min="0"
            max="100"
            value={priceRange[1]}
            onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
            className="flex-1 accent-[#d4af37]"
          />
        </div>
      </div>
    </div>
  )
}
