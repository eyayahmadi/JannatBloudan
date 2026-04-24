"use client"

import type React from "react"
import type { CartItem } from "../types"

interface CartProps {
  items: CartItem[]
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  onCheckout: () => void
}

export const Cart: React.FC<CartProps> = ({ items, onUpdateQuantity, onRemoveItem, onCheckout }) => {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const deliveryFee = 3.99
  const tax = subtotal * 0.1
  const total = subtotal + deliveryFee + tax

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#e8e0d5] p-8 text-center shadow-sm">
        <svg className="w-16 h-16 mx-auto mb-4 text-[#9c8b7a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-[#6b5a47] mb-2">Votre panier est vide</h3>
        <p className="text-[#9c8b7a]">Ajoutez des plats pour commencer votre commande</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e8e0d5] overflow-hidden shadow-md">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#e8e0d5]">
        <h2 className="text-xl font-bold text-[#6b5a47]">Votre panier</h2>
        <p className="text-sm text-[#9c8b7a]">{items.length} article(s)</p>
      </div>

      {/* Items */}
      <div className="divide-y divide-[#e8e0d5] max-h-96 overflow-y-auto">
        {items.map((item, index) => (
          <div key={index} className="p-6">
            <div className="flex gap-4">
              {/* Image */}
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#f5f1e8] flex-shrink-0 border border-[#e8e0d5]">
                {item.menuItem.imageUrl ? (
                  <img
                    src={item.menuItem.imageUrl || "/placeholder.svg"}
                    alt={item.menuItem.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs text-[#9c8b7a]">No img</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#6b5a47] mb-1">{item.menuItem.name}</h3>

                {item.variantName && <p className="text-sm text-[#9c8b7a]">Taille: {item.variantName}</p>}

                {item.addons.length > 0 && (
                  <p className="text-sm text-[#9c8b7a]">+ {item.addons.map((a) => a.name).join(", ")}</p>
                )}

                {item.specialInstructions && (
                  <p className="text-sm text-[#9c8b7a] italic mt-1">Note: {item.specialInstructions}</p>
                )}

                {/* Quantity Controls */}
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => onUpdateQuantity(item.menuItem.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="w-8 h-8 rounded-full bg-[#f5f1e8] text-[#6b5a47] hover:bg-[#ebe5d9] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border border-[#e8e0d5] transition-colors"
                  >
                    -
                  </button>
                  <span className="text-[#6b5a47] font-medium w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.menuItem.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-[#f5f1e8] text-[#6b5a47] hover:bg-[#ebe5d9] flex items-center justify-center border border-[#e8e0d5] transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price and Remove */}
              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => onRemoveItem(item.menuItem.id)}
                  className="text-[#9c8b7a] hover:text-[#d4af37] transition-colors"
                  aria-label="Retirer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <span className="text-lg font-bold text-[#d4af37]">{item.subtotal.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="px-6 py-4 bg-[#f5f1e8]/50 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#9c8b7a]">Sous-total</span>
          <span className="text-[#6b5a47]">{subtotal.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#9c8b7a]">Frais de livraison</span>
          <span className="text-[#6b5a47]">{deliveryFee.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#9c8b7a]">TVA (10%)</span>
          <span className="text-[#6b5a47]">{tax.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-[#e8e0d5]">
          <span className="text-[#6b5a47]">Total</span>
          <span className="text-[#d4af37]">{total.toFixed(2)} €</span>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="px-6 py-4">
        <button
          onClick={onCheckout}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-[#d4af37] to-[#c9a962] text-white rounded-xl font-semibold hover:from-[#c9a962] hover:to-[#b89850] transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
        >
          <span>Commander maintenant</span>
          <svg
            className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
