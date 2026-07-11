"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Minus, Plus, X } from "lucide-react"
import { formatMenuPriceLabel } from "@/lib/menu/menu-display"
import { ProductAttributeBadges } from "@/components/menu/ProductAttributeBadges"
import { MenuProductImage } from "@/components/menu/MenuProductImage"
import {
  calcUnitPrice,
  formatVariantLabel,
  type CartExtra,
  type CartVariant,
} from "@/lib/menu/cart-line"
import { getQrRecommendations } from "@/lib/menu/qr-recommendations"
import type { QrMenuItem } from "@/lib/menu/qr-menu-types"
import { useMenuModalLifecycle } from "@/lib/hooks/useMenuModalLifecycle"
import { cn } from "@/lib/utils"

type QrProductDetailSheetProps = {
  product: QrMenuItem | null
  catalog: QrMenuItem[]
  oftenOrderedWith: Record<string, string[]>
  open: boolean
  onClose: () => void
  onConfirm: (payload: {
    productId: string
    name: string
    name_ar?: string | null
    image: string
    basePrice: number
    unitPrice: number
    variant: CartVariant | null
    extras: CartExtra[]
    quantity: number
    note?: string
  }) => void
  onOpenProduct: (item: QrMenuItem) => void
}

export function QrProductDetailSheet({
  product,
  catalog,
  oftenOrderedWith,
  open,
  onClose,
  onConfirm,
  onOpenProduct,
}: QrProductDetailSheetProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set())
  const [quantity, setQuantity] = useState(1)
  const [customerNote, setCustomerNote] = useState("")
  const resetProductIdRef = useRef<string | null>(null)

  useMenuModalLifecycle(open)

  useEffect(() => {
    setPortalRoot(document.body)
  }, [])

  const hasVariants = (product?.variants.length ?? 0) > 0
  const hasExtras = (product?.modifiers.length ?? 0) > 0
  const productId = product?.id ?? null

  useEffect(() => {
    if (!open || !productId || !product) {
      if (!open) resetProductIdRef.current = null
      return
    }
    if (resetProductIdRef.current === productId) return
    resetProductIdRef.current = productId
    setSelectedVariantId(product.variants[0]?.id ?? null)
    setSelectedExtras(new Set())
    setQuantity(1)
    setCustomerNote("")
  }, [open, productId, product])

  const selectedVariant = useMemo((): CartVariant | null => {
    if (!product || !selectedVariantId) return null
    const v = product.variants.find((x) => x.id === selectedVariantId)
    if (!v) return null
    return { id: v.id, name: v.name, name_ar: v.name_ar, price: v.price }
  }, [product, selectedVariantId])

  const extrasList = useMemo((): CartExtra[] => {
    if (!product) return []
    return product.modifiers
      .filter((m) => selectedExtras.has(m.id))
      .map((m) => ({ id: m.id, name: m.name, name_ar: m.name_ar, price: m.price }))
  }, [product, selectedExtras])

  const unitPrice = product ? calcUnitPrice(product.price, extrasList, selectedVariant) : 0
  const lineTotal = unitPrice * quantity
  const canConfirm = product
    ? (!hasVariants || selectedVariantId != null) && product.canOrder
    : false

  const recommendations = useMemo(() => {
    if (!product) return []
    return getQrRecommendations(product, catalog, oftenOrderedWith, 4)
  }, [product, catalog, oftenOrderedWith])

  const toggleExtra = (id: string) => {
    setSelectedExtras((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!portalRoot || !open || !product) return null

  const priceFrom = formatMenuPriceLabel({
    price: product.price,
    hasVariants: product.hasVariants,
    variants: product.variants,
    isCustomizable: product.isCustomizable && !hasVariants,
    currency: " €",
  })

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-product-detail-title"
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div className="menu-sheet-panel relative flex max-h-[92vh] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl dark:bg-neutral-950">
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-amber-200/80 dark:bg-amber-800" />

        <div className="relative aspect-[4/3] max-h-[300px] w-full shrink-0 overflow-hidden">
          <MenuProductImage
            src={product.image}
            alt={product.name}
            section={product.section}
            category={product.category}
            className="h-full w-full"
            emojiFallback
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/55"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {!product.canOrder ? (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-800 dark:bg-red-950/40 dark:text-red-200">
              {product.unavailableLabel ?? "Ausverkauft — derzeit nicht bestellbar"}
            </p>
          ) : null}

          <div className="mb-4">
            <h2
              id="qr-product-detail-title"
              className="text-xl font-bold leading-tight text-amber-950 dark:text-white"
              dir="ltr"
            >
              {product.name}
            </h2>
            {product.name_ar ? (
              <p className="mt-1 text-base text-amber-800/65 dark:text-amber-300/65" dir="rtl">
                {product.name_ar}
              </p>
            ) : null}
            <p className="mt-2 text-sm leading-relaxed text-amber-800/70 dark:text-amber-300/60" dir="ltr">
              {product.description || "Hausgemachte Spezialität von Jannat Bloudan."}
            </p>
            {product.description_ar ? (
              <p className="mt-2 text-sm leading-relaxed text-amber-800/60 dark:text-amber-300/55" dir="rtl">
                {product.description_ar}
              </p>
            ) : null}
            {product.tags.length > 0 ? (
              <ProductAttributeBadges tags={product.tags} size="sm" className="mt-3" />
            ) : null}
          </div>

          {hasVariants ? (
            <section className="mb-5">
              <h3 className="mb-2.5 text-sm font-semibold text-amber-950 dark:text-white">Größe wählen</h3>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((v) => {
                  const active = selectedVariantId === v.id
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={cn(
                        "rounded-2xl border px-3 py-3 text-left transition active:scale-[0.98]",
                        active
                          ? "border-amber-500 bg-amber-50 ring-2 ring-amber-400/40 dark:bg-amber-900/25"
                          : "border-amber-100 bg-white hover:border-amber-300 dark:border-amber-900/30 dark:bg-neutral-900",
                      )}
                    >
                      <p className="text-sm font-semibold text-amber-950 dark:text-white">{v.name}</p>
                      {v.name_ar ? (
                        <p className="text-xs text-amber-800/55" dir="rtl">
                          {v.name_ar}
                        </p>
                      ) : null}
                      <p className="mt-1 text-sm font-bold text-amber-700 dark:text-amber-400">
                        {v.price.toFixed(2)} €
                      </p>
                    </button>
                  )
                })}
              </div>
            </section>
          ) : null}

          {hasExtras ? (
            <section className="mb-5">
              <h3 className="mb-2.5 text-sm font-semibold text-amber-950 dark:text-white">Extras wählen</h3>
              <div className="flex flex-wrap gap-2">
                {product.modifiers.map((mod) => {
                  const active = selectedExtras.has(mod.id)
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => toggleExtra(mod.id)}
                      className={cn(
                        "rounded-2xl border px-3 py-2.5 text-left transition active:scale-[0.97]",
                        active
                          ? "border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 ring-1 ring-amber-400/50 dark:from-amber-900/30 dark:to-orange-900/20"
                          : "border-amber-100 bg-white dark:border-amber-900/30 dark:bg-neutral-900",
                      )}
                    >
                      <p className="text-xs font-semibold text-amber-950 dark:text-white">{mod.name}</p>
                      {mod.name_ar ? (
                        <p className="text-[10px] text-amber-800/50" dir="rtl">
                          {mod.name_ar}
                        </p>
                      ) : null}
                      <p className="mt-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                        +{mod.price.toFixed(2)} €
                      </p>
                    </button>
                  )
                })}
              </div>
            </section>
          ) : null}

          {recommendations.length > 0 ? (
            <section className="mb-5">
              <h3 className="mb-2.5 text-sm font-semibold text-amber-950 dark:text-white">Passt dazu</h3>
              <div className="flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {recommendations.map((rec) => (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => onOpenProduct(rec)}
                    className="w-28 shrink-0 overflow-hidden rounded-xl border border-amber-100 bg-white text-left shadow-sm transition hover:shadow-md active:scale-[0.97] dark:border-amber-900/30 dark:bg-neutral-900"
                  >
                    <div className="flex aspect-square items-center justify-center overflow-hidden bg-amber-50 dark:bg-neutral-800">
                      <MenuProductImage
                        src={rec.image}
                        alt={rec.name}
                        section={rec.section}
                        category={rec.category}
                        className="h-full w-full"
                        emojiFallback
                      />
                    </div>
                    <div className="p-2">
                      <p className="line-clamp-2 text-[10px] font-semibold leading-tight text-amber-950 dark:text-white">
                        {rec.name}
                      </p>
                      <p className="mt-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        {rec.price.toFixed(2)} €
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-semibold text-amber-950 dark:text-white">
              Hinweis (optional)
            </label>
            <textarea
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="z. B. ohne Zwiebeln, extra Knoblauch, weniger scharf…"
              rows={2}
              maxLength={200}
              className="w-full resize-none rounded-xl border border-amber-100 bg-white px-3 py-2 text-sm text-amber-950 placeholder:text-amber-800/40 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 dark:border-amber-900/40 dark:bg-neutral-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-semibold text-amber-950 dark:text-white">Menge</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 text-amber-800 transition active:scale-90 dark:border-amber-800"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center text-lg font-bold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-600 text-white transition active:scale-90"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-amber-100 px-5 py-4 dark:border-amber-900/30">
          {selectedVariant ? (
            <p className="mb-1 text-xs text-amber-800/60 dark:text-amber-400/60">
              {formatVariantLabel(selectedVariant)}
              {extrasList.length > 0 ? ` · ${extrasList.map((e) => `+ ${e.name}`).join(", ")}` : ""}
            </p>
          ) : null}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-amber-800/70 dark:text-amber-300/70">
              {hasVariants || hasExtras ? "Gesamt" : priceFrom}
            </span>
            <span className="text-2xl font-bold tabular-nums text-amber-950 dark:text-white">
              {lineTotal.toFixed(2)} €
            </span>
          </div>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => {
              if (!canConfirm) return
              onConfirm({
                productId: product.id,
                name: product.name,
                name_ar: product.name_ar,
                image: product.image,
                basePrice: product.price,
                unitPrice,
                variant: selectedVariant,
                extras: extrasList,
                quantity,
                note: customerNote.trim() || undefined,
              })
              onClose()
            }}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 py-4 text-center text-base font-bold text-white shadow-lg shadow-amber-600/25 transition hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
          >
            {!product.canOrder
              ? product.unavailableLabel ?? "Ausverkauft"
              : `In den Warenkorb — ${lineTotal.toFixed(2)} €`}
          </button>
        </div>
      </div>
    </div>,
    portalRoot,
  )
}
