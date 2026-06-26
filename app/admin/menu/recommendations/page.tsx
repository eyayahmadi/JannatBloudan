"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { AdminPageFrame } from "@/components/site/AdminPageFrame"
import { MenuAdminShell } from "@/components/admin/menu/MenuAdminShell"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

type Product = { id: string; name: string }

export default function AdminMenuRecommendationsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [recommendations, setRecommendations] = useState<Record<string, string[]>>({})
  const [selectedId, setSelectedId] = useState("")
  const [selectedRecs, setSelectedRecs] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/catalog", { cache: "no-store" })
    const data = await res.json()
    if (res.ok) {
      setProducts((data.products ?? []).map((p: Product) => ({ id: p.id, name: p.name })))
      setRecommendations(data.recommendations ?? {})
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (selectedId) setSelectedRecs(recommendations[selectedId] ?? [])
    else setSelectedRecs([])
  }, [selectedId, recommendations])

  const save = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      await fetch(`/api/admin/product-recommendations/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommended_product_ids: selectedRecs }),
      })
      await load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <AdminPageFrame title="Empfehlungen">
        <MenuAdminShell title="Empfehlungen">
          <p className="mb-4 text-sm text-slate-500">
            Wählen Sie für jedes Produkt passende Empfehlungen — sie erscheinen im QR-Menü unter « Passt dazu ».
          </p>

          <Card>
            <CardContent className="space-y-4 p-4">
              <div>
                <Label>Produkt</Label>
                <select
                  className="mt-1 w-full max-w-md rounded-md border px-3 py-2 text-sm"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  <option value="">Wählen…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedId ? (
                <div>
                  <Label>Empfohlene Produkte</Label>
                  <select
                    multiple
                    className="mt-1 h-48 w-full max-w-md rounded-md border px-2 py-1 text-sm"
                    value={selectedRecs}
                    onChange={(e) => setSelectedRecs(Array.from(e.target.selectedOptions).map((o) => o.value))}
                  >
                    {products
                      .filter((p) => p.id !== selectedId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">Strg/Cmd + Klick für Mehrfachauswahl</p>
                </div>
              ) : null}

              <div className="flex gap-2">
                <Button type="button" disabled={!selectedId || saving} onClick={() => void save()}>
                  {saving ? "Speichern…" : "Speichern"}
                </Button>
                <Button type="button" variant="outline" onClick={() => void load()}>
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Aktualisieren
                </Button>
              </div>
            </CardContent>
          </Card>
        </MenuAdminShell>
      </AdminPageFrame>
    </RequireAuth>
  )
}
