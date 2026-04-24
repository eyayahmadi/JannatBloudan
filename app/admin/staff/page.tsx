"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Edit2, Trash2, Search, TrendingUp, Users, Award } from "lucide-react"
import { useRouter } from "next/navigation"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { AdminPageFrame } from "@/components/site/AdminPageFrame"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/context/AuthContext"

type StaffMember = {
  id: string
  name: string
  email: string
  role: "admin" | "manager" | "server" | "cashier" | "cook"
  phone: string
  hireDate: string
  performance: {
    ordersServed: number
    totalSales: number
    rating: number
  }
  status: "active" | "inactive"
}

const roleTranslations: Record<string, { label: string; color: string }> = {
  admin: { label: "Administrateur", color: "bg-purple-100 text-purple-700" },
  manager: { label: "Manager", color: "bg-blue-100 text-blue-700" },
  server: { label: "Serveur", color: "bg-green-100 text-green-700" },
  cashier: { label: "Caissier", color: "bg-orange-100 text-orange-700" },
  cook: { label: "Cuisinier", color: "bg-red-100 text-red-700" },
}

const formatNumber = (value: number, decimals = 0) => {
  const fixed = value.toFixed(decimals)
  const parts = fixed.split(".")
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  return parts.join(decimals > 0 ? "." : "")
}

const formatCurrency = (value: number) => `${formatNumber(value)} EUR`

export default function StaffManagementPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    phone: "",
    role: "server",
    hireDate: "",
  })

  useEffect(() => {
    const loadStaff = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch("/api/admin/staff")
        if (!response.ok) {
          throw new Error("Impossible de charger le personnel")
        }
        const payload = await response.json()
        setStaffMembers(payload.staff ?? [])
      } catch (err) {
        console.error(err)
        setError("Impossible de charger le personnel")
        setStaffMembers([])
      } finally {
        setLoading(false)
      }
    }

    void loadStaff()
  }, [])

  const filteredStaff = useMemo(() => {
    return staffMembers.filter(
      (member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [staffMembers, searchQuery])

  const topPerformers = useMemo(() => {
    return [...staffMembers]
      .filter((member) => member.role === "server")
      .sort((a, b) => b.performance.totalSales - a.performance.totalSales)
      .slice(0, 3)
  }, [staffMembers])

  const averageRating = staffMembers.length
    ? staffMembers.reduce((sum, member) => sum + member.performance.rating, 0) / staffMembers.length
    : 0

  const handleCreateStaff = async () => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStaff),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible d'ajouter l'employe")
      }

      const created = payload.staff as StaffMember
      setStaffMembers((prev) => [created, ...prev])
      setShowAddModal(false)
      setNewStaff({ name: "", email: "", phone: "", role: "server", hireDate: "" })
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setSaving(false)
    }
  }

  return (
    <RequireAuth roles={["ADMIN", "STAFF"]} fallback={<div className="p-6 text-center">Chargement...</div>}>
      <AdminPageFrame
        title="Personnel"
        subtitle="Rôles, accès et performance."
        trailing={
          <Button size="pillSm" className="gap-2" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Ajouter un employé
          </Button>
        }
      >
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total employes</p>
                  <p className="text-3xl font-bold text-slate-900">{loading ? "-" : staffMembers.length}</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-100 text-blue-600">
                  <Users className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Serveurs actifs</p>
                  <p className="text-3xl font-bold text-green-600">
                    {loading
                      ? "-"
                      : staffMembers.filter((member) => member.role === "server" && member.status === "active").length}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-green-100 text-green-600">
                  <TrendingUp className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Note moyenne</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {loading || staffMembers.length === 0 ? "-" : averageRating.toFixed(1)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-yellow-100 text-yellow-600">
                  <Award className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Serveurs du mois</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-sm text-slate-500">Chargement...</div>
                ) : topPerformers.length === 0 ? (
                  <div className="text-sm text-slate-500">Aucun serveur disponible.</div>
                ) : (
                  topPerformers.map((member, index) => (
                    <div key={member.id} className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0
                            ? "bg-yellow-500 text-white"
                            : index === 1
                              ? "bg-slate-300 text-slate-700"
                              : "bg-orange-500 text-white"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-600">{member.performance.ordersServed} commandes</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(member.performance.totalSales)}</p>
                        <p className="text-xs text-slate-600">Note {member.performance.rating}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Rechercher un employe..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff List */}
        <Card>
          <CardHeader>
            <CardTitle>Liste du personnel ({loading ? "-" : filteredStaff.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : (
              <div className="space-y-3">
                {loading ? (
                  <div className="text-sm text-slate-500">Chargement...</div>
                ) : filteredStaff.length === 0 ? (
                  <div className="text-sm text-slate-500">Aucun employe trouve.</div>
                ) : (
                  filteredStaff.map((member) => {
                    const roleInfo = roleTranslations[member.role]
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                            {member.name
                              .split(" ")
                              .map((name) => name[0])
                              .join("")}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-slate-900">{member.name}</p>
                              <Badge className={roleInfo.color}>{roleInfo.label}</Badge>
                            </div>
                            <p className="text-sm text-slate-600">{member.email}</p>
                            <p className="text-xs text-slate-500">
                              Embauche le {member.hireDate ? new Date(member.hireDate).toLocaleDateString("fr-FR") : "-"}
                            </p>
                          </div>
                        </div>

                        {member.role === "server" && (
                          <div className="flex items-center gap-6 mr-4">
                            <div className="text-center">
                              <p className="text-sm text-slate-600">Commandes</p>
                              <p className="text-lg font-bold text-slate-900">{member.performance.ordersServed}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-slate-600">Ventes</p>
                              <p className="text-lg font-bold text-green-600">
                                {formatCurrency(member.performance.totalSales)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-slate-600">Note</p>
                              <p className="text-lg font-bold text-yellow-600">{member.performance.rating}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Staff Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle>Ajouter un employe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nom complet</label>
                    <Input
                      placeholder="Jean Dupont"
                      value={newStaff.name}
                      onChange={(event) => setNewStaff((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <Input
                      type="email"
                      placeholder="jean.dupont@resto.com"
                      value={newStaff.email}
                      onChange={(event) => setNewStaff((prev) => ({ ...prev, email: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Telephone</label>
                    <Input
                      placeholder="+33 6 12 34 56 78"
                      value={newStaff.phone}
                      onChange={(event) => setNewStaff((prev) => ({ ...prev, phone: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      value={newStaff.role}
                      onChange={(event) => setNewStaff((prev) => ({ ...prev, role: event.target.value }))}
                    >
                      {Object.entries(roleTranslations).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date d'embauche</label>
                  <Input
                    type="date"
                    value={newStaff.hireDate}
                    onChange={(event) => setNewStaff((prev) => ({ ...prev, hireDate: event.target.value }))}
                  />
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <h4 className="font-semibold text-slate-900 mb-3">Permissions</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm text-slate-700">Gerer les commandes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm text-slate-700">Gerer les reservations</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm text-slate-700">Acceder aux rapports</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm text-slate-700">Gerer l'inventaire</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Button className="flex-1" onClick={handleCreateStaff} disabled={saving || !newStaff.name || !newStaff.email}>
                    {saving ? "En cours..." : "Creer le compte"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => {
                      setShowAddModal(false)
                      setNewStaff({ name: "", email: "", phone: "", role: "server", hireDate: "" })
                    }}
                    disabled={saving}
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </AdminPageFrame>
    </RequireAuth>
  )
}
