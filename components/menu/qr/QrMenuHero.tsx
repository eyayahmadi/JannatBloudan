"use client"

import Link from "next/link"
import { ArrowLeft, Clock, Search, ShoppingCart } from "lucide-react"
import { BloudanLogoMark } from "@/components/site/BloudanLogoMark"
import type { OrderStatus } from "@/lib/hooks/useRealtimeOrders"
import { qrOrderEtaLabel, qrOrderStatusLabel } from "@/lib/menu/qr-order-eta"
import { cn } from "@/lib/utils"

type QrMenuHeroProps = {
  tableId: string
  tableLabel: string
  cartCount: number
  onCartOpen: () => void
  onSearchOpen?: () => void
  activeOrder?: {
    order_number: string
    status: OrderStatus
  } | null
}

export function QrMenuHero({
  tableId,
  tableLabel,
  cartCount,
  onCartOpen,
  onSearchOpen,
  activeOrder,
}: QrMenuHeroProps) {
  const eta = activeOrder ? qrOrderEtaLabel(activeOrder.status) : null
  const tableStatus = activeOrder
    ? qrOrderStatusLabel(activeOrder.status)
    : "Bereit zu bestellen"

  return (
    <header className="relative z-0 shrink-0 overflow-hidden">
      <div
        className="relative px-4 pb-8 pt-3 text-white sm:pb-10"
        style={{
          background: "linear-gradient(160deg, #14100c 0%, #4a1520 42%, #6b4f12 78%, #2a1f14 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,175,55,0.22), transparent 60%)",
          }}
        />

        <div className="relative mx-auto max-w-2xl">
          <div className="mb-6 flex items-center justify-between gap-2">
            <Link
              href={`/table/${tableId}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/12 transition-colors hover:bg-white/20 active:scale-[0.98]"
              aria-label="Zurück"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex shrink-0 items-center gap-2 pr-[4.25rem] sm:pr-[4.75rem]">
              {onSearchOpen ? (
                <button
                  type="button"
                  onClick={onSearchOpen}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25 active:scale-[0.98]"
                  aria-label="Suchen"
                >
                  <Search className="h-5 w-5" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={onCartOpen}
                className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25 active:scale-[0.98]"
                aria-label="Warenkorb"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-amber-950">
                    {cartCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="mb-5 h-28 w-28 sm:h-32 sm:w-32">
              <BloudanLogoMark
                size={0}
                variant="inline"
                pulse
                loop
                withPhotoBack
                className="h-full w-full rounded-3xl border border-amber-300/25 bg-black/20 shadow-2xl shadow-black/30"
              />
            </div>

            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Jannat Bloudan
            </h1>
            <p className="mt-1 text-lg text-amber-100/90 sm:text-xl" dir="rtl">
              جنة بلودان
            </p>

            <p className="mt-4 text-sm font-medium tracking-wide text-amber-100/80">
              Authentic Syrian Cuisine
            </p>
            <p className="mt-0.5 text-sm text-amber-100/65" dir="rtl">
              المذاق السوري الأصيل
            </p>

            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-medium text-amber-50/95">
              <span>Tisch {tableLabel}</span>
              <span className="text-amber-200/50">·</span>
              <span
                className={cn(
                  activeOrder?.status === "preparing" && "text-amber-200",
                  activeOrder?.status === "ready" && "text-emerald-200",
                )}
              >
                {tableStatus}
              </span>
              {eta ? (
                <>
                  <span className="text-amber-200/50">·</span>
                  <span className="inline-flex items-center gap-1 text-amber-100/80">
                    <Clock className="h-3.5 w-3.5" />
                    {eta}
                  </span>
                </>
              ) : null}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
