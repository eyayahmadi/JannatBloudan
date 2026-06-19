"use client"

import { useMemo, useState } from "react"
import { Download, Printer, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  JANNAT_TABLE_ZONES,
  PLAN_ZONE_LABELS_FR,
  TABLE_CAPACITIES,
  ZONE_LABELS_FR,
  qrImageUrlForTable,
} from "@/lib/admin/restaurant-tables"
import { cn } from "@/lib/utils"

export type QrTableRow = {
  id: number
  table_number: number
  table_code?: string | null
  display_name?: string | null
  zone: string
  plan_zone?: string | null
  capacity?: number | null
  status?: string | null
  is_active?: boolean | null
  public_url?: string | null
  qr_image_url?: string | null
}

type Props = {
  tables: QrTableRow[]
  siteUrl: string
  qrVersion?: number | null
  onDownload: (t: QrTableRow) => void
}

function qrFor(t: QrTableRow, siteUrl: string, qrVersion?: number | null) {
  const code = (t.table_code && String(t.table_code).trim()) || `t${t.id}`
  if (t.public_url && t.qr_image_url) {
    return { code, img: t.qr_image_url, url: t.public_url }
  }
  const base = siteUrl || "https://jannat-bloudan.vercel.app"
  return {
    code,
    img: qrImageUrlForTable(base, code, 280, qrVersion ?? undefined, "menu"),
    url: `${base.replace(/\/$/, "")}/table/${encodeURIComponent(code)}/menu`,
  }
}

export function TablesQrPrintCenter({ tables, siteUrl, qrVersion, onDownload }: Props) {
  const [zoneFilter, setZoneFilter] = useState<string>("ALL")
  const [capFilter, setCapFilter] = useState<string>("ALL")

  const active = useMemo(() => tables.filter((t) => t.is_active !== false), [tables])

  const filtered = useMemo(() => {
    return active.filter((t) => {
      const z = String(t.plan_zone || t.zone || "")
      if (zoneFilter !== "ALL" && z !== zoneFilter) return false
      if (capFilter !== "ALL" && String(t.capacity ?? "") !== capFilter) return false
      return true
    })
  }, [active, zoneFilter, capFilter])

  const byZone = useMemo(() => {
    const buckets: Record<string, QrTableRow[]> = {}
    for (const z of JANNAT_TABLE_ZONES) buckets[z] = []
    for (const t of filtered) {
      const z = String(t.plan_zone || t.zone || "terrasse")
      if (!buckets[z]) buckets[z] = []
      buckets[z].push(t)
    }
    for (const k of Object.keys(buckets)) {
      buckets[k].sort((a, b) => String(a.table_code).localeCompare(String(b.table_code)))
    }
    return buckets
  }, [filtered])

  const printZone = (zone: string) => {
    const el = document.getElementById(`qr-print-zone-${zone}`)
    if (!el) return
    const w = window.open("", "_blank", "width=900,height=700")
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><title>QR ${zone}</title>
      <style>
        body{font-family:Georgia,serif;margin:24px;background:#fbf7ef}
        .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
        .card{border:2px solid #c9a24c;border-radius:16px;padding:20px;text-align:center;background:#fff;break-inside:avoid}
        .logo{font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:#6e1d2b;margin-bottom:8px}
        .code{font-size:28px;font-weight:bold;color:#2b241c;margin:4px 0}
        .meta{font-size:12px;color:#666;margin:4px 0}
        .scan{font-size:13px;color:#6e1d2b;margin:12px 0;font-style:italic}
        img{width:200px;height:200px}
        @media print{.card{page-break-inside:avoid}}
      </style></head><body>${el.innerHTML}</body></html>`)
    w.document.close()
    w.focus()
    w.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-900/50">Zone</span>
        <FilterChip label="Toutes" active={zoneFilter === "ALL"} onClick={() => setZoneFilter("ALL")} />
        {JANNAT_TABLE_ZONES.map((z) => (
          <FilterChip
            key={z}
            label={ZONE_LABELS_FR[z] ?? z}
            active={zoneFilter === z}
            onClick={() => setZoneFilter(z)}
          />
        ))}
        <span className="ml-4 text-xs font-semibold uppercase tracking-wider text-amber-900/50">Capacité</span>
        <FilterChip label="Toutes" active={capFilter === "ALL"} onClick={() => setCapFilter("ALL")} />
        {TABLE_CAPACITIES.map((c) => (
          <FilterChip
            key={c}
            label={`${c} pers.`}
            active={capFilter === String(c)}
            onClick={() => setCapFilter(String(c))}
          />
        ))}
        <Button type="button" variant="outline" size="sm" className="ml-auto" onClick={() => window.print()}>
          <Printer className="mr-1.5 h-4 w-4" />
          Imprimer tout ({filtered.length})
        </Button>
      </div>

      {JANNAT_TABLE_ZONES.map((zone) => {
        const rows = zoneFilter === "ALL" || zoneFilter === zone ? byZone[zone] ?? [] : []
        if (!rows.length) return null
        return (
          <section key={zone} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
              <h3 className="font-display text-lg font-semibold text-amber-950">
                {PLAN_ZONE_LABELS_FR[zone] ?? zone}
                <Badge variant="secondary" className="ml-2">
                  {rows.length}
                </Badge>
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={() => printZone(zone)}>
                <Printer className="mr-1.5 h-4 w-4" />
                Imprimer zone
              </Button>
            </div>
            <div id={`qr-print-zone-${zone}`} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rows.map((t) => {
                const { code, img, url } = qrFor(t, siteUrl, qrVersion)
                const zoneLabel = ZONE_LABELS_FR[t.zone] ?? t.zone
                return (
                  <div
                    key={t.id}
                    className={cn(
                      "qr-print-card flex flex-col items-center rounded-2xl border-2 border-[color:var(--lux-gold)]/40",
                      "bg-white p-5 text-center shadow-md print:break-inside-avoid",
                    )}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-bordeaux)]">
                      Jannat Bloudan
                    </p>
                    <p className="font-display mt-2 text-3xl font-bold text-amber-950">{code}</p>
                    <p className="mt-1 text-xs text-amber-900/70">{zoneLabel}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-amber-800/60">
                      <Users className="h-3 w-3" />
                      {t.capacity ?? 4} personnes
                    </p>
                    <p className="mt-3 text-sm italic text-[color:var(--lux-bordeaux)]">Scannez pour commander</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`QR ${code}`} width={200} height={200} className="my-3 rounded-lg" />
                    <p className="max-w-[220px] break-all text-[9px] text-amber-900/45">{url}</p>
                    <div className="mt-3 flex gap-2 print:hidden">
                      <Button type="button" size="sm" variant="outline" onClick={() => onDownload(t)}>
                        <Download className="mr-1 h-3.5 w-3.5" />
                        PNG
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition",
        active
          ? "border-[color:var(--lux-bordeaux)] bg-[color:var(--lux-bordeaux)] text-white"
          : "border-amber-900/15 bg-white/80 text-amber-900/80 hover:border-amber-900/30",
      )}
    >
      {label}
    </button>
  )
}
