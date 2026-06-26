"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Flame, Heart, Leaf, Minus, Plus, Sparkles, Star } from "lucide-react"
import {
  categoryPlaceholderEmoji,
  formatMenuPriceLabel,
  isPlaceholderImage,
} from "@/lib/menu/menu-display"
import { productHasTag } from "@/lib/menu/product-attributes"
import { ProductAttributeBadges } from "@/components/menu/ProductAttributeBadges"
import { isQrItemSpicy, qrDisplayRating } from "@/lib/menu/qr-menu-helpers"
import type { QrMenuItem } from "@/lib/menu/qr-menu-types"
import { cn } from "@/lib/utils"

type QrMenuProductCardProps = {
  item: QrMenuItem
  inCartQty: number
  index?: number
  isFavorite?: boolean
  onToggleFavorite?: () => void
  onOpen: () => void
  onQuickAdd: () => void
  onIncrement?: () => void
  onDecrement?: () => void
  showLineControls?: boolean
}

export function QrMenuProductCard({
  item,
  inCartQty,
  index = 0,
  isFavorite = false,
  onToggleFavorite,
  onOpen,
  onQuickAdd,
  onIncrement,
  onDecrement,
  showLineControls,
}: QrMenuProductCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const usePlaceholder = isPlaceholderImage(item.image)
  const emoji = categoryPlaceholderEmoji(item.section, item.category)
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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.35), duration: 0.35 }}
      className={cn(
        "group cursor-pointer overflow-hidden rounded-2xl border border-amber-100/90 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] dark:border-amber-900/25 dark:bg-neutral-900",
        disabled && "opacity-60",
      )}
      onClick={onOpen}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-amber-50 to-stone-100 dark:from-neutral-800 dark:to-neutral-900">
        {!usePlaceholder && !imgLoaded ? (
          <div className="absolute inset-0 animate-pulse bg-amber-100/80 dark:bg-neutral-800" />
        ) : null}
        {usePlaceholder ? (
          <div className="flex h-full w-full items-center justify-center text-5xl opacity-90 transition-transform duration-500 group-hover:scale-110">
            {emoji}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            className={cn(
              "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
              imgLoaded ? "opacity-100" : "opacity-0",
            )}
          />
        )}
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
          {item.isPopular ? (
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

      <div className="p-3.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-amber-950 dark:text-white">
          {item.name}
        </h3>
        {item.name_ar ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-amber-800/60 dark:text-amber-300/60" dir="rtl">
            {item.name_ar}
          </p>
        ) : null}
        {item.description ? (
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-amber-800/50 dark:text-amber-300/45">
            {item.description}
          </p>
        ) : null}
        <ProductAttributeBadges tags={item.tags} max={4} size="xs" className="mt-1.5" />

        <div className="mt-3 flex items-end justify-between gap-2">
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
                className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-800 transition active:scale-90 dark:bg-amber-900/40 dark:text-amber-300"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-5 text-center text-sm font-bold">{inCartQty}</span>
              <button
                type="button"
                onClick={onIncrement}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow active:scale-90"
              >
                <Plus className="h-3.5 w-3.5" />
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
              className="flex h-9 min-w-9 items-center justify-center gap-1 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 px-3 text-white shadow-md transition hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
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
