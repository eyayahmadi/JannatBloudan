"use client"

import { useEffect, useState, useRef } from "react"
import { Download, Printer, QrCode, MapPin } from "lucide-react"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { RequireAuth } from "@/components/auth/RequireAuth"

type TableData = {
  id: number
  number: number
  zone: string
  url: string
  qrDataUrl: string
}

const zoneLabels: Record<string, string> = {
  interieur: "Intérieur",
  terrasse: "Terrasse",
  vip: "VIP",
  gaming: "Gaming",
}

const zoneColors: Record<string, string> = {
  interieur: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  terrasse: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  vip: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  gaming: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
}

export default function AdminQRPage() {
  const [tables, setTables] = useState<TableData[]>([])
  const [loading, setLoading] = useState(true)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/qr")
      .then((r) => r.json())
      .then((data) => setTables(data.tables))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handlePrintAll = () => window.print()

  const handleDownload = async (table: TableData) => {
    try {
      const response = await fetch(table.qrDataUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `qr-table-${table.number}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      window.open(table.qrDataUrl, "_blank")
    }
  }

  return (
    <RequireAuth roles={["ADMIN"]}>
      <PageShell className="dark:bg-neutral-950">
        <SiteHeader backHref="/admin" hideMainNav />

        <main className="mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-amber-950 dark:text-white">
                <QrCode className="h-7 w-7 text-amber-600" />
                QR Codes — Tables
              </h1>
              <p className="mt-1 text-sm text-amber-800/70 dark:text-amber-300/70">
                Gérez et imprimez les QR codes pour chaque table du restaurant.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrintAll}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
            >
              <Printer className="h-4 w-4" />
              Imprimer tout
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="h-72 animate-pulse rounded-2xl bg-amber-100/50 dark:bg-neutral-800"
                />
              ))}
            </div>
          ) : (
            <div
              ref={printRef}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            >
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="group flex flex-col items-center rounded-2xl border border-amber-100 bg-white p-4 shadow-sm transition hover:shadow-lg print:break-inside-avoid print:shadow-none dark:border-amber-900/30 dark:bg-neutral-900"
                >
                  <div className="mb-3 flex w-full items-center justify-between">
                    <span className="text-lg font-bold text-amber-950 dark:text-white">
                      Table {table.number}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${zoneColors[table.zone] || ""}`}
                    >
                      <MapPin className="h-3 w-3" />
                      {zoneLabels[table.zone] || table.zone}
                    </span>
                  </div>

                  <div className="rounded-xl border border-amber-50 bg-white p-2 dark:border-amber-900/20 dark:bg-neutral-800">
                    <img
                      src={table.qrDataUrl}
                      alt={`QR code table ${table.number}`}
                      width={160}
                      height={160}
                      className="h-40 w-40"
                    />
                  </div>

                  <p className="mt-3 max-w-full truncate text-center text-[11px] text-amber-700/60 dark:text-amber-400/50">
                    {table.url}
                  </p>

                  <button
                    type="button"
                    onClick={() => handleDownload(table)}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 transition hover:bg-amber-100 print:hidden dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/40"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Télécharger
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </PageShell>
    </RequireAuth>
  )
}
