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

type Variant = {
  id: string
  name_de: string
  name_ar?: string | null
  price: number | string
  is_available?: boolean
  group_id: string
}

type VarGroup = { id: string; product_id: string; products?: { id: string; name: string } | null }
type Product = { id: string; name: string }

export default function AdminMenuVariantsPage() {
  const [variants, setVariants] = useState<Variant[]>([])
  const [groups, setGroups] = useState<VarGroup[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState({ product_id: "", name_de: "", name_ar: "", price: "" })

  const load = useCallback(async () => {
    const [varRes, catRes] = await Promise.all([
      fetch("/api/admin/variants", { cache: "no-store" }),
      fetch("/api/admin/catalog", { cache: "no-store" }),
    ])
    const varData = await varRes.json()
    const catData = await catRes.json()
    if (varRes.ok) {
      setVariants(varData.variants ?? [])
      setGroups(varData.groups ?? [])
    }
    if (catRes.ok) setProducts((catData.products ?? []).map((p: Product) => ({ id: p.id, name: p.name })))
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const groupProduct = (groupId: string) => {
    const g = groups.find((x) => x.id === groupId)
    return g?.products?.name ?? products.find((p) => p.id === g?.product_id)?.name ?? "—"
  }

  const create = async () => {
    if (!form.product_id || !form.name_de.trim()) return
    await fetch("/api/admin/variants", {
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

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <AdminPageFrame title="Varianten">
        <MenuAdminShell title="Varianten (Größen)">
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
                <Label>Variante (z.B. Klein)</Label>
                <Input value={form.name_de} onChange={(e) => setForm((f) => ({ ...f, name_de: e.target.value }))} />
              </div>
              <div>
                <Label>Preis (€)</Label>
                <Input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={() => void create()}>
                  <Plus className="mr-1 h-4 w-4" />
                  Hinzufügen
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button type="button" variant="outline" size="sm" className="mb-3" onClick={() => void load()}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Aktualisieren
          </Button>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left dark:bg-slate-800">
                <tr>
                  <th className="p-3">Produkt</th>
                  <th className="p-3">Variante</th>
                  <th className="p-3">Preis</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.id} className="border-t">
                    <td className="p-3">{groupProduct(v.group_id)}</td>
                    <td className="p-3">{v.name_de}</td>
                    <td className="p-3">{Number(v.price).toFixed(2)} €</td>
                    <td className="p-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void fetch(`/api/admin/variants/${v.id}`, { method: "DELETE" }).then(() => load())}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MenuAdminShell>
      </AdminPageFrame>
    </RequireAuth>
  )
}
