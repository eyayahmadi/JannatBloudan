"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { Flame, Heart, Leaf, Minus, Plus, Sparkles, Star } from "lucide-react"
import { formatMenuPriceLabel } from "@/lib/menu/menu-display"
import { BADGE_GROUP_TAGS, productHasTag } from "@/lib/menu/product-attributes"
import { ProductAttributeBadges } from "@/components/menu/ProductAttributeBadges"
import { HighlightText } from "@/components/menu/HighlightText"
import { MenuProductImage } from "@/components/menu/MenuProductImage"
import { isQrItemSpicy, qrDisplayRating } from "@/lib/menu/qr-menu-helpers"
import type { QrMenuItem } from "@/lib/menu/qr-menu-types"
import { cn } from "@/lib/utils"

type QrMenuProductCardProps = {
  item: QrMenuItem
  inCartQty: number
  index?: number
  isFavorite?: boolean
  query?: string
  onToggleFavorite?: () => void
  onOpen: () => void
  onQuickAdd: () => void
  onIncrement?: () => void
  onDecrement?: () => void
  showLineControls?: boolean
}

function QrMenuProductCardInner({
  item,
  inCartQty,
  isFavorite = false,
  query,
  onToggleFavorite,
  onOpen,
  onQuickAdd,
  onIncrement,
  onDecrement,
  showLineControls,
}: QrMenuProductCardProps) {
  const priceLabel = formatMenuPriceLabel({
    price: item.price,
    hasVariants: item.hasVariants,
    variants: item.variants,
    isCustomizable: item.isCustomizable,
  })
  const rating = qrDisplayRating(item)
  const needsSheet = item.isCustomizable || item.hasVariants
  const disabled = !item.canOrder
  const blockLabel = item.unavailableLabel ?? (item.soldOut ? "Ausverkauft" : null)

  return (
    <motion.article
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-amber-100/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] dark:border-amber-900/25 dark:bg-neutral-900",
        disabled && "opacity-60",
      )}
      onClick={onOpen}
    >
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden">
        <MenuProductImage
          src={item.image}
          alt={item.name}
          section={item.section}
          category={item.category}
          className="h-full w-full"
          emojiFallback
        />
        {onToggleFavorite ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite()
            }}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/50"
            aria-label={isFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten"}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-rose-400 text-rose-400")} />
          </button>
        ) : null}
        {blockLabel ? (
          <span className="absolute inset-x-2 bottom-2 rounded-full bg-black/70 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-white">
            {blockLabel}
          </span>
        ) : null}
        <div className="absolute left-2 top-2 flex max-w-[85%] flex-wrap gap-1">
          {productHasTag(item.tags, "best_seller") ? (
            <span className="rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">
              🏆 Bestseller
            </span>
          ) : productHasTag(item.tags, "popular") ? (
            <span className="rounded-full bg-amber-600/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">
              ⭐ Beliebt
            </span>
          ) : null}
          {item.isNew ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[9px] font-bold text-white shadow">
              <Sparkles className="h-2.5 w-2.5" />
              Neu
            </span>
          ) : null}
          {productHasTag(item.tags, "chef_recommendation") ? (
            <span className="rounded-full bg-violet-600/90 px-2 py-0.5 text-[9px] font-bold text-white shadow">
              👨‍🍳 Chef Choice
            </span>
          ) : null}
        </div>
        <div className="absolute bottom-2 right-2 flex flex-wrap justify-end gap-1">
          {productHasTag(item.tags, "vegan") ? (
            <span className="rounded-full bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white shadow" title="Vegan">
              🌱
            </span>
          ) : productHasTag(item.tags, "vegetarian") ? (
            <span className="rounded-full bg-emerald-500/90 p-1 text-white shadow" title="Vegetarisch">
              <Leaf className="h-3 w-3" />
            </span>
          ) : null}
          {isQrItemSpicy(item) ? (
            <span className="rounded-full bg-red-500/90 p-1 text-white shadow" title="Scharf">
              <Flame className="h-3 w-3" />
            </span>
          ) : productHasTag(item.tags, "not_spicy") ? (
            <span className="rounded-full bg-sky-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white shadow" title="Nicht scharf">
              😌
            </span>
          ) : null}
          {productHasTag(item.tags, "kids_friendly") ? (
            <span className="rounded-full bg-sky-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">👶</span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-amber-950 dark:text-white" dir="ltr">
          <HighlightText text={item.name} query={query} />
        </h3>
        {item.name_ar ? (
          <p
            className="mt-0.5 line-clamp-2 break-words text-xs leading-snug text-amber-800/60 dark:text-amber-300/60"
            dir="rtl"
          >
            <HighlightText text={item.name_ar} query={query} />
          </p>
        ) : null}
        {item.description ? (
          <p
            className="mt-1.5 line-clamp-3 text-[11px] leading-relaxed text-amber-800/50 dark:text-amber-300/45"
            dir="ltr"
          >
            {item.description}
          </p>
        ) : null}
        {item.description_ar ? (
          <p
            className="mt-1 line-clamp-3 text-[10px] leading-relaxed text-amber-800/45 dark:text-amber-300/40"
            dir="rtl"
          >
            {item.description_ar}
          </p>
        ) : null}
        <ProductAttributeBadges
          tags={item.tags}
          exclude={BADGE_GROUP_TAGS}
          max={5}
          size="xs"
          className="mt-1.5"
        />

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            {rating != null ? (
              <p className="mb-0.5 flex items-center gap-0.5 text-[10px] font-medium text-amber-700/80 dark:text-amber-400/80">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {rating.toFixed(1)}
              </p>
            ) : null}
            <span className="text-base font-bold tabular-nums text-amber-700 dark:text-amber-400">
              {priceLabel}
            </span>
          </div>

          {showLineControls && onIncrement && onDecrement ? (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={onDecrement}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-800 transition active:scale-90 dark:bg-amber-900/40 dark:text-amber-300"
              >
                <Minus className="h-4 w-4" />
              </button>
              <motion.span
                key={inCartQty}
                initial={{ scale: 0.7, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-6 text-center text-sm font-bold tabular-nums"
              >
                {inCartQty}
              </motion.span>
              <button
                type="button"
                onClick={onIncrement}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow active:scale-90"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation()
                if (disabled) return
                if (needsSheet) onOpen()
                else onQuickAdd()
              }}
              className="flex h-10 min-w-10 items-center justify-center gap-1 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 px-3 text-white shadow-md transition hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {inCartQty > 0 && !needsSheet ? (
                <span className="text-xs font-bold">{inCartQty}</span>
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </motion.article>
  )
}

function propsEqual(a: QrMenuProductCardProps, b: QrMenuProductCardProps) {
  return (
    a.item === b.item &&
    a.inCartQty === b.inCartQty &&
    a.isFavorite === b.isFavorite &&
    a.query === b.query &&
    a.showLineControls === b.showLineControls
  )
}

export const QrMenuProductCard = memo(QrMenuProductCardInner, propsEqual)
