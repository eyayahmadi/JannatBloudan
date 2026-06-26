"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Clock, ShoppingCart, UtensilsCrossed } from "lucide-react"
import { SITE } from "@/lib/site-config"
import type { OrderStatus } from "@/lib/hooks/useRealtimeOrders"
import { qrOrderEtaLabel, qrOrderStatusLabel } from "@/lib/menu/qr-order-eta"
import { cn } from "@/lib/utils"

type QrMenuHeroProps = {
  tableId: string
  tableLabel: string
  cartCount: number
  onCartOpen: () => void
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
  activeOrder,
}: QrMenuHeroProps) {
  const eta = activeOrder ? qrOrderEtaLabel(activeOrder.status) : null

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden"
    >
      <div
        className="relative px-4 pb-6 pt-4 text-white"
        style={{
          background: "linear-gradient(145deg, #1f1a14 0%, #5c1824 48%, #8b6914 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 90% -10%, rgba(217,183,106,0.5), transparent 55%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url(${SITE.images.mezze})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="relative mx-auto max-w-2xl">
          <div className="mb-5 flex items-center justify-between">
            <Link
              href={`/table/${tableId}`}
              className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm backdrop-blur transition hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Zurück</span>
            </Link>
            <button
              type="button"
              onClick={onCartOpen}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur transition hover:bg-white/25 active:scale-95"
              aria-label="Warenkorb öffnen"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 ? (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-amber-950"
                >
                  {cartCount}
                </motion.span>
              ) : null}
            </button>
          </div>

          <div className="flex items-start gap-4">
            <motion.div
              whileHover={{ scale: 1.04, rotate: -2 }}
              className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/placeholder-logo.svg" alt="" className="h-10 w-10 opacity-90" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-100/75">
                Authentic Syrian Cuisine
              </p>
              <h1 className="font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                {SITE.name}
              </h1>
              <p className="mt-1 text-sm text-amber-100/80" dir="rtl">
                جنّة بلودان
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <UtensilsCrossed className="h-3.5 w-3.5 text-amber-200" />
              Tisch {tableLabel}
            </span>
            {activeOrder ? (
              <>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur",
                    activeOrder.status === "preparing"
                      ? "bg-amber-400/25 text-amber-100"
                      : activeOrder.status === "ready"
                        ? "bg-emerald-400/25 text-emerald-100"
                        : "bg-white/15 text-white",
                  )}
                >
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                  {qrOrderStatusLabel(activeOrder.status)}
                </span>
                {eta ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/20 px-3 py-1.5 text-xs text-amber-100/90">
                    <Clock className="h-3.5 w-3.5" />
                    {eta}
                  </span>
                ) : null}
              </>
            ) : (
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-amber-100/70">
                Bereit zu bestellen
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  )
}
