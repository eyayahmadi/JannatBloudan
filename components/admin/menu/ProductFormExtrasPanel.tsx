"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Modifier = {
  id: string
  name_de: string
  name_ar?: string | null
  price: number | string
  is_available?: boolean
}

type ProductFormExtrasPanelProps = {
  productId: string | null
}

export function ProductFormExtrasPanel({ productId }: ProductFormExtrasPanelProps) {
  const [items, setItems] = useState<Modifier[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name_de: "", name_ar: "", price: "" })

  const load = useCallback(async () => {
    if (!productId) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/modifiers", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) return
      const groups = (data.groups ?? []).filter(
        (g: { product_id: string }) => String(g.product_id) === productId,
      )
      const groupIds = new Set(groups.map((g: { id: string }) => g.id))
      setItems((data.modifiers ?? []).filter((m: Modifier & { group_id: string }) => groupIds.has(m.group_id)))
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    void load()
  }, [load])

  if (!productId) {
    return <p className="text-sm text-slate-500">Speichern Sie das Produkt zuerst, dann Extras hinzufügen.</p>
  }

  const add = async () => {
    if (!form.name_de.trim()) return
    await fetch("/api/admin/modifiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        name_de: form.name_de.trim(),
        name_ar: form.name_ar.trim() || null,
        price: parseFloat(form.price) || 0,
      }),
    })
    setForm({ name_de: "", name_ar: "", price: "" })
    await load()
  }

  const patch = async (id: string, body: Record<string, unknown>) => {
    await fetch(`/api/admin/modifiers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    await load()
  }

  const remove = async (id: string) => {
    await fetch(`/api/admin/modifiers/${id}`, { method: "DELETE" })
    await load()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Extras für Waffle, Crêpe, Pancake usw.</p>
      {loading ? <p className="text-sm">Laden…</p> : null}
      <div className="space-y-2">
        {items.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
            <Input
              className="h-8 max-w-[140px]"
              defaultValue={m.name_de}
              onBlur={(e) => {
                if (e.target.value !== m.name_de) void patch(m.id, { name_de: e.target.value })
              }}
            />
            <Input
              className="h-8 w-20"
              defaultValue={String(m.price)}
              onBlur={(e) => {
                const v = parseFloat(e.target.value)
                if (Number.isFinite(v)) void patch(m.id, { price: v })
              }}
            />
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={m.is_available !== false}
                onChange={(e) => void patch(m.id, { is_available: e.target.checked })}
              />
              Aktiv
            </label>
            <Button type="button" size="sm" variant="outline" onClick={() => void remove(m.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <div>
          <Label>Name (DE)</Label>
          <Input value={form.name_de} onChange={(e) => setForm((f) => ({ ...f, name_de: e.target.value }))} />
        </div>
        <div>
          <Label>Name (AR)</Label>
          <Input value={form.name_ar} onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))} dir="rtl" />
        </div>
        <div>
          <Label>Preis €</Label>
          <Input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
        </div>
        <div className="flex items-end">
          <Button type="button" onClick={() => void add()}>
            <Plus className="mr-1 h-4 w-4" />
            Extra
          </Button>
        </div>
      </div>
    </div>
  )
}
