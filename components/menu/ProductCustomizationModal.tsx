"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Minus, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
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
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set())
  const [quantity, setQuantity] = useState(1)
  const resetProductIdRef = useRef<string | null>(null)

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

  if (!open || !product) return null

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

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} aria-hidden />
      <div
        className={cn(
          "relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl shadow-2xl sm:rounded-3xl",
          isTable ? "bg-white dark:bg-neutral-900" : "border border-border bg-background",
        )}
      >
        <div
          className={cn(
            "flex items-start justify-between gap-3 border-b px-5 py-4",
            isTable ? "border-amber-100 dark:border-amber-900/30" : "border-border",
          )}
        >
          <div className="min-w-0">
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
            {hasVariants && selectedVariant ? (
              <p className={cn("mt-1 text-sm font-semibold", isTable ? "text-amber-700 dark:text-amber-400" : "text-foreground")}>
                {unitPrice.toFixed(2)} €
              </p>
            ) : hasExtras ? (
              <p className={cn("mt-1 text-sm", isTable ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>
                Base {product.price.toFixed(2)} €
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className={cn(
              "shrink-0 rounded-full p-1.5 transition",
              isTable
                ? "text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {hasVariants ? (
            <div>
              <p className={cn("mb-3 text-sm font-semibold", isTable ? "text-amber-950 dark:text-white" : "text-foreground")}>
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
                      <p className={cn("mt-1 text-sm font-bold", isTable ? "text-amber-700 dark:text-amber-400" : "text-foreground")}>
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
              <p className={cn("mb-3 text-sm font-semibold", isTable ? "text-amber-950 dark:text-white" : "text-foreground")}>
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
                    <span className={cn("text-sm font-semibold", isTable ? "text-amber-700 dark:text-amber-400" : "text-foreground")}>
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
            "border-t px-5 py-4",
            isTable ? "border-amber-100 dark:border-amber-900/30" : "border-border",
          )}
        >
          {selectedVariant ? (
            <p className="mb-2 text-xs text-muted-foreground">
              {formatVariantLabel(selectedVariant)}
            </p>
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
  )
}
