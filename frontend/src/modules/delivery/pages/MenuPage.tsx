"use client"

import type React from "react"
import { useState } from "react"
import { MenuGrid } from "../components/MenuGrid"
import { Cart } from "../components/Cart"
import type { MenuItem, CartItem } from "../types"

export const MenuPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)

  // Restaurant ID would come from route params or context
  const restaurantId = "demo-restaurant-id"

  const handleAddToCart = (item: MenuItem) => {
    // Check if item already exists in cart
    const existingItemIndex = cartItems.findIndex((cartItem) => cartItem.menuItem.id === item.id)

    if (existingItemIndex >= 0) {
      // Update quantity
      const newItems = [...cartItems]
      newItems[existingItemIndex].quantity += 1
      newItems[existingItemIndex].subtotal = newItems[existingItemIndex].quantity * item.price
      setCartItems(newItems)
    } else {
      // Add new item
      setCartItems([
        ...cartItems,
        {
          menuItem: item,
          quantity: 1,
          addons: [],
          subtotal: item.price,
        },
      ])
    }
  }

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId)
      return
    }

    const newItems = cartItems.map((item) => {
      if (item.menuItem.id === itemId) {
        return {
          ...item,
          quantity,
          subtotal: quantity * item.menuItem.price,
        }
      }
      return item
    })
    setCartItems(newItems)
  }

  const handleRemoveItem = (itemId: string) => {
    setCartItems(cartItems.filter((item) => item.menuItem.id !== itemId))
  }

  const handleCheckout = () => {
    // Navigate to checkout page
    console.log("Proceeding to checkout", cartItems)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#faf8f3] to-[#ebe5d9]">
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-[#faf8f3]/95 border-b border-[#d4af37]/10 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-11 h-11 rounded-lg overflow-hidden shadow-md">
                <img src="/logo-jannat.png" alt="Jannat Baloudan" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[#6b5a47]">Menu Jannat Baloudan</h1>
                <p className="text-xs text-[#9c8b7a]">Cuisine Syrienne Authentique</p>
              </div>
            </div>
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative px-6 py-2.5 bg-[#d4af37] hover:bg-[#c9a962] text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300"
            >
              Panier
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#6b7c3a] text-white rounded-full text-xs flex items-center justify-center shadow-md">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Grid */}
          <div className="lg:col-span-2">
            <MenuGrid restaurantId={restaurantId} onAddToCart={handleAddToCart} />
          </div>

          {/* Cart Sidebar */}
          <div className={`lg:block ${showCart ? "block" : "hidden"}`}>
            <div className="sticky top-28">
              <Cart
                items={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={handleCheckout}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
