"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, RefreshCw, Trash2 } from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { AdminPageFrame } from "@/components/site/AdminPageFrame"
import { MenuAdminShell } from "@/components/admin/menu/MenuAdminShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

type Modifier = {
  id: string
  name_de: string
  name_ar?: string | null
  price: number | string
  is_available?: boolean
  image_url?: string | null
  group_id: string
}

type ModGroup = {
  id: string
  product_id: string
  products?: { id: string; name: string } | null
}

type Product = { id: string; name: string }

export default function AdminMenuExtrasPage() {
  const [modifiers, setModifiers] = useState<Modifier[]>([])
  const [groups, setGroups] = useState<ModGroup[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    product_id: "",
    name_de: "",
    name_ar: "",
    price: "",
  })

  const load = useCallback(async () => {
    const [modRes, catRes] = await Promise.all([
      fetch("/api/admin/modifiers", { cache: "no-store" }),
      fetch("/api/admin/catalog", { cache: "no-store" }),
    ])
    const modData = await modRes.json()
    const catData = await catRes.json()
    if (modRes.ok) {
      setModifiers(modData.modifiers ?? [])
      setGroups(modData.groups ?? [])
    }
    if (catRes.ok) {
      setProducts((catData.products ?? []).map((p: Product) => ({ id: p.id, name: p.name })))
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const groupProduct = (groupId: string) => {
    const g = groups.find((x) => x.id === groupId)
    return g?.products?.name ?? products.find((p) => p.id === g?.product_id)?.name ?? "—"
  }

  const create = async () => {
    if (!form.product_id || !form.name_de.trim()) return
    await fetch("/api/admin/modifiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: form.product_id,
        name_de: form.name_de.trim(),
        name_ar: form.name_ar.trim() || null,
        price: parseFloat(form.price) || 0,
      }),
    })
    setForm({ product_id: form.product_id, name_de: "", name_ar: "", price: "" })
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
    if (!confirm("Extra löschen?")) return
    await fetch(`/api/admin/modifiers/${id}`, { method: "DELETE" })
    await load()
  }

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <AdminPageFrame title="Extras">
        <MenuAdminShell title="Extras">
          <Card className="mb-6">
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <Label>Produkt</Label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={form.product_id}
                  onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
                >
                  <option value="">Wählen…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Name (DE)</Label>
                <Input value={form.name_de} onChange={(e) => setForm((f) => ({ ...f, name_de: e.target.value }))} />
              </div>
              <div>
                <Label>Preis (€)</Label>
                <Input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={() => void create()}>
                  <Plus className="mr-1 h-4 w-4" />
                  Extra hinzufügen
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mb-3 flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="mr-1 h-4 w-4" />
              Aktualisieren
            </Button>
          </div>

          {loading ? (
            <p className="text-slate-500">Laden…</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left dark:bg-slate-800">
                  <tr>
                    <th className="p-3">Produkt</th>
                    <th className="p-3">Extra</th>
                    <th className="p-3">Preis</th>
                    <th className="p-3">Aktiv</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {modifiers.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="p-3">{groupProduct(m.group_id)}</td>
                      <td className="p-3">
                        <Input
                          className="h-8 max-w-[160px]"
                          defaultValue={m.name_de}
                          onBlur={(e) => {
                            if (e.target.value !== m.name_de) void patch(m.id, { name_de: e.target.value })
                          }}
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          className="h-8 w-20"
                          defaultValue={String(m.price)}
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value)
                            if (Number.isFinite(v)) void patch(m.id, { price: v })
                          }}
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={m.is_available !== false}
                          onChange={(e) => void patch(m.id, { is_available: e.target.checked })}
                        />
                      </td>
                      <td className="p-3">
                        <Button type="button" size="sm" variant="outline" onClick={() => void remove(m.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </MenuAdminShell>
      </AdminPageFrame>
    </RequireAuth>
  )
}
