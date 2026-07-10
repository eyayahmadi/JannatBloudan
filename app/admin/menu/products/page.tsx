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
import { AdminMenuSectionHeader } from "@/components/admin/menu/AdminMenuSectionHeader"
import { ProductFormModal, type ProductFormState } from "@/components/admin/menu/ProductFormModal"
import { AdminConfirmDialog } from "@/components/admin/menu/AdminConfirmDialog"
import { MenuSubcategoryHeader } from "@/components/menu/MenuSubcategoryHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ADMIN_MENU_SECTIONS,
  groupProductsForAdminMenu,
  type AdminMenuSectionFilter,
} from "@/lib/menu/menu-category-groups"
import { tagsFromProductRow, normalizeProductTags, attributeBadgeLabel } from "@/lib/menu/product-attributes"
import { compareMenuCardOrder } from "@/lib/menu/menu-order"
import { menuStatusFromRow, rowFromMenuStatus, MENU_STATUS_LABELS } from "@/lib/menu/product-availability-status"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Category = {
  id: string
  name: string
  slug: string
  section?: string
  display_order?: number
  name_ar?: string | null
  icon_emoji?: string | null
  description?: string | null
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
  description_ar?: string | null
  station?: string | null
  tags?: string[] | null
  product_ingredients?: Array<{ quantity: number; ingredients?: { id: string; name: string; unit?: string | null } | null }>
}

type Ingredient = { id: string; name: string; unit?: string | null; stock_quantity?: number | null }

const EMPTY_FORM: ProductFormState = {
  name: "",
  name_ar: "",
  description: "",
  description_ar: "",
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

const SECTION_FILTERS: { id: AdminMenuSectionFilter; label: string }[] = [
  { id: "all", label: "Alle" },
  ...ADMIN_MENU_SECTIONS.map((s) => ({ id: s.id as AdminMenuSectionFilter, label: s.labelDe })),
]

const FILTER_STORAGE_KEY = "jb-admin-menu-products-filters"

function enrichProduct(row: Product & { categories?: Category | null }, categories: Category[]): Product {
  const cat = row.categories ?? row.category ?? categories.find((c) => c.id === row.category_id) ?? null
  return { ...row, category: cat, categories: cat }
}

function productFromForm(
  id: string,
  form: ProductFormState,
  categories: Category[],
  prev: Product | null,
): Product {
  const avail = rowFromMenuStatus(form.menu_status)
  const cat = categories.find((c) => c.id === form.category_id) ?? null
  return {
    id,
    name: form.name.trim(),
    name_ar: form.name_ar.trim() || null,
    description: form.description.trim() || null,
    description_ar: form.description_ar.trim() || null,
    price: parseFloat(form.price) || 0,
    category_id: form.category_id || null,
    stock_quantity: parseInt(form.stock_quantity, 10) || 0,
    image_url: form.image_url || null,
    station: form.station,
    display_order: parseInt(form.display_order, 10) || 0,
    is_available: avail.is_available,
    is_archived: avail.is_archived,
    tags: normalizeProductTags(form.tags),
    category: cat,
    categories: cat,
    slug: prev?.slug,
    product_ingredients: prev?.product_ingredients,
  }
}

export default function AdminMenuProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recommendations, setRecommendations] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("all")
  const [sectionFilter, setSectionFilter] = useState<AdminMenuSectionFilter>("all")
  const [showArchived, setShowArchived] = useState(false)
  const [reorderMode, setReorderMode] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM)
  const [reorderList, setReorderList] = useState<Product[]>([])

  const sortedCategories = useMemo(
    () =>
      [...categories].sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name),
      ),
    [categories],
  )

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
    try {
      const raw = sessionStorage.getItem(FILTER_STORAGE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as {
        search?: string
        catFilter?: string
        sectionFilter?: AdminMenuSectionFilter
        showArchived?: boolean
      }
      if (typeof saved.search === "string") setSearch(saved.search)
      if (typeof saved.catFilter === "string") setCatFilter(saved.catFilter)
      if (saved.sectionFilter) setSectionFilter(saved.sectionFilter)
      if (typeof saved.showArchived === "boolean") setShowArchived(saved.showArchived)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify({ search, catFilter, sectionFilter, showArchived }),
      )
    } catch {
      /* ignore */
    }
  }, [search, catFilter, sectionFilter, showArchived])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return products
      .filter((p) => (showArchived ? !!p.is_archived : !p.is_archived))
      .filter((p) => catFilter === "all" || p.category?.id === catFilter)
      .filter((p) => {
        if (sectionFilter === "all") return true
        return (p.category?.section ?? "food") === sectionFilter
      })
      .filter((p) => {
        if (!q) return true
        return (
          p.name.toLowerCase().includes(q) ||
          (p.name_ar ?? "").includes(q) ||
          (p.description ?? "").toLowerCase().includes(q)
        )
      })
      .sort((a, b) =>
        compareMenuCardOrder(
          {
            category_display_order: a.category?.display_order ?? 0,
            display_order: a.display_order ?? 0,
            id: a.id,
          },
          {
            category_display_order: b.category?.display_order ?? 0,
            display_order: b.display_order ?? 0,
            id: b.id,
          },
        ),
      )
  }, [products, search, catFilter, sectionFilter, showArchived])

  const menuBlocks = useMemo(
    () =>
      groupProductsForAdminMenu(
        filtered.map((p) => ({ ...p, category: p.category ?? null })),
        sortedCategories,
        sectionFilter,
      ),
    [filtered, sortedCategories, sectionFilter],
  )

  const canReorder =
    !search.trim() && catFilter === "all" && sectionFilter === "all" && !showArchived

  useEffect(() => {
    if (reorderMode && canReorder) setReorderList(filtered)
  }, [reorderMode, canReorder, filtered])

  const openCreate = () => {
    setEditing(null)
    setForm({
      ...EMPTY_FORM,
      category_id: sortedCategories[0]?.id ?? "",
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
      description_ar: p.description_ar ?? "",
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
        description_ar: form.description_ar.trim() || null,
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
        if (!res.ok) {
          toast.error("Speichern fehlgeschlagen")
          return
        }
        const data = (await res.json()) as { product?: Product }
        const merged = enrichProduct(
          data.product ? { ...editing, ...data.product } : productFromForm(editing.id, form, sortedCategories, editing),
          sortedCategories,
        )
        setProducts((prev) => prev.map((p) => (p.id === editing.id ? merged : p)))
        productId = editing.id
      } else {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          toast.error("Erstellen fehlgeschlagen")
          return
        }
        const d = (await res.json()) as { product?: Product }
        if (!d.product?.id) {
          toast.error("Erstellen fehlgeschlagen")
          return
        }
        productId = d.product.id
        const created = enrichProduct(
          { ...productFromForm(d.product.id, form, sortedCategories, null), ...d.product },
          sortedCategories,
        )
        setProducts((prev) => [...prev, created])
      }

      if (productId) {
        await fetch(`/api/admin/product-recommendations/${productId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recommended_product_ids: form.recommended_ids }),
        })
        setRecommendations((prev) => ({ ...prev, [productId!]: form.recommended_ids }))
      }

      const wasEdit = !!editing
      setModalOpen(false)
      setEditing(null)
      toast.success(wasEdit ? "Produkt erfolgreich gespeichert" : "Produkt erfolgreich erstellt")
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
    if (!deleteTarget || deleting) return
    const id = deleteTarget.id
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" })
      if (!res.ok) {
        toast.error("Löschen fehlgeschlagen")
        return
      }
      setProducts((prev) => prev.filter((p) => p.id !== id))
      setRecommendations((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setDeleteTarget(null)
      toast.success("Produkt gelöscht")
    } finally {
      setDeleting(false)
    }
  }

  const productOptions = products.filter((p) => p.id !== editing?.id).map((p) => ({ id: p.id, name: p.name }))

  const renderProductCard = (p: Product) => {
    const status = menuStatusFromRow(p)
    const visibleTags = normalizeProductTags(p.tags)

    return (
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
            <Badge variant={status === "available" ? "default" : status === "sold_out" ? "secondary" : "outline"}>
              {MENU_STATUS_LABELS[status].de}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">{p.category?.name ?? "—"}</p>
          {p.description ? (
            <p className="line-clamp-2 text-xs text-slate-600 dark:text-slate-400">{p.description}</p>
          ) : null}
          {p.description_ar ? (
            <p className="line-clamp-2 text-[11px] text-slate-500 dark:text-slate-500" dir="rtl">
              {p.description_ar}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-1">
            {visibleTags.map((t) => {
              const lbl = attributeBadgeLabel(t)
              return (
                <Badge key={t} variant="outline" className="text-[10px]">
                  {lbl?.de ?? t}
                </Badge>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            <Button type="button" size="sm" variant="outline" aria-label="Bearbeiten" onClick={() => openEdit(p)}>
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="sm" variant="outline" aria-label="Duplizieren" onClick={() => void duplicate(p)}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="sm" variant="outline" aria-label="Verfügbarkeit" onClick={() => void toggleAvail(p)}>
              {p.is_available ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
            <Button type="button" size="sm" variant="outline" aria-label="Archivieren" onClick={() => void archive(p)}>
              <Archive className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="sm" variant="outline" aria-label="Löschen" onClick={() => setDeleteTarget(p)}>
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

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
              {sortedCategories.map((c) => (
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

          <div className="mb-5 flex flex-wrap gap-2">
            {SECTION_FILTERS.map((f) => (
              <Button
                key={f.id}
                type="button"
                size="sm"
                variant={sectionFilter === f.id ? "default" : "outline"}
                className={cn("rounded-full", sectionFilter === f.id && "bg-amber-700 hover:bg-amber-800")}
                onClick={() => setSectionFilter(f.id)}
              >
                {f.label}
              </Button>
            ))}
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
          ) : menuBlocks.length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
              Keine Produkte für diese Filter gefunden.
            </p>
          ) : (
            <div className="space-y-10">
              {menuBlocks.map((block) => (
                <div key={block.section} className="space-y-8">
                  {sectionFilter === "all" ? (
                    <AdminMenuSectionHeader icon={block.icon} labelDe={block.labelDe} labelAr={block.labelAr} />
                  ) : null}
                  {block.groups.map((group) => (
                    <section key={group.key} className="space-y-4">
                      <MenuSubcategoryHeader
                        icon={group.icon}
                        labelDe={group.labelDe}
                        labelAr={group.labelAr}
                        subtitle={group.subtitle}
                        drink={block.section === "drinks"}
                        sweet={block.section === "desserts"}
                        premium={block.section === "food"}
                      />
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {group.items.map((p) => renderProductCard(p))}
                      </div>
                    </section>
                  ))}
                </div>
              ))}
            </div>
          )}

        </MenuAdminShell>
      </AdminPageFrame>

      <ProductFormModal
        open={modalOpen}
        editingId={editing?.id ?? null}
        editingName={editing?.name}
        form={form}
        categories={sortedCategories}
        productOptions={productOptions}
        ingredients={ingredients}
        recipeLines={editing?.product_ingredients}
        saving={saving}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        onSave={() => void save()}
      />

      <AdminConfirmDialog
        open={!!deleteTarget}
        onClose={() => {
          if (!deleting) setDeleteTarget(null)
        }}
        onConfirm={() => void remove()}
        title="Produkt löschen"
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        confirming={deleting}
        destructive
      >
        {deleteTarget ? (
          <div className="space-y-4">
            <div className="mx-auto flex aspect-[16/10] max-h-40 w-full max-w-xs items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
              {deleteTarget.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={deleteTarget.image_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-5xl">🍽️</span>
              )}
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-slate-900 dark:text-white">{deleteTarget.name}</p>
              {deleteTarget.name_ar ? (
                <p className="mt-1 text-sm text-slate-500" dir="rtl">
                  {deleteTarget.name_ar}
                </p>
              ) : null}
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Dieses Produkt endgültig aus der Speisekarte entfernen?
              </p>
            </div>
          </div>
        ) : null}
      </AdminConfirmDialog>
    </RequireAuth>
  )
}
