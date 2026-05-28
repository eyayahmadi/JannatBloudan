"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Banknote,
  CreditCard,
  Globe,
  Crown,
  FileDown,
  Flame,
  PiggyBank,
  Printer,
  RefreshCw,
  TrendingUp,
  Truck,
  Wallet,
  Utensils,
  Wine,
  Cigarette,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PremiumStatCard } from "@/components/ui/premium"
import { ScrollArea } from "@/components/ui/scroll-area"
import { STATION_META, type Station } from "@/lib/stations/config"
import { cn } from "@/lib/utils"

type DailyBreakdown = {
  date: string
  totals: {
    revenue: number
    revenue_paid: number
    revenue_unpaid: number
    revenue_credit: number
    discounts: number
    hospitality: number
    refunds: number
    cancelled: number
  }
  by_station: Record<
    Station,
    {
      revenue: number
      units_sold: number
      items_count: number
      cancelled_amount: number
      waste_count: number
      top: Array<{
        product_id: string | null
        product_name: string
        units_sold: number
        revenue: number
        station: Station
        refused_count: number
      }>
    }
  >
  by_payment: Record<string, number>
  by_platform: Record<string, number>
  platform_cash: number
  platform_non_cash: number
  credit: {
    open_invoices: number
    overdue_invoices: number
    total_remaining: number
  }
  caisse: {
    total_in_drawer_expected: number
    cash_in: number
    cash_out: number
    employee_advances: number
  }
  best_station: { station: Station | null; revenue: number }
}

const STATION_ICON: Record<Station, React.ComponentType<{ className?: string }>> = {
  KITCHEN: Utensils,
  BAR: Wine,
  SHISHA: Cigarette,
}

const PAYMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cash: Banknote,
  card: CreditCard,
  online: Globe,
  wallet: Wallet,
  hospitality: Crown,
  bank_transfer: Wallet,
}

const PLATFORM_LABEL: Record<string, string> = {
  lieferando: "Lieferando",
  wolt: "Wolt",
  uber_eats: "Uber Eats",
  just_eat: "Just Eat",
  glovo: "Glovo",
  deliveroo: "Deliveroo",
  bank_transfer: "Virement bancaire",
  platform_payout: "Versement plateforme",
  other: "Autre",
}

function eur(n: number | null | undefined) {
  return Number(n ?? 0).toFixed(2).replace(".", ",")
}

export function DailyRevenueDashboard({ date }: { date: string }) {
  const [data, setData] = useState<DailyBreakdown | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/caisse/revenue/daily?date=${encodeURIComponent(date)}`)
      const j = await res.json()
      if (!res.ok) {
        toast.error(j.error ?? "Rapport indisponible")
        return
      }
      setData(j.breakdown as DailyBreakdown)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    void load()
  }, [load])

  const exportCsv = () => {
    const url = `/api/caisse/revenue/daily?date=${encodeURIComponent(date)}&format=csv`
    window.open(url, "_blank")
  }

  const exportPdf = () => {
    if (typeof window === "undefined") return
    window.print()
  }

  const stationEntries = useMemo<Array<{ station: Station; data: DailyBreakdown["by_station"][Station] }>>(() => {
    if (!data) return []
    return (["KITCHEN", "BAR", "SHISHA"] as Station[]).map((s) => ({
      station: s,
      data: data.by_station[s],
    }))
  }, [data])

  const paymentTotal = useMemo(() => {
    if (!data) return 0
    return Object.values(data.by_payment).reduce((s, v) => s + Number(v ?? 0), 0)
  }, [data])

  const platformTotal = useMemo(() => {
    if (!data) return 0
    return Object.values(data.by_platform).reduce((s, v) => s + Number(v ?? 0), 0)
  }, [data])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-semibold">
          Rapport caisse · {date}
        </h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("mr-1 h-3.5 w-3.5", loading && "animate-spin")} />
            Recharger
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <FileDown className="mr-1 h-3.5 w-3.5" /> CSV / Excel
          </Button>
          <Button size="sm" variant="outline" onClick={exportPdf}>
            <Printer className="mr-1 h-3.5 w-3.5" /> Imprimer / PDF
          </Button>
        </div>
      </div>

      {!data ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            {loading ? "Chargement…" : "Aucune donnée"}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* TOTAUX GLOBAUX */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PremiumStatCard
              label="Chiffre d'affaires"
              value={data.totals.revenue}
              suffix=" €"
              decimals={2}
              accent="gold"
              icon={TrendingUp}
            />
            <PremiumStatCard
              label="Encaissé (caisse)"
              value={paymentTotal}
              suffix=" €"
              decimals={2}
              accent="emerald"
              icon={Banknote}
            />
            <PremiumStatCard
              label="Crédit (kridi)"
              value={data.totals.revenue_credit}
              suffix=" €"
              decimals={2}
              accent="rose"
              icon={PiggyBank}
            />
            <PremiumStatCard
              label="Plateformes externes"
              value={platformTotal}
              suffix=" €"
              decimals={2}
              accent="indigo"
              icon={Truck}
            />
          </div>

          {/* META */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <MetaCard
              label="Remises"
              value={`${eur(data.totals.discounts)} €`}
              icon={TrendingUp}
            />
            <MetaCard
              label="Hospitalité"
              value={`${eur(data.totals.hospitality)} €`}
              icon={Crown}
            />
            <MetaCard
              label="Remboursements"
              value={`${eur(data.totals.refunds)} €`}
              icon={AlertTriangle}
            />
            <MetaCard
              label="Annulations"
              value={`${eur(data.totals.cancelled)} €`}
              icon={AlertTriangle}
            />
          </div>

          {/* STATIONS */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Revenu par station</CardTitle>
                {data.best_station.station ? (
                  <Badge className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
                    <Flame className="h-3 w-3" /> Top :{" "}
                    {STATION_META[data.best_station.station].i18nKey.split(".").pop()}
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 lg:grid-cols-3">
              {stationEntries.map(({ station, data: st }) => {
                const Icon = STATION_ICON[station]
                const ratio = data.totals.revenue > 0 ? (st.revenue / data.totals.revenue) * 100 : 0
                return (
                  <div
                    key={station}
                    className="rounded-lg border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="text-xs uppercase tracking-wider text-muted-foreground">
                            {station}
                          </div>
                          <div className="text-lg font-semibold">{eur(st.revenue)} €</div>
                        </div>
                      </div>
                      <Badge variant="outline">{ratio.toFixed(0)}%</Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                      <div>
                        <div>Unités</div>
                        <strong className="text-foreground">{st.units_sold}</strong>
                      </div>
                      <div>
                        <div>Annulé</div>
                        <strong className="text-foreground">{eur(st.cancelled_amount)} €</strong>
                      </div>
                      <div>
                        <div>Waste</div>
                        <strong className="text-foreground">{st.waste_count}</strong>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Top {st.top.length > 0 ? "5" : ""}
                      </div>
                      {st.top.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Aucune vente.</p>
                      ) : (
                        <ul className="mt-1 space-y-1 text-xs">
                          {st.top.map((it, idx) => (
                            <li
                              key={`${it.product_id ?? "noid"}-${idx}`}
                              className="flex items-center justify-between"
                            >
                              <span className="truncate">
                                {idx + 1}. {it.product_name}
                              </span>
                              <span className="font-mono text-[11px]">
                                {it.units_sold}× · {eur(it.revenue)} €
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* PAYMENT METHODS */}
          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Par méthode de paiement</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(data.by_payment).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun paiement.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {Object.entries(data.by_payment).map(([m, v]) => {
                      const Icon = PAYMENT_ICONS[m] ?? Wallet
                      const pct = paymentTotal > 0 ? (v / paymentTotal) * 100 : 0
                      return (
                        <li key={m} className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium uppercase">{m}</span>
                              <span className="text-sm font-semibold">{eur(v)} €</span>
                            </div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-amber-500"
                                style={{ width: `${Math.max(2, pct)}%` }}
                              />
                            </div>
                          </div>
                          <span className="w-12 text-right text-xs text-muted-foreground">
                            {pct.toFixed(0)}%
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Par plateforme externe</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(data.by_platform).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune entrée externe.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {Object.entries(data.by_platform).map(([src, v]) => {
                      const pct = platformTotal > 0 ? (v / platformTotal) * 100 : 0
                      return (
                        <li key={src} className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-100">
                            <Truck className="h-4 w-4" />
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {PLATFORM_LABEL[src] ?? src}
                              </span>
                              <span className="text-sm font-semibold">{eur(v)} €</span>
                            </div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-indigo-500"
                                style={{ width: `${Math.max(2, pct)}%` }}
                              />
                            </div>
                          </div>
                          <span className="w-12 text-right text-xs text-muted-foreground">
                            {pct.toFixed(0)}%
                          </span>
                        </li>
                      )
                    })}
                    <li className="mt-2 grid grid-cols-2 gap-2 border-t pt-2 text-xs text-muted-foreground">
                      <div>
                        Cash plateformes: <strong className="text-foreground">{eur(data.platform_cash)} €</strong>
                      </div>
                      <div>
                        Non-cash plateformes: <strong className="text-foreground">{eur(data.platform_non_cash)} €</strong>
                      </div>
                    </li>
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* TIROIR + CRÉDIT */}
          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Tiroir caisse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <Row label="Cash entrant (table + plateformes)" value={`${eur(data.caisse.cash_in)} €`} />
                <Row label="Sorties caisse" value={`-${eur(data.caisse.cash_out)} €`} negative />
                <Row label="Avances employés" value={`-${eur(data.caisse.employee_advances)} €`} negative />
                <div className="border-t pt-1 font-semibold">
                  <Row
                    label="Tiroir attendu"
                    value={`${eur(data.caisse.total_in_drawer_expected)} €`}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className={data.credit.overdue_invoices > 0 ? "border-rose-200" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  Dette client (kridi)
                  {data.credit.overdue_invoices > 0 ? (
                    <Badge variant="destructive">{data.credit.overdue_invoices} en retard</Badge>
                  ) : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <Row label="Factures ouvertes" value={String(data.credit.open_invoices)} />
                <Row label="En retard" value={String(data.credit.overdue_invoices)} />
                <div className="border-t pt-1 font-semibold">
                  <Row label="Total restant dû" value={`${eur(data.credit.total_remaining)} €`} />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function MetaCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  )
}

function Row({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(negative ? "text-rose-600" : "text-foreground")}>{value}</span>
    </div>
  )
}
