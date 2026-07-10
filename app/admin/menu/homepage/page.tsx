"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, RefreshCw, X } from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { AdminPageFrame } from "@/components/site/AdminPageFrame"
import { MenuAdminShell } from "@/components/admin/menu/MenuAdminShell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type Product = {
  id: string
  name: string
  image_url?: string | null
  categories?: { name?: string | null } | null
}

type SectionDef = {
  key: string
  labelDe: string
  labelAr: string
  icon: string
}

function SectionEditor({
  def,
  products,
  selectedIds,
  onChange,
}: {
  def: SectionDef
  products: Product[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const [pickId, setPickId] = useState("")
  const byId = new Map(products.map((p) => [p.id, p]))
  const available = products.filter((p) => !selectedIds.includes(p.id))

  const addProduct = () => {
    if (!pickId || selectedIds.includes(pickId)) return
    onChange([...selectedIds, pickId])
    setPickId("")
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {def.icon} {def.labelDe}
          </h2>
          <p className="text-sm text-slate-500" dir="rtl">
            {def.labelAr}
          </p>
        </div>

        {selectedIds.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500 dark:border-slate-700">
            Keine Produkte ausgewählt. Ohne Auswahl werden Produkte mit passenden Badges als Fallback
            angezeigt.
          </p>
        ) : (
          <ol className="space-y-2">
            {selectedIds.map((id, index) => {
              const product = byId.get(id)
              return (
                <li
                  key={id}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                >
                  <span className="w-6 shrink-0 text-xs font-semibold text-slate-400">{index + 1}.</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {product?.name ?? id}
                    {product?.categories?.name ? (
                      <span className="ml-1 text-slate-400">· {product.categories.name}</span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange(selectedIds.filter((x) => x !== id))}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
                    aria-label="Entfernen"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              )
            })}
          </ol>
        )}

        <div className="flex flex-wrap gap-2">
          <select
            className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm"
            value={pickId}
            onChange={(e) => setPickId(e.target.value)}
          >
            <option value="">Produkt hinzufügen…</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.categories?.name ? ` · ${p.categories.name}` : ""}
              </option>
            ))}
          </select>
          <Button type="button" variant="outline" disabled={!pickId} onClick={addProduct}>
            <Plus className="mr-1 h-4 w-4" />
            Hinzufügen
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminMenuHomepagePage() {
  const [sectionDefs, setSectionDefs] = useState<SectionDef[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sections, setSections] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/menu-homepage", { cache: "no-store" })
    const data = await res.json()
    if (res.ok) {
      setSectionDefs(data.section_defs ?? [])
      setProducts(data.products ?? [])
      setSections(data.sections ?? {})
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/menu-homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? "Speichern fehlgeschlagen")
        return
      }
      await load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <AdminPageFrame title="Startseite">
        <MenuAdminShell title="QR Startseite">
          <p className="mb-4 text-sm text-slate-500">
            Legen Sie fest, welche Produkte auf der QR-Startseite erscheinen. Der vollständige Katalog ist
            nur über die Kategorien erreichbar.
          </p>

          <div className="mb-4 flex gap-2">
            <Button type="button" disabled={saving} onClick={() => void save()}>
              {saving ? "Speichern…" : "Speichern"}
            </Button>
            <Button type="button" variant="outline" onClick={() => void load()}>
              <RefreshCw className="mr-1 h-4 w-4" />
              Aktualisieren
            </Button>
          </div>

          <div className="space-y-6">
            {sectionDefs.map((def) => (
              <SectionEditor
                key={def.key}
                def={def}
                products={products}
                selectedIds={sections[def.key] ?? []}
                onChange={(ids) => setSections((prev) => ({ ...prev, [def.key]: ids }))}
              />
            ))}
          </div>
        </MenuAdminShell>
      </AdminPageFrame>
    </RequireAuth>
  )
}
