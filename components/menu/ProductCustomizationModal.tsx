"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Minus, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useMenuModalLifecycle } from "@/lib/hooks/useMenuModalLifecycle"
import type { ProductModifier, ProductVariant } from "@/lib/menu/digital-menu-product"
import {
  calcUnitPrice,
  formatVariantLabel,
  type CartExtra,
  type CartVariant,
} from "@/lib/menu/cart-line"

export type CustomizableProduct = {
  id: string
  name: string
  name_ar: string | null
  price: number
  modifiers: ProductModifier[]
  variants: ProductVariant[]
}

type ProductCustomizationModalProps = {
  product: CustomizableProduct | null
  open: boolean
  onClose: () => void
  onConfirm: (payload: {
    productId: string
    name: string
    name_ar: string | null
    basePrice: number
    variant: CartVariant | null
    extras: CartExtra[]
    unitPrice: number
    quantity: number
  }) => void
  variant?: "table" | "default"
  addLabel?: string
}

export function ProductCustomizationModal({
  product,
  open,
  onClose,
  onConfirm,
  variant = "default",
  addLabel = "Ajouter au panier",
}: ProductCustomizationModalProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set())
  const [quantity, setQuantity] = useState(1)
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
      .map((m) => ({
        id: m.id,
        name: m.name,
        name_ar: m.name_ar,
        price: m.price,
      }))
  }, [product, selectedExtras])

  const unitPrice = product ? calcUnitPrice(product.price, extrasList, selectedVariant) : 0
  const lineTotal = unitPrice * quantity
  const canConfirm = !hasVariants || selectedVariantId != null

  if (!portalRoot || !open || !product) return null

  const isTable = variant === "table"

  const handleClose = () => {
    setSelectedVariantId(null)
    setSelectedExtras(new Set())
    setQuantity(1)
    onClose()
  }

  const toggleExtra = (id: string, checked: boolean) => {
    setSelectedExtras((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const sheetRootStyle = {
    position: "fixed" as const,
    inset: 0,
    width: "100%",
    height: "100dvh",
    zIndex: 9999,
  }

  const sheetScrollStyle = {
    overflowY: "auto" as const,
    overscrollBehavior: "contain" as const,
    WebkitOverflowScrolling: "touch" as const,
  }

  return createPortal(
    <div
      className="product-detail-sheet-root flex flex-col bg-white dark:bg-neutral-950 sm:bg-neutral-950/70"
      style={sheetRootStyle}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          "relative flex min-h-0 flex-1 flex-col sm:mx-auto sm:my-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-3xl sm:shadow-2xl",
          isTable ? "bg-white dark:bg-neutral-900" : "border border-border bg-background sm:border",
        )}
      >
        <header
          className={cn(
            "sticky top-0 z-[10010] flex shrink-0 items-center justify-between gap-3 border-b px-5 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]",
            isTable ? "border-amber-100 bg-white dark:border-amber-900/30 dark:bg-neutral-900" : "border-border bg-background",
          )}
        >
          <div className="min-w-0 flex-1">
            <h2
              className={cn(
                "text-lg font-bold leading-tight",
                isTable ? "text-amber-950 dark:text-white" : "text-foreground",
              )}
            >
              {product.name}
            </h2>
            {product.name_ar ? (
              <p className="text-sm text-muted-foreground" dir="rtl">
                {product.name_ar}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Schließen"
            className={cn(
              "flex h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 items-center justify-center rounded-full transition-colors",
              isTable
                ? "bg-amber-100 text-amber-950 hover:bg-amber-200 dark:bg-neutral-800 dark:text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            <X className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 px-5 py-4" style={sheetScrollStyle}>
          {hasVariants ? (
            <div>
              <p
                className={cn(
                  "mb-3 text-sm font-semibold",
                  isTable ? "text-amber-950 dark:text-white" : "text-foreground",
                )}
              >
                Größe wählen
              </p>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((v) => {
                  const active = selectedVariantId === v.id
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId(v.id)}
                      className={cn(
                        "rounded-xl border px-3 py-3 text-left transition",
                        active
                          ? isTable
                            ? "border-amber-500 bg-amber-50 ring-1 ring-amber-400 dark:border-amber-500 dark:bg-amber-900/30"
                            : "border-primary bg-primary/5 ring-1 ring-primary"
                          : isTable
                            ? "border-amber-100 bg-amber-50/40 hover:border-amber-300 dark:border-amber-900/30 dark:bg-neutral-800/80"
                            : "border-border/80 bg-card hover:border-border",
                      )}
                    >
                      <p className={cn("text-sm font-semibold", isTable ? "text-amber-950 dark:text-white" : "")}>
                        {v.name}
                      </p>
                      {v.name_ar ? (
                        <p className="text-xs text-muted-foreground" dir="rtl">
                          {v.name_ar}
                        </p>
                      ) : null}
                      <p
                        className={cn(
                          "mt-1 text-sm font-bold",
                          isTable ? "text-amber-700 dark:text-amber-400" : "text-foreground",
                        )}
                      >
                        {v.price.toFixed(2)} €
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {hasExtras ? (
            <div>
              <p
                className={cn(
                  "mb-3 text-sm font-semibold",
                  isTable ? "text-amber-950 dark:text-white" : "text-foreground",
                )}
              >
                Extras
              </p>
              <div className="space-y-2">
                {product.modifiers.map((mod) => (
                  <label
                    key={mod.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition",
                      isTable
                        ? "border-amber-100 bg-amber-50/50 hover:border-amber-200 dark:border-amber-900/30 dark:bg-neutral-800/80"
                        : "border-border/80 bg-card hover:border-border",
                    )}
                  >
                    <Checkbox
                      checked={selectedExtras.has(mod.id)}
                      onCheckedChange={(v) => toggleExtra(mod.id, v === true)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm font-medium", isTable ? "text-amber-950 dark:text-white" : "")}>
                        {mod.name}
                      </p>
                      {mod.name_ar ? (
                        <p className="text-xs text-muted-foreground" dir="rtl">
                          {mod.name_ar}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        isTable ? "text-amber-700 dark:text-amber-400" : "text-foreground",
                      )}
                    >
                      +{mod.price.toFixed(2)} €
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <Label className={cn("text-sm font-semibold", isTable ? "text-amber-950 dark:text-white" : "")}>
              Quantité
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "shrink-0 border-t px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
            isTable ? "border-amber-100 dark:border-amber-900/30" : "border-border",
          )}
        >
          {selectedVariant ? (
            <p className="mb-2 text-xs text-muted-foreground">{formatVariantLabel(selectedVariant)}</p>
          ) : null}
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className={isTable ? "text-amber-800 dark:text-amber-300" : "text-muted-foreground"}>Total</span>
            <span className={cn("text-lg font-bold", isTable ? "text-amber-950 dark:text-white" : "text-foreground")}>
              {lineTotal.toFixed(2)} €
            </span>
          </div>
          <Button
            type="button"
            disabled={!canConfirm}
            className={cn(
              "w-full rounded-2xl py-6 text-base font-bold",
              isTable && "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700",
            )}
            onClick={() => {
              if (!canConfirm) return
              onConfirm({
                productId: product.id,
                name: product.name,
                name_ar: product.name_ar,
                basePrice: product.price,
                variant: selectedVariant,
                extras: extrasList,
                unitPrice,
                quantity,
              })
              handleClose()
            }}
          >
            {addLabel} — {lineTotal.toFixed(2)} €
          </Button>
        </div>
        </div>
      </div>
    </div>,
    portalRoot,
  )
}
