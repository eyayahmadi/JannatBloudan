"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type MenuCartItem = {
  id: string
  name: string
  price: number
  maxOrderable: number
  quantity: number
}

type MenuCartContextValue = {
  items: MenuCartItem[]
  open: boolean
  setOpen: (v: boolean) => void
  add: (p: { id: string; name: string; price: number; maxOrderable: number }) => void
  setQty: (id: string, quantity: number) => void
  remove: (id: string) => void
  clear: () => void
  subtotal: number
  count: number
}

const Ctx = createContext<MenuCartContextValue | null>(null)

export function MenuCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<MenuCartItem[]>([])
  const [open, setOpen] = useState(false)

  const add = useCallback(
    (p: { id: string; name: string; price: number; maxOrderable: number }) => {
      setOpen(true)
      setItems((prev) => {
        const x = prev.find((i) => i.id === p.id)
        if (x) {
          const nq = Math.min(x.quantity + 1, p.maxOrderable)
          return prev.map((i) => (i.id === p.id ? { ...i, quantity: nq, maxOrderable: p.maxOrderable } : i))
        }
        return [
          ...prev,
          { id: p.id, name: p.name, price: p.price, maxOrderable: p.maxOrderable, quantity: 1 },
        ]
      })
    },
    [],
  )

  const setQty = useCallback((id: string, quantity: number) => {
    setItems((prev) => {
      const row = prev.find((i) => i.id === id)
      if (!row) return prev
      const q = Math.max(0, Math.min(quantity, row.maxOrderable))
      if (q === 0) return prev.filter((i) => i.id !== id)
      return prev.map((i) => (i.id === id ? { ...i, quantity: q } : i))
    })
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
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
