"use client"

import { useState } from "react"
import { Plus, FileText, Download, Search, Calendar } from "lucide-react"
import { AdminPageFrame } from "@/components/site/AdminPageFrame"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type Purchase = {
  id: string
  invoiceNumber: string
  supplier: string
  date: string
  items: { name: string; quantity: number; unit: string; unitPrice: number }[]
  subtotal: number
  tva: number
  total: number
  status: "paid" | "pending"
}

const purchases: Purchase[] = [
  {
    id: "1",
    invoiceNumber: "FACT-2024-001",
    supplier: "Lactalis",
    date: "2024-12-15",
    items: [
      { name: "Mozzarella", quantity: 20, unit: "kg", unitPrice: 8.5 },
      { name: "Parmesan", quantity: 10, unit: "kg", unitPrice: 15.5 },
      { name: "Cheddar", quantity: 15, unit: "kg", unitPrice: 9.8 },
    ],
    subtotal: 472.0,
    tva: 94.4,
    total: 566.4,
    status: "paid",
  },
  {
    id: "2",
    invoiceNumber: "FACT-2024-002",
    supplier: "Bio Provence",
    date: "2024-12-14",
    items: [
      { name: "Tomates", quantity: 30, unit: "kg", unitPrice: 2.3 },
      { name: "Basilic", quantity: 15, unit: "bottes", unitPrice: 1.5 },
      { name: "Poivrons", quantity: 20, unit: "kg", unitPrice: 3.2 },
      { name: "Champignons", quantity: 12, unit: "kg", unitPrice: 4.5 },
    ],
    subtotal: 182.5,
    tva: 36.5,
    total: 219.0,
    status: "paid",
  },
  {
    id: "3",
    invoiceNumber: "FACT-2024-003",
    supplier: "Boucherie Martin",
    date: "2024-12-15",
    items: [
      { name: "Viande hachée", quantity: 25, unit: "kg", unitPrice: 9.8 },
      { name: "Poulet", quantity: 30, unit: "kg", unitPrice: 7.5 },
      { name: "Agneau", quantity: 15, unit: "kg", unitPrice: 16.5 },
    ],
    subtotal: 717.5,
    tva: 143.5,
    total: 861.0,
    status: "paid",
  },
  {
    id: "4",
    invoiceNumber: "FACT-2024-004",
    supplier: "Coca-Cola Company",
    date: "2024-12-13",
    items: [
      { name: "Coca-Cola", quantity: 200, unit: "bouteilles", unitPrice: 0.85 },
      { name: "Fanta", quantity: 150, unit: "bouteilles", unitPrice: 0.85 },
    ],
    subtotal: 297.5,
    tva: 59.5,
    total: 357.0,
    status: "paid",
  },
  {
    id: "5",
    invoiceNumber: "FACT-2024-005",
    supplier: "Boulangerie Artisan",
    date: "2024-12-15",
    items: [
      { name: "Pains Hamburger", quantity: 100, unit: "pcs", unitPrice: 0.45 },
      { name: "Pâte à Pizza", quantity: 80, unit: "pcs", unitPrice: 1.2 },
    ],
    subtotal: 141.0,
    tva: 28.2,
    total: 169.2,
    status: "pending",
  },
]

export default function PurchasesPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredPurchases = purchases.filter(
    (p) =>
      p.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <AdminPageFrame
      title="Achats & factures"
      subtitle="Fournisseurs et suivi des dépenses."
      trailing={
        <Button size="pillSm" className="gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle facture
        </Button>
      }
    >
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-slate-600 mb-1">Total achats ce mois</p>
              <p className="text-2xl font-bold text-slate-900">1,245.80€</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-slate-600 mb-1">Factures payées</p>
              <p className="text-2xl font-bold text-green-600">24</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-slate-600 mb-1">Factures en attente</p>
              <p className="text-2xl font-bold text-orange-600">3</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-slate-600 mb-1">Fournisseurs actifs</p>
              <p className="text-2xl font-bold text-blue-600">12</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Rechercher par fournisseur ou numéro de facture..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Calendar className="w-4 h-4" />
                Filtrer par date
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Purchases List */}
        <div className="space-y-4">
          {filteredPurchases.map((purchase) => (
            <Card key={purchase.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900">{purchase.invoiceNumber}</h3>
                      <Badge
                        className={
                          purchase.status === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                        }
                      >
                        {purchase.status === "paid" ? "Payée" : "En attente"}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{purchase.supplier}</p>
                    <p className="text-xs text-slate-500">{new Date(purchase.date).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{purchase.total.toFixed(2)}€</p>
                    <p className="text-xs text-slate-600">TVA: {purchase.tva.toFixed(2)}€</p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-600">
                        <th className="pb-2">Article</th>
                        <th className="pb-2 text-center">Quantité</th>
                        <th className="pb-2 text-right">Prix unitaire</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchase.items.map((item, idx) => (
                        <tr key={idx} className="border-t border-slate-100">
                          <td className="py-2 font-medium text-slate-900">{item.name}</td>
                          <td className="py-2 text-center text-slate-700">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-2 text-right text-slate-700">{item.unitPrice.toFixed(2)}€</td>
                          <td className="py-2 text-right font-medium text-slate-900">
                            {(item.quantity * item.unitPrice).toFixed(2)}€
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-200">
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <FileText className="w-4 h-4" />
                    Voir détails
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Download className="w-4 h-4" />
                    Télécharger PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Purchase Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Nouvelle facture d'achat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Numéro de facture</label>
                    <Input placeholder="FACT-2024-XXX" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Fournisseur</label>
                    <Input placeholder="Nom du fournisseur" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                  <Input type="date" />
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900">Articles</h4>
                    <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                      <Plus className="w-4 h-4" />
                      Ajouter un article
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-3">
                      <Input placeholder="Nom de l'article" className="col-span-2" />
                      <Input placeholder="Quantité" type="number" />
                      <Input placeholder="Prix unitaire" type="number" step="0.01" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Sous-total</span>
                    <span className="font-medium text-slate-900">0.00€</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">TVA (20%)</span>
                    <span className="font-medium text-slate-900">0.00€</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-bold border-t border-slate-200 pt-2">
                    <span className="text-slate-900">Total</span>
                    <span className="text-blue-600">0.00€</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Button className="flex-1" onClick={() => setShowAddModal(false)}>
                    Enregistrer et mettre à jour le stock
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowAddModal(false)}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
    </AdminPageFrame>
  )
}
