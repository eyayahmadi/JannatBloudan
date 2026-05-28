"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Download,
  Eye,
  Grid3x3,
  List,
  MapPin,
  Pencil,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { ClientPreviewDialog } from "@/components/admin/ClientPreviewDialog"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { AdminPageFrame } from "@/components/site/AdminPageFrame"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PLAN_ZONE_LABELS_FR,
  STATUS_LABELS_FR,
  TABLE_ADMIN_STATUSES,
  TABLE_BUSINESS_ZONES,
  TABLE_PLAN_ZONES,
  ZONE_LABELS_FR,
  qrImageUrlForTable,
  publicTableUrl,
} from "@/lib/admin/restaurant-tables"
import { cn } from "@/lib/utils"

type RestaurantTable = {
  id: number
  table_number: number
  display_name?: string | null
  table_code?: string | null
  zone: string
  plan_zone?: string | null
  capacity?: number | null
  status?: string | null
  position_x?: number | null
  position_y?: number | null
  is_active?: boolean | null
  current_session_id?: string | null
}

const siteBase =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
    : ""

export default function AdminTablesQRPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("liste")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RestaurantTable | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    table_number: "",
    display_name: "",
    table_code: "",
    zone: "salle",
    plan_zone: "salle",
    capacity: "4",
    position_x: "0",
    position_y: "0",
    status: "FREE",
    is_active: true,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/restaurant-tables")
      const j = await res.json()
      if (res.ok && Array.isArray(j.tables)) setTables(j.tables)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({
      table_number: "",
      display_name: "",
      table_code: "",
      zone: "salle",
      plan_zone: "salle",
      capacity: "4",
      position_x: "0",
      position_y: "0",
      status: "FREE",
      is_active: true,
    })
    setDialogOpen(true)
  }

  const openEdit = (t: RestaurantTable) => {
    setEditing(t)
    setForm({
      table_number: String(t.table_number),
      display_name: t.display_name ?? "",
      table_code: t.table_code ?? "",
      zone: t.zone,
      plan_zone: (t.plan_zone as string) || "salle",
      capacity: String(t.capacity ?? 4),
      position_x: String(t.position_x ?? 0),
      position_y: String(t.position_y ?? 0),
      status: String(t.status ?? "FREE"),
      is_active: t.is_active !== false,
    })
    setDialogOpen(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      if (editing) {
        const res = await fetch(`/api/admin/restaurant-tables/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table_number: Number(form.table_number),
            display_name: form.display_name || null,
            table_code: form.table_code,
            zone: form.zone,
            plan_zone: form.plan_zone,
            capacity: Number(form.capacity),
            position_x: Number(form.position_x),
            position_y: Number(form.position_y),
            status: form.status,
            is_active: form.is_active,
          }),
        })
        const j = await res.json().catch(() => ({}))
        if (!res.ok) {
          alert(typeof j.error === "string" ? j.error : "Erreur enregistrement")
          return
        }
      } else {
        const res = await fetch("/api/admin/restaurant-tables", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table_number: Number(form.table_number),
            display_name: form.display_name || null,
            table_code: form.table_code || undefined,
            zone: form.zone,
            plan_zone: form.plan_zone,
            capacity: Number(form.capacity),
            position_x: Number(form.position_x),
            position_y: Number(form.position_y),
            status: form.status,
            is_active: form.is_active,
          }),
        })
        const j = await res.json().catch(() => ({}))
        if (!res.ok) {
          alert(typeof j.error === "string" ? j.error : "Erreur création")
          return
        }
      }
      setDialogOpen(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const disableTable = async (t: RestaurantTable) => {
    if (!confirm(`Désactiver la table ${t.table_number} ? (session doit être fermée)`)) return
    const res = await fetch(`/api/admin/restaurant-tables/${t.id}`, { method: "DELETE" })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(typeof j.error === "string" ? j.error : "Impossible de désactiver")
      return
    }
    await load()
  }

  const qrFor = (t: RestaurantTable) => {
    const code = (t.table_code && String(t.table_code).trim()) || `t${t.id}`
    const base = siteBase || (typeof window !== "undefined" ? window.location.origin : "")
    return { code, img: qrImageUrlForTable(base || "http://localhost:3000", code, 200), url: publicTableUrl(base || "http://localhost:3000", code) }
  }

  const downloadQr = async (t: RestaurantTable) => {
    const { img, code } = qrFor(t)
    try {
      const response = await fetch(img)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `qr-${code}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      window.open(img, "_blank")
    }
  }

  const printAll = () => window.print()

  const planBuckets = useMemo(() => {
    const active = tables.filter((t) => t.is_active !== false)
    const bucket: Record<string, RestaurantTable[]> = { terrasse: [], salle: [], interieur: [] }
    for (const t of active) {
      const p = (t.plan_zone as string) || "salle"
      const key = p in bucket ? p : "salle"
      bucket[key].push(t)
    }
    for (const k of Object.keys(bucket)) {
      bucket[k].sort((a, b) => (a.position_y ?? 0) - (b.position_y ?? 0) || (a.position_x ?? 0) - (b.position_x ?? 0))
    }
    return bucket
  }, [tables])

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]}>
      <AdminPageFrame
        title="Tables QR"
        subtitle="Créez les tables, organisez le plan (terrasse / salle / intérieur), générez les QR vers le menu et l’expérience client. La caisse gère déjà split invités, transfert, hospitalité et promos."
        trailing={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} />
              Actualiser
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={printAll}>
              <Printer className="mr-1.5 h-4 w-4" />
              Imprimer QR
            </Button>
            <Button type="button" size="sm" className="bg-[color:var(--lux-bordeaux)] text-white" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Ajouter une table
            </Button>
          </div>
        }
      >
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="print:hidden">
            <TabsTrigger value="liste" className="gap-1.5">
              <List className="h-4 w-4" />
              Liste & QR
            </TabsTrigger>
            <TabsTrigger value="plan" className="gap-1.5">
              <Grid3x3 className="h-4 w-4" />
              Plan de salle
            </TabsTrigger>
          </TabsList>

          <TabsContent value="liste" className="space-y-4">
            {loading ? (
              <p className="text-sm text-amber-900/60">Chargement…</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tables.map((t) => {
                  const { img, url, code } = qrFor(t)
                  const inactive = t.is_active === false
                  return (
                    <Card
                      key={t.id}
                      className={cn(
                        "overflow-hidden border-amber-900/10 print:break-inside-avoid",
                        inactive && "opacity-50",
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-display text-lg font-semibold text-amber-950 dark:text-amber-50">
                                Table {t.table_number}
                              </span>
                              {inactive ? (
                                <Badge variant="secondary">Désactivée</Badge>
                              ) : (
                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                                  {STATUS_LABELS_FR[String(t.status ?? "FREE")] ?? t.status}
                                </Badge>
                              )}
                            </div>
                            {t.display_name ? (
                              <p className="text-xs text-amber-900/65">{t.display_name}</p>
                            ) : null}
                            <p className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-amber-800/70">
                              <MapPin className="h-3 w-3" />
                              {ZONE_LABELS_FR[t.zone] ?? t.zone} · {t.capacity ?? "—"} pers.
                            </p>
                            <p className="mt-0.5 font-mono text-[10px] text-amber-900/50">QR : {code}</p>
                            {t.current_session_id ? (
                              <p className="mt-1 text-[10px] font-medium text-amber-800">Session ouverte</p>
                            ) : null}
                          </div>
                          <QrCode className="h-6 w-6 shrink-0 text-[color:var(--lux-bordeaux)]" />
                        </div>
                        <div className="mt-3 flex justify-center rounded-xl border border-amber-900/10 bg-white p-2 dark:bg-zinc-900">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt={`QR ${code}`} width={160} height={160} className="h-40 w-40" />
                        </div>
                        <p className="mt-2 truncate text-center text-[10px] text-amber-800/60">{url}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5 print:hidden">
                          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => openEdit(t)}>
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Modifier
                          </Button>
                          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => void downloadQr(t)}>
                            <Download className="mr-1 h-3.5 w-3.5" />
                            PNG
                          </Button>
                          <ClientPreviewDialog
                            url={url}
                            label={`Table ${t.table_number}${t.display_name ? " · " + t.display_name : ""}`}
                            triggerLabel="Vue client"
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-rose-700"
                            onClick={() => void disableTable(t)}
                            disabled={inactive}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="plan">
            <p className="mb-4 text-sm text-amber-900/65 print:hidden">
              Ajustez <strong>position X / Y</strong> dans chaque fiche pour ordonner les cartes (grille simplifiée).
            </p>
            <div className="grid gap-4 lg:grid-cols-3">
              {TABLE_PLAN_ZONES.map((pz) => (
                <div key={pz} className="rounded-2xl border border-amber-900/10 bg-amber-50/40 p-4 dark:bg-zinc-900/40">
                  <h3 className="mb-3 font-display text-sm font-semibold text-amber-950 dark:text-amber-100">
                    {PLAN_ZONE_LABELS_FR[pz]}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {planBuckets[pz].length === 0 ? (
                      <p className="text-xs text-amber-900/50">Aucune table dans cette zone de plan.</p>
                    ) : (
                      planBuckets[pz].map((t) => {
                        const { img, code } = qrFor(t)
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => openEdit(t)}
                            className="flex gap-3 rounded-xl border border-amber-900/15 bg-white p-3 text-left shadow-sm transition hover:border-[color:var(--lux-gold)]/50 dark:bg-zinc-950"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-lg border" />
                            <div className="min-w-0">
                              <div className="font-semibold text-amber-950 dark:text-amber-50">
                                Table {t.table_number}
                                <span className="ml-2 text-[10px] font-normal text-amber-800/60">{code}</span>
                              </div>
                              <div className="text-[11px] text-amber-900/65">
                                {ZONE_LABELS_FR[t.zone] ?? t.zone} · cap. {t.capacity ?? "—"}
                              </div>
                              <Badge variant="outline" className="mt-1 text-[10px]">
                                {STATUS_LABELS_FR[String(t.status ?? "FREE")] ?? t.status}
                              </Badge>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? `Modifier table ${editing.table_number}` : "Nouvelle table"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>N° table</Label>
                  <Input
                    value={form.table_number}
                    onChange={(e) => setForm((f) => ({ ...f, table_number: e.target.value }))}
                    inputMode="numeric"
                    disabled={Boolean(editing)}
                  />
                </div>
                <div>
                  <Label>Capacité max</Label>
                  <Input
                    value={form.capacity}
                    onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div>
                <Label>Nom affiché (optionnel)</Label>
                <Input value={form.display_name} onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} />
              </div>
              <div>
                <Label>Code QR / URL ({`table/{code}`})</Label>
                <Input
                  value={form.table_code}
                  onChange={(e) => setForm((f) => ({ ...f, table_code: e.target.value }))}
                  placeholder="ex. t12 ou vip-nord"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Zone métier</Label>
                  <Select value={form.zone} onValueChange={(v) => setForm((f) => ({ ...f, zone: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TABLE_BUSINESS_ZONES.map((z) => (
                        <SelectItem key={z} value={z}>
                          {ZONE_LABELS_FR[z] ?? z}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Colonne plan</Label>
                  <Select value={form.plan_zone} onValueChange={(v) => setForm((f) => ({ ...f, plan_zone: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TABLE_PLAN_ZONES.map((z) => (
                        <SelectItem key={z} value={z}>
                          {PLAN_ZONE_LABELS_FR[z]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Position X (plan)</Label>
                  <Input value={form.position_x} onChange={(e) => setForm((f) => ({ ...f, position_x: e.target.value }))} />
                </div>
                <div>
                  <Label>Position Y (plan)</Label>
                  <Input value={form.position_y} onChange={(e) => setForm((f) => ({ ...f, position_y: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Statut (réf. caisse)</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {TABLE_ADMIN_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS_FR[s] ?? s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                <Label htmlFor="is_active">Table active (QR utilisable)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="button" onClick={() => void save()} disabled={saving}>
                {saving ? "…" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminPageFrame>
    </RequireAuth>
  )
}
