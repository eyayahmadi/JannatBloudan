"use client"

import { memo, useRef } from "react"
import type { QrMenuItem } from "@/lib/menu/qr-menu-types"
import { buildCartLineId } from "@/lib/menu/cart-line"
import { QrTableMenuProductCell } from "@/components/menu/qr/QrTableMenuProductCell"
import { useStaffTableMenu } from "@/components/menu/staff/StaffTableMenuProvider"
import { staffCartLineFromQrItem } from "@/lib/menu/staff-cart-bridge"

function StaffVisualProductGridInner({ items }: { items: QrMenuItem[] }) {
  const { detailItemId, cart, catalog, openDetail, addToCart } = useStaffTableMenu()

  const frozenRef = useRef({ items, cart })
  if (!detailItemId) {
    frozenRef.current = { items, cart }
  }
  const display = detailItemId ? frozenRef.current : { items, cart }

  if (display.items.length === 0) return null

  return (
    <div className="menu-product-grid auto-rows-fr gap-3 sm:gap-4" data-menu-scroll-list>
      {display.items.map((item) => {
        const inCart = display.cart.filter((c) => c.product.id === item.id)
        const qty = inCart.reduce((s, c) => s + c.quantity, 0)

        return (
          <div key={item.id} className="h-full min-h-0">
            <QrTableMenuProductCell
              item={item}
              query=""
              inCartQty={qty}
              isFavorite={false}
              showLineControls={false}
              lineId={inCart[0]?.lineId ?? null}
              onToggleFavorite={() => {}}
              onOpen={openDetail}
              onQuickAdd={(it) => addToCart(staffCartLineFromQrItem(it, catalog))}
              onIncrement={() => {
                addToCart(staffCartLineFromQrItem(item, catalog))
              }}
              onDecrement={() => {}}
            />
          </div>
        )
      })}
    </div>
  )
}

export const StaffVisualProductGrid = memo(StaffVisualProductGridInner)
