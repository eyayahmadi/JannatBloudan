"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"

type Props = {
  itemCount: number
  total: number
  onOpen: () => void
}

export function MobileCartBar({ itemCount, total, onOpen }: Props) {
  if (itemCount === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-amber-200/50 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.1)] backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-stone-900/95">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-2 text-sm font-medium text-amber-950 dark:text-amber-100"
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white">
              {itemCount}
            </span>
          </div>
          <span>{total.toFixed(2)}€</span>
        </button>
        <Link
          href="/delivery/checkout"
          className="rounded-full bg-gradient-to-r from-amber-800 to-orange-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition active:scale-[0.97]"
        >
          Commander
        </Link>
      </div>
    </div>
  )
}
