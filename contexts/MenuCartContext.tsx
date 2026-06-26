"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { buildCartLineId, type CartExtra, type CartVariant } from "@/lib/menu/cart-line"

export type MenuCartItem = {
  lineId: string
  productId: string
  name: string
  basePrice: number
  price: number
  variant: CartVariant | null
  extras: CartExtra[]
  maxOrderable: number
  quantity: number
}

export type AddToMenuCartPayload = {
  productId: string
  name: string
  basePrice: number
  price: number
  maxOrderable: number
  variant?: CartVariant | null
  extras?: CartExtra[]
  quantity?: number
}

type MenuCartContextValue = {
  items: MenuCartItem[]
  open: boolean
  setOpen: (v: boolean) => void
  add: (p: AddToMenuCartPayload) => void
  setQty: (lineId: string, quantity: number) => void
  remove: (lineId: string) => void
  clear: () => void
  subtotal: number
  count: number
}

const Ctx = createContext<MenuCartContextValue | null>(null)

export function MenuCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<MenuCartItem[]>([])
  const [open, setOpen] = useState(false)

  const add = useCallback((p: AddToMenuCartPayload) => {
    setOpen(true)
    const extras = p.extras ?? []
    const variant = p.variant ?? null
    const lineId = buildCartLineId(p.productId, extras, variant)
    const qty = p.quantity ?? 1

    setItems((prev) => {
      const x = prev.find((i) => i.lineId === lineId)
      if (x) {
        const nq = Math.min(x.quantity + qty, p.maxOrderable)
        return prev.map((i) =>
          i.lineId === lineId ? { ...i, quantity: nq, maxOrderable: p.maxOrderable, price: p.price } : i,
        )
      }
      return [
        ...prev,
        {
          lineId,
          productId: p.productId,
          name: p.name,
          basePrice: p.basePrice,
          price: p.price,
          variant,
          extras,
          maxOrderable: p.maxOrderable,
          quantity: qty,
        },
      ]
    })
  }, [])

  const setQty = useCallback((lineId: string, quantity: number) => {
    setItems((prev) => {
      const row = prev.find((i) => i.lineId === lineId)
      if (!row) return prev
      const q = Math.max(0, Math.min(quantity, row.maxOrderable))
      if (q === 0) return prev.filter((i) => i.lineId !== lineId)
      return prev.map((i) => (i.lineId === lineId ? { ...i, quantity: q } : i))
    })
  }, [])

  const remove = useCallback((lineId: string) => {
    setItems((prev) => prev.filter((i) => i.lineId !== lineId))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.quantity, 0),
    [items],
  )
  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])

  const value = useMemo(
    () => ({ items, open, setOpen, add, setQty, remove, clear, subtotal, count }),
    [items, open, add, setQty, remove, clear, subtotal, count],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useMenuCart() {
  const v = useContext(Ctx)
  if (!v) throw new Error("useMenuCart requires MenuCartProvider")
  return v
}
