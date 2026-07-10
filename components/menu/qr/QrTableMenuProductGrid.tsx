"use client"

import type { QrMenuItem } from "@/lib/menu/qr-menu-types"
import { buildCartLineId } from "@/lib/menu/cart-line"
import { useQrTableMenu } from "@/components/menu/qr/QrTableMenuProvider"
import { QrTableMenuProductCell } from "@/components/menu/qr/QrTableMenuProductCell"

export function QrTableMenuProductGrid({ items }: { items: QrMenuItem[] }) {
  const {
    cart,
    favoriteIds,
    handleToggleFavorite,
    openDetail,
    handleQuickAdd,
    increment,
    decrement,
  } = useQrTableMenu()

  if (items.length === 0) return null

  return (
    <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:gap-4">
      {items.map((item) => {
        const line =
          !item.isCustomizable && !item.hasVariants
            ? cart.find((c) => c.lineId === buildCartLineId(item.id, [], null))
            : null
        const customQty =
          item.isCustomizable || item.hasVariants
            ? cart.filter((c) => c.productId === item.id).reduce((s, c) => s + c.quantity, 0)
            : 0

        return (
          <div key={item.id} className="h-full min-h-0">
            <QrTableMenuProductCell
              item={item}
              query=""
              inCartQty={line?.quantity ?? customQty}
              isFavorite={favoriteIds.includes(item.id)}
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
