"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ExternalLink, Package, RefreshCw, ShoppingBag, Store } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/context"
import { useAuth } from "@/lib/context/AuthContext"
import { normalizeRole } from "@/lib/auth/roles"
import {
  URGENCY_META,
  type PurchaseRecommendation,
  type PurchaseUrgency,
} from "@/lib/purchases/types"
import { cn } from "@/lib/utils"

const URGENCY_BADGE: Record<PurchaseUrgency, string> = {
  CRITICAL: "bg-red-600 text-white",
  HIGH: "bg-amber-600 text-white",
  MEDIUM: "bg-sky-600 text-white",
  LOW: "bg-slate-500 text-white",
}

type Props = {
  /** Visible côté caisse même si la liste est vide. */
  showWhenEmpty?: boolean
  className?: string
}

/**
 * Panneau « Achats urgents » — affiché côté caisse / admin sur la vue
 * synthèse. Les CASHIER peuvent ouvrir une sortie de caisse / se rendre sur
 * /admin/purchases (admin) ou simplement consulter la liste.
 */
export function UrgentPurchasesPanel({ showWhenEmpty = false, className }: Props) {
  const { t } = useI18n()
  const { user } = useAuth()
  const role = user ? normalizeRole(user.role) : "CLIENT"
  const isAdminOrCashier = role === "ADMIN" || role === "CASHIER"

  const [recos, setRecos] = useState<PurchaseRecommendation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!isAdminOrCashier) {
      setRecos([])
      setLoading(false)
      return
    }
    try {
      const res = await fetch("/api/caisse/urgent-purchases")
      const json = await res.json()
      setRecos(Array.isArray(json.recommendations) ? json.recommendations : [])
    } catch {
      setRecos([])
    } finally {
      setLoading(false)
    }
  }, [isAdminOrCashier])

  useEffect(() => {
    void fetchData()
    const id = window.setInterval(() => void fetchData(), 90_000)
    return () => window.clearInterval(id)
  }, [fetchData])

  const counts = useMemo(() => {
    let critical = 0
    let high = 0
    for (const r of recos) {
      if (r.urgency === "CRITICAL") critical += 1
      else if (r.urgency === "HIGH") high += 1
    }
    return { critical, high }
  }, [recos])

  if (!isAdminOrCashier) return null
  if (!showWhenEmpty && !loading && recos.length === 0) return null

  return (
    <Card className={cn("border-amber-300 dark:border-amber-700", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          {t("purchases.cashier.title", "Achats urgents")}
          {counts.critical > 0 ? (
            <Badge className="bg-red-600 text-white">
              {counts.critical} {t("purchases.urgency.critical", "Critique")}
            </Badge>
          ) : null}
          {counts.high > 0 ? (
            <Badge className="bg-amber-600 text-white">
              {counts.high} {t("purchases.urgency.high", "Élevée")}
            </Badge>
          ) : null}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => void fetchData()} className="h-8 gap-1">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
          {role === "ADMIN" ? (
            <Button asChild size="sm" variant="outline" className="h-8 gap-1">
              <Link href="/admin/purchases">
                <ExternalLink className="h-3.5 w-3.5" />
                {t("purchases.cashier.view", "Voir la liste complète")}
              </Link>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-xs text-muted-foreground">{t("common.loading", "Chargement…")}</p>
        ) : recos.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            {t("purchases.cashier.empty", "Aucun achat urgent pour le moment.")}
          </p>
        ) : (
          <p className="mb-2 text-xs text-muted-foreground">
            {t("purchases.cashier.subtitle", "Stock critique & ruptures à racheter en priorité")}
          </p>
        )}
        {recos.length > 0 ? (
          <ul className="divide-y divide-border">
            {recos.slice(0, 8).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge className={URGENCY_BADGE[r.urgency]}>
                      {t(URGENCY_META[r.urgency].i18nKey, r.urgency)}
                    </Badge>
                    <span className="truncate text-sm font-medium">
                      {r.ingredient_name ?? r.product_name ?? "—"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <ShoppingBag className="mr-1 inline h-3 w-3" />
                    {Number(r.suggested_qty)}
                    {r.effective_unit ? ` ${r.effective_unit}` : ""}
                    {r.estimated_cost ? ` · ${Number(r.estimated_cost).toFixed(2)} €` : ""}
                    {r.effective_supplier ? (
                      <>
                        {" · "}
                        <Store className="inline h-3 w-3" />
                        <span className="ml-0.5">{r.effective_supplier}</span>
                      </>
                    ) : null}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}
