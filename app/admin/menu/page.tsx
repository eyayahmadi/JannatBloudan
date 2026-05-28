"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Star,
  TrendingUp,
  RefreshCw,
  X,
  ImageIcon,
  ArrowUpDown,
  Lightbulb,
  Package,
} from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { AdminPageFrame } from "@/components/site/AdminPageFrame"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ProductMenuImageUpload } from "@/components/admin/ProductMenuImageUpload"

type Category = {
  id: string
  name: string
  slug: string
  section?: string
  is_active?: boolean
  display_order?: number
}

type Product = {
  id: string
  name: string
  price: number
  stock_quantity: number
  category: { id: string; name: string; slug: string; section?: string } | null
  image_url: string | null
  is_available: boolean
  description: string | null
  name_ar?: string | null
  station?: string | null
  is_popular?: boolean
  is_new?: boolean
  is_vegetarian?: boolean
  is_chef_choice?: boolean
  is_recommended?: boolean
  tags?: string[] | null
  spice_level?: string | null
  product_ingredients?: Array<{ quantity: number | string; ingredients: { id: string; name: string } | null }>
  _popularityScore?: number
}

type ProductFormData = {
  name: string
  name_ar: string
  description: string
  price: string
  category_id: string
  stock_quantity: string
  image_url: string
  station: string
  is_popular: boolean
  is_new: boolean
  is_vegetarian: boolean
  is_chef_choice: boolean
  is_recommended: boolean
  spice_level: string
  extra_tags: string
  is_available: boolean
}

const EMPTY_FORM: ProductFormData = {
  name: "",
  name_ar: "",
  description: "",
  price: "",
  category_id: "",
  stock_quantity: "",
  image_url: "",
  station: "KITCHEN",
  is_popular: false,
  is_new: false,
  is_vegetarian: false,
  is_chef_choice: false,
  is_recommended: false,
  spice_level: "",
  extra_tags: "",
  is_available: true,
}

type SortKey = "name" | "price" | "popularity"

function getPopularityScore(product: Product): number {
  if (product._popularityScore !== undefined) return product._popularityScore
  let hash = 0
  for (let i = 0; i < product.id.length; i++) {
    hash = (hash * 31 + product.id.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % 100
}

export default function MenuManagementPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState<SortKey>("name")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null)
  const [formData, setFormData] = useState<ProductFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [ingredients, setIngredients] = useState<{ id: string; name: string; unit: string }[]>([])
  const [recipeLines, setRecipeLines] = useState<{ ingredient_id: string; quantity: string }[]>([])
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategorySection, setNewCategorySection] = useState("food")
  const [categoryBusy, setCategoryBusy] = useState(false)

  const loadCatalog = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/catalog", { cache: "no-store" })
      if (res.status === 401 || res.status === 403) {
        const r2 = await fetch("/api/products")
        const d2 = await r2.json()
        const prods: Product[] = (d2.products ?? []).map((p: Product) => ({
          ...p,
          _popularityScore: getPopularityScore(p),
        }))
        setProducts(prods)
        const rc = await fetch("/api/categories")
        const dc = await rc.json()
        setCategories(dc.categories ?? [])
        return
      }
      const data = await res.json()
      if (!res.ok) return
      const prods: Product[] = (data.products ?? []).map((p: Product) => ({
        ...p,
        _popularityScore: getPopularityScore(p as Product),
      }))
      setProducts(prods)
      setCategories(data.categories ?? [])
      setIngredients(
        (data.ingredients ?? []).map((i: { id: string; name: string; unit: string | null }) => ({
          id: i.id,
          name: i.name,
          unit: i.unit || "",
        })),
      )
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    loadCatalog().finally(() => setLoading(false))
  }, [loadCatalog])

  const topPopularIds = useMemo(() => {
    const sorted = [...products].sort(
      (a, b) => (b._popularityScore ?? 0) - (a._popularityScore ?? 0),
    )
    return new Set(sorted.slice(0, 5).map((p) => p.id))
  }, [products])

  const filtered = useMemo(() => {
    const ql = searchQuery.toLowerCase().trim()
    let result = products.filter((p) => {
      const matchCat = selectedCategory === "all" || p.category?.name === selectedCategory
      if (!ql) return matchCat
      const inName = p.name.toLowerCase().includes(ql)
      const inDesc = (p.description ?? "").toLowerCase().includes(ql)
      const inTags =
        Array.isArray(p.tags) &&
        p.tags.some((tg) => String(tg).toLowerCase().includes(ql))
      return matchCat && (inName || inDesc || inTags)
    })

    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "price") return a.price - b.price
      return (b._popularityScore ?? 0) - (a._popularityScore ?? 0)
    })

    return result
  }, [products, searchQuery, selectedCategory, sortBy])

  const getSameCategoryProducts = (product: Product) => {
    if (!product.category) return []
    return products.filter(
      (p) =>
        p.id !== product.id &&
        p.category?.id === product.category?.id &&
        p.stock_quantity > 0 &&
        p.is_available,
    )
  }

  const openAddModal = () => {
    setFormData(EMPTY_FORM)
    setEditingProduct(null)
    setRecipeLines([])
    setShowAddModal(true)
  }

  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name,
      name_ar: product.name_ar ?? "",
      description: product.description ?? "",
      price: product.price.toString(),
      category_id: product.category?.id ?? "",
      stock_quantity: String(product.stock_quantity ?? 0),
      image_url: product.image_url ?? "",
      station: (product.station as string) || "KITCHEN",
      is_popular: !!product.is_popular,
      is_new: !!product.is_new,
      is_vegetarian: !!product.is_vegetarian,
      is_chef_choice: !!product.is_chef_choice,
      is_recommended: !!product.is_recommended,
      spice_level: product.spice_level ?? "",
      extra_tags: (() => {
        const builtins = new Set(["popular", "new", "vegetarian", "spicy"])
        const raw = Array.isArray(product.tags) ? product.tags : []
        return raw
          .filter((tag) => !builtins.has(String(tag).toLowerCase()))
          .join(", ")
      })(),
      is_available: product.is_available !== false,
    })
    setRecipeLines(
      (product.product_ingredients ?? [])
        .filter((x) => x.ingredients?.id)
        .map((x) => ({
          ingredient_id: x.ingredients!.id,
          quantity: String(x.quantity ?? ""),
        })),
    )
    setEditingProduct(product)
    setShowAddModal(true)
  }

  const closeModal = () => {
    setShowAddModal(false)
    setEditingProduct(null)
    setFormData(EMPTY_FORM)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const extra = formData.extra_tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
      const tagsSet = new Set<string>()
      if (formData.is_popular) tagsSet.add("popular")
      if (formData.is_new) tagsSet.add("new")
      if (formData.is_vegetarian) tagsSet.add("vegetarian")
      for (const x of extra) tagsSet.add(x.toLowerCase())
      const tags = Array.from(tagsSet)
      const spice_level = formData.spice_level.trim() ? formData.spice_level.trim() : null

      const payload = {
        name: formData.name,
        name_ar: formData.name_ar || null,
        description: formData.description || null,
        price: parseFloat(formData.price) || 0,
        category_id: formData.category_id || null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        image_url: formData.image_url || null,
        station: formData.station,
        is_popular: formData.is_popular,
        is_new: formData.is_new,
        is_vegetarian: formData.is_vegetarian,
        is_chef_choice: formData.is_chef_choice,
        is_recommended: formData.is_recommended,
        tags,
        spice_level,
        is_available: formData.is_available,
      }
      if (editingProduct) {
        const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          if (ingredients.length > 0) {
            const lines = recipeLines
              .filter((l) => l.ingredient_id && l.quantity)
              .map((l) => ({
                ingredient_id: l.ingredient_id,
                quantity: parseFloat(l.quantity) || 0,
              }))
            await fetch(`/api/admin/product-ingredients/${editingProduct.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lines }),
            })
          }
          await loadCatalog()
          closeModal()
        }
      } else {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const d = await res.json()
          const newId = d.product?.id as string
          if (newId && recipeLines.some((l) => l.ingredient_id && l.quantity)) {
            const lines = recipeLines
              .filter((l) => l.ingredient_id && l.quantity)
              .map((l) => ({
                ingredient_id: l.ingredient_id,
                quantity: parseFloat(l.quantity) || 0,
              }))
            await fetch(`/api/admin/product-ingredients/${newId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lines }),
            })
          }
          await loadCatalog()
          closeModal()
        }
      }
    } catch {
      /* ignore */
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/products/${deleteConfirm.id}`, { method: "DELETE" })
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== deleteConfirm.id))
        setDeleteConfirm(null)
      }
    } catch {
      /* ignore */
    } finally {
      setDeleting(false)
    }
  }

  const toggleAvailability = async (product: Product) => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: !product.is_available }),
      })
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, is_available: !p.is_available } : p)),
        )
      }
    } catch {
      /* ignore */
    }
  }

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim()
    if (!name || categoryBusy) return
    setCategoryBusy(true)
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, section: newCategorySection }),
      })
      if (res.ok) {
        setNewCategoryName("")
        await loadCatalog()
      }
    } catch {
      /* ignore */
    } finally {
      setCategoryBusy(false)
    }
  }

  const handleDeleteCategory = async (c: Category) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Supprimer la catégorie « ${c.name} » ? Les plats avec cette catégorie peuvent être déclassés.`,
      )
    )
      return
    setCategoryBusy(true)
    try {
      const res = await fetch(`/api/admin/categories/${c.id}`, { method: "DELETE" })
      if (res.ok) await loadCatalog()
    } catch {
      /* ignore */
    } finally {
      setCategoryBusy(false)
    }
  }

  const handleToggleCategoryActive = async (c: Category) => {
    const currentlyActive = c.is_active !== false
    setCategoryBusy(true)
    try {
      const res = await fetch(`/api/admin/categories/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentlyActive }),
      })
      if (res.ok) {
        setCategories((prev) =>
          prev.map((x) => (x.id === c.id ? { ...x, is_active: !currentlyActive } : x)),
        )
      }
    } catch {
      /* ignore */
    } finally {
      setCategoryBusy(false)
    }
  }

  const categoryNames = ["all", ...categories.map((c) => c.name)]

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <AdminPageFrame
        title="Gestion du menu"
        subtitle="Carte, prix, disponibilité et intelligence produit."
        trailing={
          <Button
            size="sm"
            className="gap-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
            onClick={openAddModal}
          >
            <Plus className="h-4 w-4" />
            Ajouter un plat
          </Button>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <RefreshCw className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        ) : (
          <>
            <Card className="mb-6 border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-slate-900 dark:text-white">Catégories</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Créer, activer ou supprimer une catégorie (rubrique carte / section).
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                  <div className="min-w-[160px] flex-1">
                    <Label className="text-xs text-slate-500">Nouvelle catégorie</Label>
                    <Input
                      className="mt-1"
                      placeholder="Ex. Grillades"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                  </div>
                  <div className="w-full sm:w-44">
                    <Label className="text-xs text-slate-500">Section</Label>
                    <select
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                      value={newCategorySection}
                      onChange={(e) => setNewCategorySection(e.target.value)}
                    >
                      <option value="food">food</option>
                      <option value="desserts">desserts</option>
                      <option value="drinks">drinks</option>
                      <option value="special">special</option>
                    </select>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={categoryBusy || !newCategoryName.trim()}
                    onClick={() => void handleCreateCategory()}
                    className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
                  >
                    Ajouter la catégorie
                  </Button>
                </div>
                <div className="max-h-[220px] divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
                  {categories.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500">Aucune catégorie.</p>
                  ) : (
                    categories.map((c) => (
                      <div
                        key={c.id}
                        className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 ${
                          c.is_active === false ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{c.name}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {c.section ?? "food"}
                          </Badge>
                          {c.is_active === false ? (
                            <Badge variant="secondary" className="text-[10px]">
                              Inactive
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={categoryBusy}
                            onClick={() => void handleToggleCategoryActive(c)}
                          >
                            {c.is_active === false ? "Activer" : "Désactiver"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={categoryBusy}
                            onClick={() => void handleDeleteCategory(c)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card className="mb-6 border-slate-200 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                  <div className="flex-1 w-full relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Rechercher un plat, tag ou description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {categoryNames.map((cat) => (
                      <Button
                        key={cat}
                        variant={selectedCategory === cat ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(cat)}
                        className={
                          selectedCategory === cat
                            ? "bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500"
                            : ""
                        }
                      >
                        {cat === "all" ? "Tous" : cat}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-slate-400" />
                    {(["name", "price", "popularity"] as SortKey[]).map((key) => (
                      <Button
                        key={key}
                        variant={sortBy === key ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSortBy(key)}
                        className={
                          sortBy === key
                            ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 text-xs h-7"
                            : "text-xs h-7"
                        }
                      >
                        {key === "name" ? "Nom" : key === "price" ? "Prix" : "Popularité"}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((product) => {
                const isPopular = topPopularIds.has(product.id)
                const isOutOfStock = product.stock_quantity === 0
                const replacements = isOutOfStock ? getSameCategoryProducts(product) : []

                return (
                  <Card
                    key={product.id}
                    className={`group overflow-hidden transition-all hover:shadow-lg border-slate-200 dark:border-slate-700 ${
                      !product.is_available ? "opacity-70" : ""
                    }`}
                  >
                    {/* Image */}
                    <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                        </div>
                      )}

                      {/* Drag Handle (cosmetic) */}
                      <div className="absolute top-2 left-2 p-1 rounded bg-black/30 cursor-grab text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Badges overlay */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end">
                        {isPopular && (
                          <Badge className="bg-amber-500 text-white gap-1 text-[10px]">
                            <Star className="w-3 h-3 fill-current" />
                            Populaire
                          </Badge>
                        )}
                        <Badge
                          className={
                            product.is_available
                              ? "bg-emerald-600 text-white text-[10px]"
                              : "bg-slate-600 text-white text-[10px]"
                          }
                        >
                          {product.is_available ? "Disponible" : "Masqué"}
                        </Badge>
                      </div>

                      {/* Stock indicator dot */}
                      <div className="absolute bottom-2 left-2">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isOutOfStock
                                ? "bg-red-500"
                                : product.stock_quantity < 10
                                  ? "bg-amber-400"
                                  : "bg-emerald-400"
                            }`}
                          />
                          <span className="text-white text-[10px] font-medium">
                            {isOutOfStock ? "Rupture" : `${product.stock_quantity} en stock`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      {/* Info */}
                      <div className="mb-3">
                        <div className="flex items-start justify-between mb-1.5">
                          <h3 className="font-bold text-slate-900 dark:text-white leading-tight">
                            {product.name}
                          </h3>
                          <p className="text-lg font-bold text-amber-600 dark:text-amber-400 ml-2 flex-shrink-0">
                            {product.price.toFixed(2)} €
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-[10px]">
                            {product.category?.name ?? "Non classé"}
                          </Badge>
                          {isPopular && (
                            <div className="flex items-center gap-0.5 text-amber-500">
                              <TrendingUp className="w-3 h-3" />
                              <span className="text-[10px] font-medium">
                                Score {product._popularityScore}
                              </span>
                            </div>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                      </div>

                      {/* Replacement suggestions */}
                      {isOutOfStock && replacements.length > 0 && (
                        <div className="mb-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                              Suggestions de remplacement
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {replacements.slice(0, 3).map((r) => (
                              <Badge
                                key={r.id}
                                variant="outline"
                                className="text-[10px] border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                              >
                                {r.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-8 gap-1"
                          onClick={() => openEditModal(product)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleAvailability(product)}
                          title={product.is_available ? "Masquer" : "Rendre visible"}
                        >
                          {product.is_available ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setDeleteConfirm(product)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400">Aucun plat trouvé.</p>
              </div>
            )}

            {/* Add / Edit Modal */}
            {showAddModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
                  <button
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    onClick={closeModal}
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-900 dark:text-white">
                      {editingProduct ? "Modifier le plat" : "Ajouter un plat"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm">Nom du plat</Label>
                      <Input
                        className="mt-1"
                        placeholder="Ex: Pizza Margherita"
                        value={formData.name}
                        onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Nom (arabe)</Label>
                      <Input
                        className="mt-1"
                        dir="rtl"
                        placeholder="…"
                        value={formData.name_ar}
                        onChange={(e) => setFormData((f) => ({ ...f, name_ar: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Description</Label>
                      <Textarea
                        className="mt-1"
                        placeholder="Décrivez le plat..."
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Prix (€)</Label>
                        <Input
                          className="mt-1"
                          type="number"
                          step="0.01"
                          placeholder="12.99"
                          value={formData.price}
                          onChange={(e) => setFormData((f) => ({ ...f, price: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Stock</Label>
                        <Input
                          className="mt-1"
                          type="number"
                          placeholder="50"
                          value={formData.stock_quantity}
                          onChange={(e) =>
                            setFormData((f) => ({ ...f, stock_quantity: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Catégorie</Label>
                      <select
                        className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        value={formData.category_id}
                        onChange={(e) =>
                          setFormData((f) => ({ ...f, category_id: e.target.value }))
                        }
                      >
                        <option value="">Sélectionner...</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                            {cat.section ? ` (${cat.section})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm">Station (cuisine, bar, chicha)</Label>
                      <select
                        className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                        value={formData.station}
                        onChange={(e) => setFormData((f) => ({ ...f, station: e.target.value }))}
                      >
                        <option value="KITCHEN">KITCHEN</option>
                        <option value="BAR">BAR</option>
                        <option value="SHISHA">SHISHA</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm">Visible sur le menu client</Label>
                      <label className="mt-2 flex cursor-pointer items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={formData.is_available}
                          onChange={(e) => setFormData((f) => ({ ...f, is_available: e.target.checked }))}
                          className="mt-0.5"
                        />
                        Afficher comme disponible dans l&apos;admin (stock et recettes peuvent encore bloquer la vente).
                      </label>
                    </div>

                    <div>
                      <Label className="text-sm">Intensité (piment)</Label>
                      <select
                        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                        value={formData.spice_level}
                        onChange={(e) =>
                          setFormData((f) => ({ ...f, spice_level: e.target.value }))
                        }
                      >
                        <option value="">— Non renseigné</option>
                        <option value="doux">doux</option>
                        <option value="moyen">moyen</option>
                        <option value="épicé">épicé</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm">Tags libres</Label>
                      <Input
                        className="mt-1"
                        placeholder="chef, saison, hallal…"
                        value={formData.extra_tags}
                        onChange={(e) => setFormData((f) => ({ ...f, extra_tags: e.target.value }))}
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Séparer par une virgule. Populaire / Nouveau / Végétarien sont pilotés par les cases à cocher.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm">
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={formData.is_popular}
                          onChange={(e) => setFormData((f) => ({ ...f, is_popular: e.target.checked }))}
                        />
                        Populaire
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={formData.is_new}
                          onChange={(e) => setFormData((f) => ({ ...f, is_new: e.target.checked }))}
                        />
                        Nouveau
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={formData.is_vegetarian}
                          onChange={(e) => setFormData((f) => ({ ...f, is_vegetarian: e.target.checked }))}
                        />
                        Végétarien
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={formData.is_chef_choice}
                          onChange={(e) => setFormData((f) => ({ ...f, is_chef_choice: e.target.checked }))}
                        />
                        Choix du chef
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={formData.is_recommended}
                          onChange={(e) => setFormData((f) => ({ ...f, is_recommended: e.target.checked }))}
                        />
                        Recommandé
                      </label>
                    </div>

                    {ingredients.length > 0 && (
                      <div className="rounded-lg border border-slate-200 p-2 dark:border-slate-600">
                        <Label className="text-sm">Recette (stock intelligent)</Label>
                        <p className="text-xs text-slate-500 mb-2">
                          Quantité consommée <strong>par unité de plat</strong> (selon l&apos;unité de
                          l&apos;ingrédient en stock).
                        </p>
                        {recipeLines.map((line, idx) => (
                          <div key={idx} className="mb-2 flex flex-wrap items-end gap-2">
                            <select
                              className="flex-1 min-w-[140px] rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
                              value={line.ingredient_id}
                              onChange={(e) => {
                                const v = e.target.value
                                setRecipeLines((rows) =>
                                  rows.map((r, j) => (j === idx ? { ...r, ingredient_id: v } : r)),
                                )
                              }}
                            >
                              <option value="">Ingrédient</option>
                              {ingredients.map((ing) => (
                                <option key={ing.id} value={ing.id}>
                                  {ing.name} ({ing.unit})
                                </option>
                              ))}
                            </select>
                            <Input
                              className="w-24"
                              type="number"
                              step="any"
                              placeholder="Qté"
                              value={line.quantity}
                              onChange={(e) => {
                                const v = e.target.value
                                setRecipeLines((rows) =>
                                  rows.map((r, j) => (j === idx ? { ...r, quantity: v } : r)),
                                )
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setRecipeLines((rows) => rows.filter((_, j) => j !== idx))}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-1"
                          onClick={() =>
                            setRecipeLines((r) => [...r, { ingredient_id: "", quantity: "1" }])
                          }
                        >
                          + Ingrédient
                        </Button>
                      </div>
                    )}

                    <ProductMenuImageUpload
                      value={formData.image_url}
                      onChange={(url) => setFormData((f) => ({ ...f, image_url: url }))}
                      disabled={saving}
                    />

                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
                        onClick={handleSave}
                        disabled={!formData.name || !formData.price || saving}
                      >
                        {saving
                          ? "En cours..."
                          : editingProduct
                            ? "Enregistrer"
                            : "Ajouter le plat"}
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={closeModal}>
                        Annuler
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <Card className="w-full max-w-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-900 dark:text-white">
                      Confirmer la suppression
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Voulez-vous vraiment supprimer{" "}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {deleteConfirm.name}
                      </span>{" "}
                      ? Cette action est irréversible.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        onClick={handleDelete}
                        disabled={deleting}
                      >
                        {deleting ? "Suppression..." : "Supprimer"}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        Annuler
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </AdminPageFrame>
    </RequireAuth>
  )
}
