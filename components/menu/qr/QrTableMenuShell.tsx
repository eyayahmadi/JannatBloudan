"use client"

import { AnimatePresence } from "framer-motion"
import { useQrTableMenu } from "@/components/menu/qr/QrTableMenuProvider"
import { QrProductDetailSheet } from "@/components/menu/qr/QrProductDetailSheet"
import { QrMenuCartSheet, QrMenuFloatingBar } from "@/components/menu/qr/QrMenuCartSheet"

/** Shared cart sheet, floating bar, and product detail for menu routes. */
export function QrTableMenuShell() {
  const {
    menuItems,
    oftenOrderedWith,
    detailItem,
    detailItemId,
    setDetailItemId,
    addLineToCart,
    cart,
    cartCount,
    cartTotal,
    cartOpen,
    setCartOpen,
    increment,
    decrement,
    submitOrder,
    submitting,
    displayLabel,
  } = useQrTableMenu()

  return (
    <>
      <QrProductDetailSheet
        product={detailItem}
        catalog={menuItems}
        oftenOrderedWith={oftenOrderedWith}
        open={!!detailItemId}
        onClose={() => setDetailItemId(null)}
        onOpenProduct={(item) => setDetailItemId(item.id)}
        onConfirm={(payload) => {
          addLineToCart(payload)
          setDetailItemId(null)
        }}
      />

      <AnimatePresence>
        {!cartOpen && cartCount > 0 ? (
          <QrMenuFloatingBar cartCount={cartCount} cartTotal={cartTotal} onOpen={() => setCartOpen(true)} />
        ) : null}
      </AnimatePresence>

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
      />
    </>
  )
}
