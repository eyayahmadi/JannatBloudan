"use client"

import { useCallback, useEffect, useState } from "react"
import { GripVertical, Plus, RefreshCw, Trash2 } from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { AdminPageFrame } from "@/components/site/AdminPageFrame"
import { MenuAdminShell } from "@/components/admin/menu/MenuAdminShell"
import { AdminDragReorderList } from "@/components/admin/menu/AdminDragReorderList"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

type Category = {
  id: string
  name: string
  slug: string
  section?: string
  display_order?: number
  is_active?: boolean
  icon_emoji?: string | null
  name_ar?: string | null
}

export default function AdminMenuCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [nameAr, setNameAr] = useState("")
  const [section, setSection] = useState("food")
  const [emoji, setEmoji] = useState("🍽️")
  const [busy, setBusy] = useState(false)
  const [reorderMode, setReorderMode] = useState(false)

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
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
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

          <div className="mb-3 flex justify-end gap-2">
            <Button type="button" variant={reorderMode ? "default" : "outline"} size="sm" onClick={() => setReorderMode((v) => !v)}>
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
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-3 dark:bg-slate-900"
                >
                  <span className="text-xl">{cat.icon_emoji ?? "🍽️"}</span>
                  <Input
                    className="max-w-[180px]"
                    defaultValue={cat.name}
                    onBlur={(e) => {
                      if (e.target.value !== cat.name) void update(cat, { name: e.target.value })
                    }}
                  />
                  <Input
                    className="max-w-[140px]"
                    defaultValue={cat.name_ar ?? ""}
                    dir="rtl"
                    onBlur={(e) => {
                      if (e.target.value !== (cat.name_ar ?? "")) void update(cat, { name_ar: e.target.value })
                    }}
                  />
                  <select
                    className="rounded-md border px-2 py-1.5 text-sm"
                    value={cat.section ?? "food"}
                    onChange={(e) => void update(cat, { section: e.target.value })}
                  >
                    <option value="food">food</option>
                    <option value="desserts">desserts</option>
                    <option value="drinks">drinks</option>
                    <option value="special">special</option>
                  </select>
                  <Input
                    className="w-16 text-center"
                    defaultValue={cat.icon_emoji ?? ""}
                    onBlur={(e) => void update(cat, { icon_emoji: e.target.value })}
                  />
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={cat.is_active !== false}
                      onChange={(e) => void update(cat, { is_active: e.target.checked })}
                    />
                    Aktiv
                  </label>
                  <div className="ml-auto">
                    <Button type="button" size="sm" variant="outline" onClick={() => void remove(cat)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </MenuAdminShell>
      </AdminPageFrame>
    </RequireAuth>
  )
}
