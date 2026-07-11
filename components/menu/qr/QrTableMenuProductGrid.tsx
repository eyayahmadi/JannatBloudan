"use client"

import { memo, useRef } from "react"
import type { QrMenuItem } from "@/lib/menu/qr-menu-types"
import { buildCartLineId } from "@/lib/menu/cart-line"
import { useQrTableMenu } from "@/components/menu/qr/QrTableMenuProvider"
import { QrTableMenuProductCell } from "@/components/menu/qr/QrTableMenuProductCell"

type FrozenGridState = {
  items: QrMenuItem[]
  cart: ReturnType<typeof useQrTableMenu>["cart"]
  favoriteIds: string[]
}

function QrTableMenuProductGridInner({ items }: { items: QrMenuItem[] }) {
  const {
    detailItemId,
    cart,
    favoriteIds,
    handleToggleFavorite,
    openDetail,
    handleQuickAdd,
    increment,
    decrement,
  } = useQrTableMenu()

  const frozenRef = useRef<FrozenGridState>({ items, cart, favoriteIds })
  if (!detailItemId) {
    frozenRef.current = { items, cart, favoriteIds }
  }

  const display = detailItemId ? frozenRef.current : { items, cart, favoriteIds }

  if (display.items.length === 0) return null

  return (
    <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:gap-4" data-menu-scroll-list>
      {display.items.map((item) => {
        const line =
          !item.isCustomizable && !item.hasVariants
            ? display.cart.find((c) => c.lineId === buildCartLineId(item.id, [], null))
            : null
        const customQty =
          item.isCustomizable || item.hasVariants
            ? display.cart.filter((c) => c.productId === item.id).reduce((s, c) => s + c.quantity, 0)
            : 0

        return (
          <div key={item.id} className="h-full min-h-0">
            <QrTableMenuProductCell
              item={item}
              query=""
              inCartQty={line?.quantity ?? customQty}
              isFavorite={display.favoriteIds.includes(item.id)}
              showLineControls={!item.isCustomizable && !item.hasVariants && !!line}
              onToggleFavorite={handleToggleFavorite}
              onOpen={openDetail}
              onQuickAdd={handleQuickAdd}
              onIncrement={increment}
              onDecrement={decrement}
              lineId={line?.lineId ?? null}
            />
          </div>
        )
      })}
    </div>
  )
}

export const QrTableMenuProductGrid = memo(QrTableMenuProductGridInner)
