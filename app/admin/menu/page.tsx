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

type Category = {
  id: string
  name: string
  slug: string
}

type Product = {
  id: string
  name: string
  price: number
  stock_quantity: number
  category: { id: string; name: string; slug: string } | null
  image_url: string | null
  is_available: boolean
  description: string | null
  _popularityScore?: number
}

type ProductFormData = {
  name: string
  description: string
  price: string
  category_id: string
  stock_quantity: string
  image_url: string
}

const EMPTY_FORM: ProductFormData = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  stock_quantity: "",
  image_url: "",
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

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products")
      const data = await res.json()
      const prods: Product[] = (data.products ?? []).map((p: Product) => ({
        ...p,
        _popularityScore: getPopularityScore(p),
      }))
      setProducts(prods)
    } catch {
      /* ignore */
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      setCategories(data.categories ?? [])
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()]).finally(() => setLoading(false))
  }, [fetchProducts, fetchCategories])

  const topPopularIds = useMemo(() => {
    const sorted = [...products].sort(
      (a, b) => (b._popularityScore ?? 0) - (a._popularityScore ?? 0),
    )
    return new Set(sorted.slice(0, 5).map((p) => p.id))
  }, [products])

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCat = selectedCategory === "all" || p.category?.name === selectedCategory
      return matchSearch && matchCat
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
    setShowAddModal(true)
  }

  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description ?? "",
      price: product.price.toString(),
      category_id: product.category?.id ?? "",
      stock_quantity: product.stock_quantity.toString(),
      image_url: product.image_url ?? "",
    })
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
      const payload = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price) || 0,
        category_id: formData.category_id || null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        image_url: formData.image_url || null,
      }

      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const data = await res.json()
          setProducts((prev) =>
            prev.map((p) =>
              p.id === editingProduct.id
                ? { ...p, ...data.product, _popularityScore: p._popularityScore }
                : p,
            ),
          )
          closeModal()
        }
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          await fetchProducts()
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
      const res = await fetch(`/api/products/${deleteConfirm.id}`, { method: "DELETE" })
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
      const res = await fetch(`/api/products/${product.id}`, {
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
            {/* Filters */}
            <Card className="mb-6 border-slate-200 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                  <div className="flex-1 w-full relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Rechercher un plat..."
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
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm">URL de l&apos;image</Label>
                      <Input
                        className="mt-1"
                        placeholder="https://example.com/image.jpg"
                        value={formData.image_url}
                        onChange={(e) => setFormData((f) => ({ ...f, image_url: e.target.value }))}
                      />
                      {formData.image_url && (
                        <div className="mt-2 h-32 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <img
                            src={formData.image_url}
                            alt="Aperçu"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).style.display = "none"
                            }}
                          />
                        </div>
                      )}
                    </div>

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
