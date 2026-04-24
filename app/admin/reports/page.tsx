"use client"

import { useState } from "react"
import { Download, TrendingUp, DollarSign, Users, Package } from "lucide-react"
import { AdminPageFrame } from "@/components/site/AdminPageFrame"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type SalesData = {
  date: string
  revenue: number
  orders: number
  avgOrder: number
}

type ProductStats = {
  name: string
  category: string
  sold: number
  revenue: number
  profit: number
}

const salesData: SalesData[] = [
  { date: "2024-12-01", revenue: 3245.5, orders: 87, avgOrder: 37.3 },
  { date: "2024-12-02", revenue: 2890.0, orders: 76, avgOrder: 38.0 },
  { date: "2024-12-03", revenue: 3567.8, orders: 92, avgOrder: 38.8 },
  { date: "2024-12-04", revenue: 4123.2, orders: 105, avgOrder: 39.3 },
  { date: "2024-12-05", revenue: 3789.9, orders: 98, avgOrder: 38.7 },
]

const productStats: ProductStats[] = [
  { name: "Shawarma Poulet", category: "Shawarma", sold: 189, revenue: 1606.5, profit: 856.0 },
  { name: "Pizza Margherita", category: "Pizzas", sold: 145, revenue: 1883.55, profit: 942.0 },
  { name: "Burger Syrien", category: "Burgers", sold: 134, revenue: 1606.66, profit: 802.0 },
  { name: "Burger Classic", category: "Burgers", sold: 128, revenue: 1344.0, profit: 672.0 },
  { name: "Kebab Halabi", category: "Plats Chauds", sold: 112, revenue: 1624.0, profit: 812.0 },
  { name: "Pizza Orientale", category: "Pizzas", sold: 108, revenue: 1726.92, profit: 863.0 },
  { name: "Shawarma Viande", category: "Shawarma", sold: 102, revenue: 969.0, profit: 485.0 },
  { name: "Baklava", category: "Desserts", sold: 98, revenue: 637.0, profit: 382.0 },
  { name: "Kibbeh", category: "Plats Chauds", sold: 87, revenue: 1044.0, profit: 522.0 },
  { name: "Houmous", category: "Mezzés", sold: 85, revenue: 467.5, profit: 327.0 },
  { name: "Pizza 4 Fromages", category: "Pizzas", sold: 78, revenue: 1169.22, profit: 585.0 },
  { name: "Burger Poulet Crispy", category: "Burgers", sold: 76, revenue: 759.24, profit: 380.0 },
  { name: "Kunafa", category: "Desserts", sold: 72, revenue: 504.0, profit: 302.0 },
  { name: "Manakish Zaatar", category: "Manakish", sold: 68, revenue: 374.0, profit: 262.0 },
  { name: "Falafel Assiette", category: "Plats Chauds", sold: 65, revenue: 585.0, profit: 293.0 },
  { name: "Coca-Cola", category: "Boissons", sold: 245, revenue: 612.5, profit: 404.0 },
  { name: "Jus d'Orange Frais", category: "Boissons", sold: 156, revenue: 702.0, profit: 468.0 },
  { name: "Thé à la Menthe", category: "Boissons", sold: 143, revenue: 357.5, profit: 250.0 },
  { name: "Café Turc", category: "Boissons", sold: 98, revenue: 294.0, profit: 196.0 },
]

const staffStats = [
  { name: "Marie Dubois", orders: 245, sales: 9456.5, rating: 4.8 },
  { name: "Pierre Martin", orders: 198, sales: 7623.2, rating: 4.6 },
  { name: "Sophie Lefebvre", orders: 167, sales: 6234.8, rating: 4.7 },
]

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("week")

  const totalRevenue = salesData.reduce((sum, day) => sum + day.revenue, 0)
  const totalOrders = salesData.reduce((sum, day) => sum + day.orders, 0)
  const avgOrderValue = totalRevenue / totalOrders
  const totalProfit = productStats.reduce((sum, p) => sum + p.profit, 0)

  const handleExportPDF = () => {
    // Create a printable version
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rapports & Statistiques - ${new Date().toLocaleDateString("fr-FR")}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #1e293b; margin-bottom: 30px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; }
            .stat-label { color: #64748b; font-size: 14px; margin-bottom: 8px; }
            .stat-value { font-size: 28px; font-weight: bold; color: #1e293b; }
            .stat-change { color: #10b981; font-size: 14px; margin-top: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background-color: #f8fafc; font-weight: 600; }
            .section { margin-top: 40px; }
            .section-title { font-size: 20px; font-weight: bold; margin-bottom: 15px; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Rapports & Statistiques</h1>
          <p>Période: ${selectedPeriod === "today" ? "Aujourd'hui" : selectedPeriod === "week" ? "Cette semaine" : "Ce mois"}</p>
          <p>Date: ${new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Revenus</div>
              <div class="stat-value">${totalRevenue.toFixed(2)}€</div>
              <div class="stat-change">+12.5%</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Commandes</div>
              <div class="stat-value">${totalOrders}</div>
              <div class="stat-change">+8.2%</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Panier moyen</div>
              <div class="stat-value">${avgOrderValue.toFixed(2)}€</div>
              <div class="stat-change">+4.1%</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Profit</div>
              <div class="stat-value">${totalProfit.toFixed(2)}€</div>
              <div class="stat-change">+15.3%</div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Ventes journalières</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th style="text-align: right;">Revenus</th>
                  <th style="text-align: right;">Commandes</th>
                  <th style="text-align: right;">Panier moyen</th>
                </tr>
              </thead>
              <tbody>
                ${salesData
                  .map(
                    (day) => `
                  <tr>
                    <td>${new Date(day.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</td>
                    <td style="text-align: right; color: #10b981; font-weight: 600;">${day.revenue.toFixed(2)}€</td>
                    <td style="text-align: right;">${day.orders}</td>
                    <td style="text-align: right;">${day.avgOrder.toFixed(2)}€</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2 class="section-title">Produits les plus vendus</h2>
            <table>
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Produit</th>
                  <th>Catégorie</th>
                  <th style="text-align: right;">Quantité vendue</th>
                  <th style="text-align: right;">Revenus</th>
                  <th style="text-align: right;">Profit</th>
                </tr>
              </thead>
              <tbody>
                ${productStats
                  .slice(0, 10)
                  .map(
                    (product, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td style="text-align: right;">${product.sold}</td>
                    <td style="text-align: right; font-weight: 600;">${product.revenue.toFixed(2)}€</td>
                    <td style="text-align: right; color: #10b981;">${product.profit.toFixed(2)}€</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2 class="section-title">Performance des serveurs</h2>
            <table>
              <thead>
                <tr>
                  <th>Serveur</th>
                  <th style="text-align: right;">Commandes</th>
                  <th style="text-align: right;">Ventes</th>
                  <th style="text-align: right;">Note</th>
                </tr>
              </thead>
              <tbody>
                ${staffStats
                  .map(
                    (staff) => `
                  <tr>
                    <td>${staff.name}</td>
                    <td style="text-align: right;">${staff.orders}</td>
                    <td style="text-align: right; color: #10b981; font-weight: 600;">${staff.sales.toFixed(0)}€</td>
                    <td style="text-align: right;">★ ${staff.rating}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2 class="section-title">Statistiques de stock</h2>
            <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr);">
              <div class="stat-card">
                <div class="stat-label">Valeur totale du stock</div>
                <div class="stat-value">8,456.20€</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Produits en rupture</div>
                <div class="stat-value" style="color: #dc2626;">4</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Produits expirés</div>
                <div class="stat-value" style="color: #f97316;">2</div>
              </div>
            </div>
          </div>

          <div class="no-print" style="margin-top: 40px; text-align: center;">
            <button onclick="window.print()" style="background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
              Imprimer / Sauvegarder en PDF
            </button>
            <button onclick="window.close()" style="background: #64748b; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin-left: 10px;">
              Fermer
            </button>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(reportHTML)
    printWindow.document.close()
  }

  return (
    <AdminPageFrame
      title="Rapports & statistiques"
      subtitle="Synthèse financière et opérationnelle."
      trailing={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant={selectedPeriod === "today" ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setSelectedPeriod("today")}
          >
            Aujourd&apos;hui
          </Button>
          <Button
            variant={selectedPeriod === "week" ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setSelectedPeriod("week")}
          >
            Semaine
          </Button>
          <Button
            variant={selectedPeriod === "month" ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setSelectedPeriod("month")}
          >
            Mois
          </Button>
          <Button size="pillSm" className="gap-2" onClick={handleExportPDF}>
            <Download className="h-4 w-4" />
            PDF
          </Button>
        </div>
      }
    >
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-600">Revenus</p>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{totalRevenue.toFixed(2)}€</p>
              <div className="flex items-center gap-1 text-sm text-green-600 mt-2">
                <TrendingUp className="w-4 h-4" />
                <span>+12.5%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-600">Commandes</p>
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{totalOrders}</p>
              <div className="flex items-center gap-1 text-sm text-blue-600 mt-2">
                <TrendingUp className="w-4 h-4" />
                <span>+8.2%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-600">Panier moyen</p>
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{avgOrderValue.toFixed(2)}€</p>
              <div className="flex items-center gap-1 text-sm text-purple-600 mt-2">
                <TrendingUp className="w-4 h-4" />
                <span>+4.1%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-600">Profit</p>
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{totalProfit.toFixed(2)}€</p>
              <div className="flex items-center gap-1 text-sm text-orange-600 mt-2">
                <TrendingUp className="w-4 h-4" />
                <span>+15.3%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales by Day */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Ventes journalières</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Date</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900">Revenus</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900">Commandes</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900">Panier moyen</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((day, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 text-sm text-slate-900">
                        {new Date(day.date).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-medium text-green-600">
                        {day.revenue.toFixed(2)}€
                      </td>
                      <td className="py-4 px-4 text-right text-sm text-slate-900">{day.orders}</td>
                      <td className="py-4 px-4 text-right text-sm text-slate-900">{day.avgOrder.toFixed(2)}€</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Produits les plus vendus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {productStats.slice(0, 10).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-600">
                          {product.category} • {product.sold} vendus
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{product.revenue.toFixed(2)}€</p>
                      <p className="text-xs text-green-600">+{product.profit.toFixed(2)}€</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Staff Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance des serveurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffStats.map((staff, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {staff.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{staff.name}</p>
                        <p className="text-xs text-slate-600">{staff.orders} commandes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{staff.sales.toFixed(0)}€</p>
                      <div className="flex items-center justify-end gap-1 text-xs text-yellow-600">
                        <span>★ {staff.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stock Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques de stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 mb-2">Valeur totale du stock</p>
                <p className="text-3xl font-bold text-slate-900">8,456.20€</p>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700 mb-2">Produits en rupture</p>
                <p className="text-3xl font-bold text-red-600">4</p>
              </div>
              <div className="text-center p-6 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-700 mb-2">Produits expirés</p>
                <p className="text-3xl font-bold text-orange-600">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
    </AdminPageFrame>
  )
}
