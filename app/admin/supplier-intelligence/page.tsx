"use client"

import Link from "next/link"
import { ArrowLeft, Truck } from "lucide-react"
import { useEffect, useState } from "react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Payload = {
  ok?: boolean
  totals?: { count: number; sum_ttc_sample: number; by_status: Record<string, number> }
  recent?: Array<{ id: string; status?: string; total_ttc: number; supplier_name_raw: string | null }>
}

export default function SupplierIntelligencePage() {
  const [data, setData] = useState<Payload | null>(null)

  useEffect(() => {
    void fetch("/api/admin/supplier-stats", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
  }, [])

  return (
    <RequireAuth roles={["ADMIN"]}>
      <PageShell className="min-h-screen bg-[color:var(--lux-cream)] dark:bg-neutral-950">
        <SiteHeader hideMainNav backHref="/admin" backLabel="Admin" />
        <div className="site-container max-w-3xl space-y-6 py-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Admin
          </Link>
          <h1 className="flex items-center gap-2 font-display text-3xl font-semibold">
            <Truck className="h-8 w-8 text-amber-600" />
            Intelligence fournisseurs
          </h1>
          <p className="text-sm text-muted-foreground">
            Synthèse instantanée depuis <code className="text-xs">supplier_invoices</code>. La validation détaillée et
            l&apos;extraction OCR se font dans Factures fournisseurs.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/admin/supplier-invoices">Ouvrir OCR & validation</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/reports">Voir rapports (bloc fournisseur)</Link>
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Échantillon récent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {data?.ok && data.totals ? (
                <>
                  <p>
                    Factures (échantillon max 400) : <strong>{data.totals.count}</strong> · Total TTC cumulé :{" "}
                    <strong>{data.totals.sum_ttc_sample.toFixed(2)} €</strong>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(data.totals.by_status).map(([k, v]) => (
                      <Badge key={k} variant="secondary">
                        {k}: {v}
                      </Badge>
                    ))}
                  </div>
                  <ul className="space-y-2 border-t pt-4">
                    {(data.recent ?? []).map((r) => (
                      <li key={r.id} className="flex justify-between gap-4">
                        <span className="truncate">{r.supplier_name_raw ?? r.id.slice(0, 8)}</span>
                        <span className="text-muted-foreground">
                          {r.total_ttc.toFixed(2)} € · {r.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p>Aucune donnée ou Supabase désactivée.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </PageShell>
    </RequireAuth>
  )
}
