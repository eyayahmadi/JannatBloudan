"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Variant = {
  id: string
  name_de: string
  name_ar?: string | null
  price: number | string
  is_available?: boolean
}

type ProductFormVariantsPanelProps = {
  productId: string | null
}

export function ProductFormVariantsPanel({ productId }: ProductFormVariantsPanelProps) {
  const [items, setItems] = useState<Variant[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name_de: "", name_ar: "", price: "" })

  const load = useCallback(async () => {
    if (!productId) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/variants", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) return
      const groups = (data.groups ?? []).filter(
        (g: { product_id: string }) => String(g.product_id) === productId,
      )
      const groupIds = new Set(groups.map((g: { id: string }) => g.id))
      setItems((data.variants ?? []).filter((v: Variant & { group_id: string }) => groupIds.has(v.group_id)))
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    void load()
  }, [load])

  if (!productId) {
    return <p className="text-sm text-slate-500">Speichern Sie das Produkt zuerst, dann Varianten hinzufügen.</p>
  }

  const add = async () => {
    if (!form.name_de.trim()) return
    await fetch("/api/admin/variants", {
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
    await fetch(`/api/admin/variants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    await load()
  }

  const remove = async (id: string) => {
    await fetch(`/api/admin/variants/${id}`, { method: "DELETE" })
    await load()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Größen: Klein/Groß, Glas/Kanne, 0.25L/0.75L …</p>
      {loading ? <p className="text-sm">Laden…</p> : null}
      <div className="space-y-2">
        {items.map((v) => (
          <div key={v.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
            <Input
              className="h-8 max-w-[140px]"
              defaultValue={v.name_de}
              onBlur={(e) => {
                if (e.target.value !== v.name_de) void patch(v.id, { name_de: e.target.value })
              }}
            />
            <Input
              className="h-8 w-20"
              defaultValue={String(v.price)}
              onBlur={(e) => {
                const p = parseFloat(e.target.value)
                if (Number.isFinite(p)) void patch(v.id, { price: p })
              }}
            />
            <span className="text-xs text-slate-500">€</span>
            <Button type="button" size="sm" variant="outline" onClick={() => void remove(v.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <div>
          <Label>Variante (DE)</Label>
          <Input value={form.name_de} onChange={(e) => setForm((f) => ({ ...f, name_de: e.target.value }))} placeholder="Klein" />
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
            Variante
          </Button>
        </div>
      </div>
    </div>
  )
}
