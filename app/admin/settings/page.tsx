"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Settings as SettingsIcon,
  Save,
  Loader2,
  Plus,
  Database,
  Bot,
  Palette,
  CreditCard,
  Bell,
  Search,
} from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

type SettingRow = {
  key: string
  value: unknown
  description?: string | null
  category?: string | null
  updated_at?: string | null
}

const CATEGORY_META: Record<string, { label: string; icon: any; color: string }> = {
  restaurant: { label: "Restaurant", icon: SettingsIcon, color: "text-amber-600" },
  ai: { label: "Intelligence artificielle", icon: Bot, color: "text-violet-600" },
  ui: { label: "Interface", icon: Palette, color: "text-pink-600" },
  payment: { label: "Paiement", icon: CreditCard, color: "text-green-600" },
  notifications: { label: "Notifications", icon: Bell, color: "text-blue-600" },
  integrations: { label: "Integrations", icon: Database, color: "text-cyan-600" },
}

export default function AdminSettingsPage() {
  const [rows, setRows] = useState<SettingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [source, setSource] = useState<string>("mock")
  const [dirty, setDirty] = useState<Record<string, unknown>>({})
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [newSetting, setNewSetting] = useState({
    key: "",
    category: "restaurant",
    valueType: "string" as "string" | "number" | "boolean" | "json",
    value: "",
    description: "",
  })

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/settings")
      if (res.ok) {
        const data = await res.json()
        setSource(data.source ?? "unknown")
        setRows(data.rows ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<string, SettingRow[]>()
    const filtered = rows.filter((r) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return r.key.toLowerCase().includes(q) || (r.description ?? "").toLowerCase().includes(q)
    })
    for (const r of filtered) {
      const cat = r.category ?? "autre"
      const arr = map.get(cat) ?? []
      arr.push(r)
      map.set(cat, arr)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [rows, search])

  const getValue = (r: SettingRow): unknown => {
    if (r.key in dirty) return dirty[r.key]
    return r.value
  }

  const setValue = (key: string, value: unknown) => {
    setDirty((prev) => ({ ...prev, [key]: value }))
  }

  const saveAll = async () => {
    if (Object.keys(dirty).length === 0) return
    setSaving(true)
    try {
      const updates = Object.entries(dirty).map(([key, value]) => ({
        key,
        value,
      }))
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      })
      if (res.ok) {
        setDirty({})
        await load()
      }
    } finally {
      setSaving(false)
    }
  }

  const addSetting = async () => {
    if (!newSetting.key) return
    let parsed: unknown = newSetting.value
    try {
      if (newSetting.valueType === "number") parsed = Number(newSetting.value)
      else if (newSetting.valueType === "boolean") parsed = newSetting.value === "true"
      else if (newSetting.valueType === "json") parsed = JSON.parse(newSetting.value)
    } catch {
      // keep string
    }

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        updates: [
          {
            key: newSetting.key,
            value: parsed,
            category: newSetting.category,
            description: newSetting.description,
          },
        ],
      }),
    })
    if (res.ok) {
      setShowAdd(false)
      setNewSetting({
        key: "",
        category: "restaurant",
        valueType: "string",
        value: "",
        description: "",
      })
      await load()
    }
  }

  const hasChanges = Object.keys(dirty).length > 0

  return (
    <RequireAuth roles={["ADMIN"]}>
      <PageShell>
        <SiteHeader
          backHref="/admin"
          hideMainNav
          trailing={
            hasChanges && (
              <Button onClick={saveAll} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Enregistrer ({Object.keys(dirty).length})
              </Button>
            )
          }
        />

        <div className="mx-auto max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <SettingsIcon className="h-7 w-7 text-slate-600" />
                Parametres systeme
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {source === "supabase" ? (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2" />
                    {rows.length} parametres synchronises avec Supabase
                  </>
                ) : (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-orange-500 mr-2" />
                    Mode demo
                  </>
                )}
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowAdd(!showAdd)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau parametre
            </Button>
          </div>

          {/* Recherche */}
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-10"
              placeholder="Rechercher une cle ou description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {showAdd && (
            <Card className="mb-6 border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/10">
              <CardHeader>
                <CardTitle>Ajouter un parametre</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Cle *</label>
                  <Input
                    placeholder="ex: ai.new_feature_enabled"
                    value={newSetting.key}
                    onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Categorie</label>
                  <Input
                    value={newSetting.category}
                    onChange={(e) =>
                      setNewSetting({ ...newSetting, category: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Type</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border bg-background"
                    value={newSetting.valueType}
                    onChange={(e) =>
                      setNewSetting({
                        ...newSetting,
                        valueType: e.target.value as any,
                      })
                    }
                  >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                    <option value="json">json</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Valeur</label>
                  {newSetting.valueType === "boolean" ? (
                    <select
                      className="w-full h-10 px-3 rounded-md border bg-background"
                      value={newSetting.value || "true"}
                      onChange={(e) =>
                        setNewSetting({ ...newSetting, value: e.target.value })
                      }
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : (
                    <Input
                      value={newSetting.value}
                      onChange={(e) =>
                        setNewSetting({ ...newSetting, value: e.target.value })
                      }
                    />
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Textarea
                    rows={2}
                    value={newSetting.description}
                    onChange={(e) =>
                      setNewSetting({ ...newSetting, description: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAdd(false)}>
                    Annuler
                  </Button>
                  <Button onClick={addSetting} disabled={!newSetting.key}>
                    Creer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
            </div>
          ) : grouped.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-slate-500">
                Aucun parametre trouve.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {grouped.map(([category, items]) => {
                const meta = CATEGORY_META[category] ?? {
                  label: category,
                  icon: SettingsIcon,
                  color: "text-slate-600",
                }
                const Icon = meta.icon
                return (
                  <Card key={category} className="dark:bg-slate-800/60 dark:border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${meta.color}`} />
                        {meta.label}
                        <Badge variant="outline">{items.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {items.map((row) => {
                          const current = getValue(row)
                          const isBool = typeof row.value === "boolean"
                          const isNum = typeof row.value === "number"
                          const isObj =
                            typeof row.value === "object" && row.value !== null
                          const isDirty = row.key in dirty

                          return (
                            <div
                              key={row.key}
                              className={`rounded-lg border p-4 transition-colors ${
                                isDirty
                                  ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
                                  : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <code className="text-xs font-mono font-semibold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                                      {row.key}
                                    </code>
                                    {isDirty && (
                                      <Badge className="bg-amber-100 text-amber-700 text-xs">
                                        Modifie
                                      </Badge>
                                    )}
                                  </div>
                                  {row.description && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {row.description}
                                    </p>
                                  )}
                                </div>

                                <div className="flex-shrink-0 min-w-[200px]">
                                  {isBool ? (
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={Boolean(current)}
                                        onCheckedChange={(v) => setValue(row.key, v)}
                                      />
                                      <span className="text-xs">
                                        {current ? "Active" : "Desactive"}
                                      </span>
                                    </div>
                                  ) : isNum ? (
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={String(current ?? 0)}
                                      onChange={(e) =>
                                        setValue(row.key, Number(e.target.value))
                                      }
                                      className="h-9"
                                    />
                                  ) : isObj ? (
                                    <Textarea
                                      rows={2}
                                      value={JSON.stringify(current, null, 2)}
                                      onChange={(e) => {
                                        try {
                                          setValue(row.key, JSON.parse(e.target.value))
                                        } catch {
                                          /* keep typing */
                                        }
                                      }}
                                      className="font-mono text-xs"
                                    />
                                  ) : (
                                    <Input
                                      value={String(current ?? "")}
                                      onChange={(e) => setValue(row.key, e.target.value)}
                                      className="h-9"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {hasChanges && (
            <div className="fixed bottom-6 right-6 shadow-lg">
              <Card className="border-amber-400 bg-amber-50 dark:bg-amber-950/80">
                <CardContent className="p-4 flex items-center gap-3">
                  <Badge className="bg-amber-200 text-amber-800">
                    {Object.keys(dirty).length} modifications non enregistrees
                  </Badge>
                  <Button onClick={saveAll} disabled={saving} size="sm">
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Enregistrer
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
