"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ChevronRight, Minus, Plus, ShoppingBag, X } from "lucide-react"
import { OrderItemOptions } from "@/components/orders/OrderItemOptions"
import { optionsSnapshotFromCart } from "@/lib/orders/order-item-options"
import { isPlaceholderImage } from "@/lib/menu/menu-display"
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock"
import type { QrCartEntry } from "@/lib/menu/qr-menu-types"

type QrMenuCartSheetProps = {
  open: boolean
  tableLabel: string
  cart: QrCartEntry[]
  cartCount: number
  cartTotal: number
  onClose: () => void
  onIncrement: (lineId: string) => void
  onDecrement: (lineId: string) => void
  onSubmit: () => void
  submitting?: boolean
}

export function QrMenuFloatingBar({
  cartCount,
  cartTotal,
  onOpen,
}: {
  cartCount: number
  cartTotal: number
  onOpen: () => void
}) {
  if (cartCount <= 0) return null
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      className="fixed inset-x-0 bottom-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <button
        type="button"
        onClick={onOpen}
        className="mx-auto flex w-full max-w-2xl items-center justify-between rounded-2xl bg-gradient-to-r from-amber-600 via-amber-600 to-orange-600 px-5 py-4 text-white shadow-2xl shadow-amber-700/35 transition active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <motion.span
            key={cartCount}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex h-8 min-w-8 items-center justify-center rounded-full bg-white/20 px-2 text-sm font-bold"
          >
            {cartCount}
          </motion.span>
          <span className="font-semibold">Warenkorb ansehen</span>
        </div>
        <div className="flex items-center gap-1">
          <motion.span
            key={cartTotal.toFixed(2)}
            initial={{ scale: 0.88, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-lg font-bold tabular-nums"
          >
            {cartTotal.toFixed(2)} €
          </motion.span>
          <ChevronRight className="h-5 w-5" />
        </div>
      </button>
    </motion.div>
  )
}

function lineBreakdown(item: QrCartEntry) {
  const extrasTotal = item.extras.reduce((s, e) => s + e.price, 0)
  const base = item.variant?.price ?? item.basePrice
  return { base, extrasTotal, unit: item.price }
}

export function QrMenuCartSheet({
  open,
  tableLabel,
  cart,
  cartCount,
  cartTotal,
  onClose,
  onIncrement,
  onDecrement,
  onSubmit,
  submitting,
}: QrMenuCartSheetProps) {
  const subtotal = cartTotal
  useBodyScrollLock(open)

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
            className="relative flex max-h-[88vh] flex-col rounded-t-[28px] bg-white shadow-2xl dark:bg-neutral-950"
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-amber-200 dark:bg-amber-800" />
            <div className="flex items-center justify-between border-b border-amber-100 px-5 py-4 dark:border-amber-900/30">
              <div>
                <h2 className="text-lg font-bold text-amber-950 dark:text-white">Ihre Bestellung</h2>
                <p className="text-xs text-amber-800/60 dark:text-amber-300/60">Tisch {tableLabel}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-amber-800 transition hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <ShoppingBag className="h-14 w-14 text-amber-200 dark:text-amber-800" />
                <p className="text-amber-800 dark:text-amber-400">Ihr Warenkorb ist leer</p>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  <AnimatePresence initial={false}>
                    {cart.map((item) => {
                      const { base, extrasTotal } = lineBreakdown(item)
                      return (
                        <motion.div
                          key={item.lineId}
                          layout
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12, height: 0 }}
                          className="flex gap-3 rounded-2xl border border-amber-100 bg-amber-50/50 p-3 dark:border-amber-900/25 dark:bg-neutral-900/80"
                        >
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-amber-100 dark:bg-neutral-800">
                            {isPlaceholderImage(item.image) ? (
                              <div className="flex h-full items-center justify-center text-2xl">🍽️</div>
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.image}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-amber-950 dark:text-white">{item.name}</p>
                            {item.name_ar ? (
                              <p className="truncate text-[11px] text-amber-800/55 dark:text-amber-300/55" dir="rtl">
                                {item.name_ar}
                              </p>
                            ) : null}
                            <OrderItemOptions
                              options_snapshot={optionsSnapshotFromCart({
                                variant: item.variant,
                                extras: item.extras,
                                customerNote: item.note,
                              })}
                              size="sm"
                            />
                            <div className="mt-1 space-y-0.5 text-[10px] text-amber-700/65 dark:text-amber-400/65">
                              <p>Basis: {base.toFixed(2)} €{extrasTotal > 0 ? ` · Extras: +${extrasTotal.toFixed(2)} €` : ""}</p>
                              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                                {item.price.toFixed(2)} € × {item.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end justify-between">
                            <motion.p
                              key={`${item.lineId}-${(item.price * item.quantity).toFixed(2)}`}
                              initial={{ scale: 0.85, opacity: 0.5 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="text-sm font-bold tabular-nums text-amber-950 dark:text-white"
                            >
                              {(item.price * item.quantity).toFixed(2)} €
                            </motion.p>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onDecrement(item.lineId)}
                                aria-label="Menge verringern"
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 text-amber-700 transition active:scale-90 dark:border-amber-700"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <motion.span
                                key={`${item.lineId}-qty-${item.quantity}`}
                                initial={{ scale: 0.7, opacity: 0.5 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-6 text-center text-sm font-bold tabular-nums"
                              >
                                {item.quantity}
                              </motion.span>
                              <button
                                type="button"
                                onClick={() => onIncrement(item.lineId)}
                                aria-label="Menge erhöhen"
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-white transition active:scale-90"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>

                <div className="border-t border-amber-100 px-5 py-4 dark:border-amber-900/30">
                  <div className="mb-3 space-y-1 text-sm">
                    <div className="flex justify-between text-amber-800/80 dark:text-amber-300/80">
                      <span>Zwischensumme</span>
                      <motion.span key={`sub-${subtotal.toFixed(2)}`} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} className="tabular-nums">
                        {subtotal.toFixed(2)} €
                      </motion.span>
                    </div>
                    <div className="flex justify-between font-bold text-amber-950 dark:text-white">
                      <span>Gesamt</span>
                      <motion.span
                        key={`tot-${cartTotal.toFixed(2)}`}
                        initial={{ scale: 0.9, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-xl tabular-nums"
                      >
                        {cartTotal.toFixed(2)} €
                      </motion.span>
                    </div>
                  </div>
                  <p className="mb-3 text-[11px] text-amber-800/50 dark:text-amber-400/50">
                    {cartCount} {cartCount === 1 ? "Artikel" : "Artikel"} · Endpreis inkl. Varianten & Extras
                  </p>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={onSubmit}
                    className="w-full rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 py-4 text-lg font-bold text-white shadow-lg transition active:scale-[0.98] disabled:opacity-60"
                  >
                    {submitting ? "Wird gesendet…" : `Bestellen — ${cartTotal.toFixed(2)} €`}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
