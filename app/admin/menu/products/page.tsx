"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Archive,
  Copy,
  Edit2,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { AdminPageFrame } from "@/components/site/AdminPageFrame"
import { MenuAdminShell } from "@/components/admin/menu/MenuAdminShell"
import { AdminDragReorderList } from "@/components/admin/menu/AdminDragReorderList"
import { ProductFormModal, type ProductFormState } from "@/components/admin/menu/ProductFormModal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { tagsFromProductRow, normalizeProductTags, attributeBadgeLabel } from "@/lib/menu/product-attributes"
import { menuStatusFromRow, rowFromMenuStatus, MENU_STATUS_LABELS } from "@/lib/menu/product-availability-status"

type Category = {
  id: string
  name: string
  slug: string
  section?: string
}

type Product = {
  id: string
  name: string
  name_ar?: string | null
  slug?: string
  price: number
  stock_quantity: number
  category_id?: string | null
  categories?: Category | null
  category?: Category | null
  image_url: string | null
  is_available: boolean
  is_archived?: boolean
  display_order?: number
  description: string | null
  station?: string | null
  tags?: string[] | null
  product_ingredients?: Array<{ quantity: number; ingredients?: { id: string; name: string; unit?: string | null } | null }>
}

type Ingredient = { id: string; name: string; unit?: string | null; stock_quantity?: number | null }

const EMPTY_FORM: ProductFormState = {
  name: "",
  name_ar: "",
  description: "",
  price: "",
  category_id: "",
  stock_quantity: "0",
  image_url: "",
  station: "KITCHEN",
  display_order: "0",
  menu_status: "available",
  tags: [],
  recommended_ids: [],
}

export default function AdminMenuProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recommendations, setRecommendations] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("all")
  const [showArchived, setShowArchived] = useState(false)
  const [reorderMode, setReorderMode] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM)
  const [reorderList, setReorderList] = useState<Product[]>([])

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/catalog", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) return
      const prods = (data.products ?? []).map((p: Product & { categories?: Category }) => ({
        ...p,
        category: p.categories ?? p.category ?? null,
      }))
      setProducts(prods)
      setCategories(data.categories ?? [])
      setIngredients(data.ingredients ?? [])
      setRecommendations(data.recommendations ?? {})
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return products
      .filter((p) => (showArchived ? !!p.is_archived : !p.is_archived))
      .filter((p) => catFilter === "all" || p.category?.id === catFilter)
      .filter((p) => {
        if (!q) return true
        return (
          p.name.toLowerCase().includes(q) ||
          (p.name_ar ?? "").includes(q) ||
          (p.description ?? "").toLowerCase().includes(q)
        )
      })
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name))
  }, [products, search, catFilter, showArchived])

  const canReorder = !search.trim() && catFilter === "all" && !showArchived

  useEffect(() => {
    if (reorderMode && canReorder) setReorderList(filtered)
  }, [reorderMode, canReorder, filtered])

  const openCreate = () => {
    setEditing(null)
    setForm({
      ...EMPTY_FORM,
      category_id: categories[0]?.id ?? "",
      display_order: String(products.length),
    })
    setModalOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name,
      name_ar: p.name_ar ?? "",
      description: p.description ?? "",
      price: String(p.price),
      category_id: p.category?.id ?? p.category_id ?? "",
      stock_quantity: String(p.stock_quantity ?? 0),
      image_url: p.image_url ?? "",
      station: p.station ?? "KITCHEN",
      display_order: String(p.display_order ?? 0),
      menu_status: menuStatusFromRow(p),
      tags: tagsFromProductRow(p),
      recommended_ids: recommendations[p.id] ?? [],
    })
    setModalOpen(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const avail = rowFromMenuStatus(form.menu_status)
      const payload = {
        name: form.name.trim(),
        name_ar: form.name_ar.trim() || null,
        description: form.description.trim() || null,
        price: parseFloat(form.price) || 0,
        category_id: form.category_id || null,
        stock_quantity: parseInt(form.stock_quantity, 10) || 0,
        image_url: form.image_url || null,
        station: form.station,
        display_order: parseInt(form.display_order, 10) || 0,
        is_available: avail.is_available,
        is_archived: avail.is_archived,
        tags: normalizeProductTags(form.tags),
      }

      let productId = editing?.id
      if (editing) {
        const res = await fetch(`/api/admin/products/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) return
      } else {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) return
        const d = await res.json()
        productId = d.product?.id
      }

      if (productId) {
        await fetch(`/api/admin/product-recommendations/${productId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recommended_product_ids: form.recommended_ids }),
        })
      }

      setModalOpen(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const saveReorder = async () => {
    await fetch("/api/admin/products/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: reorderList.map((p, i) => ({ id: p.id, display_order: i })),
      }),
    })
    setReorderMode(false)
    await load()
  }

  const duplicate = async (p: Product) => {
    await fetch(`/api/admin/products/${p.id}/duplicate`, { method: "POST" })
    await load()
  }

  const archive = async (p: Product) => {
    const row = rowFromMenuStatus("hidden")
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    })
    await load()
  }

  const toggleAvail = async (p: Product) => {
    const cur = menuStatusFromRow(p)
    const next = cur === "available" ? "sold_out" : "available"
    const row = rowFromMenuStatus(next)
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    })
    await load()
  }

  const remove = async () => {
    if (!deleteTarget) return
    await fetch(`/api/admin/products/${deleteTarget.id}`, { method: "DELETE" })
    setDeleteTarget(null)
    await load()
  }

  const productOptions = products.filter((p) => p.id !== editing?.id).map((p) => ({ id: p.id, name: p.name }))

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <AdminPageFrame title="Menu Management">
        <MenuAdminShell title="Produkte">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" placeholder="Suchen…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
            >
              <option value="all">Alle Kategorien</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
              Archiv
            </label>
            {canReorder ? (
              <>
                <Button
                  type="button"
                  variant={reorderMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setReorderMode((v) => !v)}
                >
                  <GripVertical className="mr-1 h-4 w-4" />
                  {reorderMode ? "Sortieren beenden" : "Sortieren"}
                </Button>
                {reorderMode ? (
                  <Button type="button" size="sm" onClick={() => void saveReorder()}>
                    Reihenfolge speichern
                  </Button>
                ) : null}
              </>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="mr-1 h-4 w-4" />
              Aktualisieren
            </Button>
            <Button type="button" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" />
              Produkt hinzufügen
            </Button>
          </div>

          {loading ? (
            <p className="text-slate-500">Laden…</p>
          ) : reorderMode ? (
            <AdminDragReorderList
              items={reorderList}
              onReorder={setReorderList}
              renderItem={(p) => (
                <div className="flex items-center gap-3 py-1">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <span className="text-xl">🍽️</span>
                  )}
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.category?.name}</p>
                  </div>
                </div>
              )}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <Card key={p.id} className="overflow-hidden">
                  <div className="flex aspect-[16/10] items-center justify-center bg-slate-100 dark:bg-slate-800">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-4xl">🍽️</span>
                    )}
                  </div>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        {p.name_ar ? (
                          <p className="text-xs text-slate-500" dir="rtl">
                            {p.name_ar}
                          </p>
                        ) : null}
                        <p className="text-sm font-bold text-amber-700">{p.price.toFixed(2)} €</p>
                      </div>
                      <Badge
                        variant={
                          menuStatusFromRow(p) === "available"
                            ? "default"
                            : menuStatusFromRow(p) === "sold_out"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {MENU_STATUS_LABELS[menuStatusFromRow(p)].de}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{p.category?.name ?? "—"}</p>
                    <div className="flex flex-wrap gap-1">
                      {(p.tags ?? []).map((t) => {
                        const lbl = attributeBadgeLabel(t)
                        return (
                          <Badge key={t} variant="outline" className="text-[10px]">
                            {lbl?.de ?? t}
                          </Badge>
                        )
                      })}
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      <Button type="button" size="sm" variant="outline" onClick={() => openEdit(p)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => void duplicate(p)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => void toggleAvail(p)}>
                        {p.is_available ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => void archive(p)}>
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setDeleteTarget(p)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <ProductFormModal
            open={modalOpen}
            editingId={editing?.id ?? null}
            editingName={editing?.name}
            form={form}
            categories={categories}
            productOptions={productOptions}
            ingredients={ingredients}
            recipeLines={editing?.product_ingredients}
            saving={saving}
            onClose={() => setModalOpen(false)}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            onSave={() => void save()}
          />

          {deleteTarget ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-slate-900">
                <p className="font-semibold">« {deleteTarget.name} » endgültig löschen?</p>
                <div className="mt-4 flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>
                    Abbrechen
                  </Button>
                  <Button type="button" className="flex-1" onClick={() => void remove()}>
                    Löschen
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </MenuAdminShell>
      </AdminPageFrame>
    </RequireAuth>
  )
}
