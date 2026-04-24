"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingBag, X } from "lucide-react"

export function CartAbandonNudge() {
  const [show, setShow] = useState(false)
  const [itemCount, setItemCount] = useState(0)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("delivery-cart")
      if (!raw) return
      const parsed = JSON.parse(raw)
      const count = parsed?.items?.length ?? 0
      if (count > 0) {
        setItemCount(count)
        setTimeout(() => setShow(true), 2000)
      }
    } catch {
      // ignore
    }
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-24 right-5 z-40 animate-slide-up">
      <div className="flex items-center gap-3 rounded-2xl border border-amber-200/60 bg-white/95 px-5 py-3.5 shadow-xl backdrop-blur-md dark:border-white/15 dark:bg-stone-900/95">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
            {itemCount} article{itemCount > 1 ? "s" : ""} dans votre panier
          </p>
          <Link
            href="/delivery"
            className="text-xs font-medium text-orange-700 hover:underline dark:text-orange-400"
          >
            Reprendre ma commande →
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setShow(false)}
          className="ml-1 rounded-full p-1 text-amber-800/60 transition hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-white/10"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
