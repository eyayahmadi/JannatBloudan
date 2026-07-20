"use client"

import { useRef } from "react"
import { useQrTableMenu } from "@/components/menu/qr/QrTableMenuProvider"
import { QrProductDetailSheet } from "@/components/menu/qr/QrProductDetailSheet"
import { QrMenuCartSheet, QrMenuFloatingBar } from "@/components/menu/qr/QrMenuCartSheet"
import type { QrMenuItem } from "@/lib/menu/qr-menu-types"

/** Shared cart sheet, floating bar, and product detail for menu routes. */
export function QrTableMenuShell() {
  const {
    menuItems,
    oftenOrderedWith,
    detailItem,
    detailItemId,
    closeDetail,
    addLineToCart,
    openDetail,
    cart,
    cartCount,
    cartTotal,
    cartOpen,
    setCartOpen,
    increment,
    decrement,
    submitOrder,
    submitting,
    checkoutError,
    clearCheckoutError,
    displayLabel,
  } = useQrTableMenu()

  const catalogFrozenRef = useRef<QrMenuItem[]>(menuItems)
  const oftenFrozenRef = useRef(oftenOrderedWith)
  if (!detailItemId) {
    catalogFrozenRef.current = menuItems
    oftenFrozenRef.current = oftenOrderedWith
  }

  return (
    <>
      <QrProductDetailSheet
        product={detailItem}
        catalog={detailItemId ? catalogFrozenRef.current : menuItems}
        oftenOrderedWith={detailItemId ? oftenFrozenRef.current : oftenOrderedWith}
        open={!!detailItemId}
        onClose={closeDetail}
        onOpenProduct={openDetail}
        onConfirm={(payload) => {
          addLineToCart(payload)
          closeDetail()
        }}
      />

      {!cartOpen && cartCount > 0 ? (
        <QrMenuFloatingBar cartCount={cartCount} cartTotal={cartTotal} onOpen={() => setCartOpen(true)} />
      ) : null}

      <QrMenuCartSheet
        open={cartOpen}
        tableLabel={displayLabel}
        cart={cart}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onClose={() => setCartOpen(false)}
        onIncrement={increment}
        onDecrement={decrement}
        onSubmit={submitOrder}
        submitting={submitting}
        checkoutError={checkoutError}
        onDismissError={clearCheckoutError}
      />
    </>
  )
}
