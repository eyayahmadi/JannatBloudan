"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Edit2, GripVertical, Plus, RefreshCw, Trash2 } from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { AdminPageFrame } from "@/components/site/AdminPageFrame"
import { MenuAdminShell } from "@/components/admin/menu/MenuAdminShell"
import { AdminDragReorderList } from "@/components/admin/menu/AdminDragReorderList"
import { AdminMenuSectionHeader } from "@/components/admin/menu/AdminMenuSectionHeader"
import { CategoryFormModal, type CategoryFormState } from "@/components/admin/menu/CategoryFormModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  ADMIN_MENU_SECTIONS,
  groupCategoriesBySectionForAdmin,
  type AdminMenuSectionFilter,
} from "@/lib/menu/menu-category-groups"
import { cn } from "@/lib/utils"

type Category = {
  id: string
  name: string
  slug: string
  section?: string
  display_order?: number
  is_active?: boolean
  icon_emoji?: string | null
  name_ar?: string | null
  description?: string | null
}

const EMPTY_CATEGORY_FORM: CategoryFormState = {
  name: "",
  name_ar: "",
  description: "",
  section: "food",
  icon_emoji: "🍽️",
  display_order: "0",
  is_active: true,
}

const SECTION_FILTERS: { id: AdminMenuSectionFilter; label: string }[] = [
  { id: "all", label: "Alle" },
  ...ADMIN_MENU_SECTIONS.map((s) => ({ id: s.id as AdminMenuSectionFilter, label: s.labelDe })),
]

export default function AdminMenuCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [nameAr, setNameAr] = useState("")
  const [section, setSection] = useState("food")
  const [emoji, setEmoji] = useState("🍽️")
  const [busy, setBusy] = useState(false)
  const [reorderMode, setReorderMode] = useState(false)
  const [sectionFilter, setSectionFilter] = useState<AdminMenuSectionFilter>("all")
  const [editing, setEditing] = useState<Category | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<CategoryFormState>(EMPTY_CATEGORY_FORM)

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/catalog", { cache: "no-store" })
    const data = await res.json()
    if (res.ok) {
      setCategories(
        [...(data.categories ?? [])].sort(
          (a: Category, b: Category) => (a.display_order ?? 0) - (b.display_order ?? 0),
        ),
      )
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const sectionBlocks = useMemo(
    () => groupCategoriesBySectionForAdmin(categories, sectionFilter),
    [categories, sectionFilter],
  )

  const create = async () => {
    if (!name.trim() || busy) return
    setBusy(true)
    try {
      await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), section, name_ar: nameAr || null, icon_emoji: emoji }),
      })
      setName("")
      setNameAr("")
      await load()
    } finally {
      setBusy(false)
    }
  }

  const update = async (cat: Category, patch: Partial<Category>) => {
    await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
    await load()
  }

  const remove = async (cat: Category) => {
    if (!confirm(`Kategorie « ${cat.name} » löschen?`)) return
    await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" })
    await load()
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({
      name: cat.name,
      name_ar: cat.name_ar ?? "",
      description: cat.description ?? "",
      section: cat.section ?? "food",
      icon_emoji: cat.icon_emoji ?? "🍽️",
      display_order: String(cat.display_order ?? 0),
      is_active: cat.is_active !== false,
    })
    setModalOpen(true)
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await update(editing, {
        name: form.name.trim(),
        name_ar: form.name_ar.trim() || null,
        description: form.description.trim() || null,
        section: form.section,
        icon_emoji: form.icon_emoji.trim() || null,
        display_order: parseInt(form.display_order, 10) || 0,
        is_active: form.is_active,
      })
      setModalOpen(false)
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  const saveReorder = async (list: Category[]) => {
    await fetch("/api/admin/categories/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: list.map((c, i) => ({ id: c.id, display_order: i })),
      }),
    })
    setReorderMode(false)
    await load()
  }

  const renderCategoryRow = (cat: Category) => (
    <div
      key={cat.id}
      className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-3 dark:bg-slate-900"
    >
      <span className="text-xl">{cat.icon_emoji ?? "🍽️"}</span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{cat.name}</p>
        {cat.name_ar ? (
          <p className="text-xs text-slate-500" dir="rtl">
            {cat.name_ar}
          </p>
        ) : null}
        <p className="text-xs text-slate-400">
          {cat.slug} · #{cat.display_order ?? 0}
          {cat.is_active === false ? " · inaktiv" : ""}
        </p>
      </div>
      <div className="ml-auto flex gap-1">
        <Button type="button" size="sm" variant="outline" aria-label="Bearbeiten" onClick={() => openEdit(cat)}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" variant="outline" aria-label="Löschen" onClick={() => void remove(cat)}>
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    </div>
  )

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <AdminPageFrame title="Kategorien">
        <MenuAdminShell title="Kategorien">
          <Card className="mb-6">
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <Label>Name (DE)</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Name (AR)</Label>
                <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
              </div>
              <div>
                <Label>Emoji</Label>
                <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} />
              </div>
              <div>
                <Label>Bereich</Label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                >
                  <option value="food">Food</option>
                  <option value="desserts">Desserts</option>
                  <option value="drinks">Drinks</option>
                  <option value="special">Special</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={() => void create()} disabled={busy}>
                  <Plus className="mr-1 h-4 w-4" />
                  Erstellen
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
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
            <div className="flex gap-2">
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
                <Button type="button" size="sm" onClick={() => void saveReorder(categories)}>
                  Speichern
                </Button>
              ) : null}
              <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
                <RefreshCw className="mr-1 h-4 w-4" />
                Aktualisieren
              </Button>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-500">Laden…</p>
          ) : reorderMode ? (
            <AdminDragReorderList
              items={categories}
              onReorder={setCategories}
              renderItem={(cat) => (
                <div className="flex items-center gap-3 py-1">
                  <span className="text-xl">{cat.icon_emoji ?? "🍽️"}</span>
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-xs text-slate-500">{cat.section}</span>
                </div>
              )}
            />
          ) : sectionBlocks.length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
              Keine Kategorien für diese Filter gefunden.
            </p>
          ) : (
            <div className="space-y-8">
              {sectionBlocks.map((block) => (
                <div key={block.section} className="space-y-3">
                  {sectionFilter === "all" ? (
                    <AdminMenuSectionHeader icon={block.icon} labelDe={block.labelDe} labelAr={block.labelAr} />
                  ) : null}
                  <div className="space-y-2">{block.categories.map((cat) => renderCategoryRow(cat))}</div>
                </div>
              ))}
            </div>
          )}

          <CategoryFormModal
            open={modalOpen}
            editingName={editing?.name}
            form={form}
            saving={saving}
            onClose={() => {
              setModalOpen(false)
              setEditing(null)
            }}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            onSave={() => void saveEdit()}
          />
        </MenuAdminShell>
      </AdminPageFrame>
    </RequireAuth>
  )
}
