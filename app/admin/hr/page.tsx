"use client"

import { useState, useMemo } from "react"
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  Trophy,
  Clock,
  Star,
  ShoppingBag,
  Shuffle,
  CalendarDays,
} from "lucide-react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Role = "Serveur" | "Cuisinier" | "Caissier" | "Manager"

type Employee = {
  id: string
  name: string
  role: Role
  phone: string
  email: string
  status: "Actif" | "Inactif"
  hireDate: string
  performance: { orders: number; avgTime: number; rating: number }
}

type Shift = {
  employeeId: string
  day: number
  startHour: number
  endHour: number
}

type Zone = "Terrasse" | "Interieur" | "VIP" | "Cuisine" | "Caisse"

type ZoneAssignment = { employeeId: string; zone: Zone }

const ROLE_COLORS: Record<Role, string> = {
  Serveur: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Cuisinier: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  Caissier: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  Manager: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
}

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
const HOURS = Array.from({ length: 16 }, (_, i) => i + 8)
const ZONES: Zone[] = ["Terrasse", "Interieur", "VIP", "Cuisine", "Caisse"]

const EMPLOYEE_COLORS = [
  "bg-blue-400/70 dark:bg-blue-500/50",
  "bg-green-400/70 dark:bg-green-500/50",
  "bg-purple-400/70 dark:bg-purple-500/50",
  "bg-amber-400/70 dark:bg-amber-500/50",
  "bg-pink-400/70 dark:bg-pink-500/50",
  "bg-cyan-400/70 dark:bg-cyan-500/50",
  "bg-rose-400/70 dark:bg-rose-500/50",
  "bg-teal-400/70 dark:bg-teal-500/50",
]

const INITIAL_EMPLOYEES: Employee[] = [
  { id: "e1", name: "Karim Benali", role: "Serveur", phone: "0555 12 34 56", email: "karim@restaurant.dz", status: "Actif", hireDate: "2023-03-15", performance: { orders: 342, avgTime: 12, rating: 4.7 } },
  { id: "e2", name: "Amina Khelifi", role: "Cuisinier", phone: "0555 23 45 67", email: "amina@restaurant.dz", status: "Actif", hireDate: "2022-08-01", performance: { orders: 510, avgTime: 18, rating: 4.9 } },
  { id: "e3", name: "Youcef Mansouri", role: "Serveur", phone: "0555 34 56 78", email: "youcef@restaurant.dz", status: "Actif", hireDate: "2024-01-10", performance: { orders: 198, avgTime: 14, rating: 4.3 } },
  { id: "e4", name: "Fatima Zohra", role: "Manager", phone: "0555 45 67 89", email: "fatima@restaurant.dz", status: "Actif", hireDate: "2021-06-20", performance: { orders: 120, avgTime: 10, rating: 4.8 } },
  { id: "e5", name: "Mohamed Saidi", role: "Cuisinier", phone: "0555 56 78 90", email: "mohamed@restaurant.dz", status: "Actif", hireDate: "2023-11-05", performance: { orders: 430, avgTime: 20, rating: 4.5 } },
  { id: "e6", name: "Nadia Bouzid", role: "Caissier", phone: "0555 67 89 01", email: "nadia@restaurant.dz", status: "Actif", hireDate: "2024-04-12", performance: { orders: 280, avgTime: 5, rating: 4.6 } },
  { id: "e7", name: "Rachid Hamidi", role: "Serveur", phone: "0555 78 90 12", email: "rachid@restaurant.dz", status: "Inactif", hireDate: "2022-02-28", performance: { orders: 150, avgTime: 16, rating: 3.9 } },
  { id: "e8", name: "Lina Cherif", role: "Caissier", phone: "0555 89 01 23", email: "lina@restaurant.dz", status: "Actif", hireDate: "2024-07-01", performance: { orders: 210, avgTime: 6, rating: 4.4 } },
]

const INITIAL_SHIFTS: Shift[] = [
  { employeeId: "e1", day: 0, startHour: 10, endHour: 16 },
  { employeeId: "e1", day: 2, startHour: 16, endHour: 23 },
  { employeeId: "e1", day: 4, startHour: 10, endHour: 18 },
  { employeeId: "e2", day: 0, startHour: 8, endHour: 16 },
  { employeeId: "e2", day: 1, startHour: 8, endHour: 16 },
  { employeeId: "e2", day: 3, startHour: 8, endHour: 16 },
  { employeeId: "e2", day: 5, startHour: 10, endHour: 20 },
  { employeeId: "e3", day: 1, startHour: 16, endHour: 23 },
  { employeeId: "e3", day: 3, startHour: 16, endHour: 23 },
  { employeeId: "e3", day: 5, startHour: 16, endHour: 23 },
  { employeeId: "e4", day: 0, startHour: 9, endHour: 17 },
  { employeeId: "e4", day: 1, startHour: 9, endHour: 17 },
  { employeeId: "e4", day: 2, startHour: 9, endHour: 17 },
  { employeeId: "e4", day: 3, startHour: 9, endHour: 17 },
  { employeeId: "e4", day: 4, startHour: 9, endHour: 17 },
  { employeeId: "e5", day: 1, startHour: 10, endHour: 20 },
  { employeeId: "e5", day: 2, startHour: 10, endHour: 20 },
  { employeeId: "e5", day: 4, startHour: 10, endHour: 20 },
  { employeeId: "e5", day: 6, startHour: 10, endHour: 20 },
  { employeeId: "e6", day: 0, startHour: 10, endHour: 18 },
  { employeeId: "e6", day: 2, startHour: 10, endHour: 18 },
  { employeeId: "e6", day: 4, startHour: 10, endHour: 18 },
  { employeeId: "e6", day: 6, startHour: 10, endHour: 18 },
  { employeeId: "e8", day: 1, startHour: 12, endHour: 20 },
  { employeeId: "e8", day: 3, startHour: 12, endHour: 20 },
  { employeeId: "e8", day: 5, startHour: 12, endHour: 20 },
]

export default function HRPage() {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES)
  const [shifts, setShifts] = useState<Shift[]>(INITIAL_SHIFTS)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newEmp, setNewEmp] = useState({ name: "", role: "Serveur" as Role, phone: "", email: "" })
  const [zoneAssignments, setZoneAssignments] = useState<ZoneAssignment[]>(() =>
    INITIAL_EMPLOYEES.filter((e) => e.status === "Actif").slice(0, 5).map((e, i) => ({ employeeId: e.id, zone: ZONES[i % ZONES.length] }))
  )

  const employeeOfMonth = useMemo(() => {
    const active = employees.filter((e) => e.status === "Actif")
    if (!active.length) return null
    return active.reduce((best, e) => {
      const score = e.performance.orders * 0.4 + e.performance.rating * 100 * 0.4 + (30 - e.performance.avgTime) * 0.2
      const bestScore = best.performance.orders * 0.4 + best.performance.rating * 100 * 0.4 + (30 - best.performance.avgTime) * 0.2
      return score > bestScore ? e : best
    })
  }, [employees])

  const maxOrders = Math.max(1, ...employees.map((e) => e.performance.orders))

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {}
    employees.forEach((e, i) => {
      map[e.id] = EMPLOYEE_COLORS[i % EMPLOYEE_COLORS.length]
    })
    return map
  }, [employees])

  const addEmployee = () => {
    if (!newEmp.name.trim()) return
    const emp: Employee = {
      id: `e${Date.now()}`,
      name: newEmp.name,
      role: newEmp.role,
      phone: newEmp.phone,
      email: newEmp.email,
      status: "Actif",
      hireDate: new Date().toISOString().slice(0, 10),
      performance: { orders: 0, avgTime: 0, rating: 0 },
    }
    setEmployees((prev) => [...prev, emp])
    setNewEmp({ name: "", role: "Serveur", phone: "", email: "" })
    setShowAddModal(false)
  }

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id))
    setShifts((prev) => prev.filter((s) => s.employeeId !== id))
    setZoneAssignments((prev) => prev.filter((z) => z.employeeId !== id))
  }

  const toggleStatus = (id: string) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: e.status === "Actif" ? "Inactif" : "Actif" } : e))
    )
  }

  const addShift = (day: number) => {
    const active = employees.filter((e) => e.status === "Actif")
    if (!active.length) return
    const random = active[Math.floor(Math.random() * active.length)]
    setShifts((prev) => [...prev, { employeeId: random.id, day, startHour: 10, endHour: 18 }])
  }

  const optimizeZones = () => {
    const active = employees.filter((e) => e.status === "Actif")
    const shuffled = [...active].sort(() => Math.random() - 0.5)
    setZoneAssignments(
      shuffled.slice(0, Math.max(ZONES.length, shuffled.length)).map((e, i) => ({
        employeeId: e.id,
        zone: ZONES[i % ZONES.length],
      }))
    )
  }

  return (
    <RequireAuth roles={["ADMIN"]}>
      <PageShell>
        <SiteHeader backHref="/admin" hideMainNav />

        <div className="mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gestion des Ressources Humaines</h1>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter employe
            </Button>
          </div>

          {/* Employee List */}
          <Card className="mb-8 dark:bg-slate-800/60 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Users className="h-5 w-5" />
                Employes ({employees.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/40 p-4 transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-bold text-white">
                          {emp.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{emp.name}</p>
                          <Badge className={ROLE_COLORS[emp.role]}>{emp.role}</Badge>
                        </div>
                      </div>
                      <Badge
                        className={
                          emp.status === "Actif"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-600 dark:text-slate-400"
                        }
                      >
                        {emp.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <p>{emp.phone}</p>
                      <p>{emp.email}</p>
                      <p>Embauche: {emp.hireDate}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Star className="h-3 w-3 text-amber-500" />
                      <span className="text-slate-700 dark:text-slate-300">{emp.performance.rating}/5</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-700 dark:text-slate-300">{emp.performance.orders} cmd</span>
                    </div>
                    <div className="flex gap-2 border-t border-slate-100 dark:border-slate-600 pt-3">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => toggleStatus(emp.id)}>
                        <Pencil className="mr-1 h-3 w-3" />
                        {emp.status === "Actif" ? "Desactiver" : "Activer"}
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => deleteEmployee(emp.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shift Planning */}
          <Card className="mb-8 dark:bg-slate-800/60 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <CalendarDays className="h-5 w-5" />
                Planning des Shifts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-8 gap-px rounded-lg bg-slate-200 dark:bg-slate-600 overflow-hidden">
                    {/* Header */}
                    <div className="bg-slate-100 dark:bg-slate-700 p-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Heure
                    </div>
                    {DAYS.map((day, di) => (
                      <div key={di} className="bg-slate-100 dark:bg-slate-700 p-2 text-center">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{day}</span>
                        <div className="mt-1">
                          <button
                            onClick={() => addShift(di)}
                            className="rounded px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition"
                          >
                            + Shift
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Time rows */}
                    {HOURS.map((hour) => (
                      <div key={hour} className="contents">
                        <div className="bg-white dark:bg-slate-800 p-2 text-center text-xs text-slate-500 dark:text-slate-400">
                          {hour}h
                        </div>
                        {DAYS.map((_, di) => {
                          const cellShifts = shifts.filter(
                            (s) => s.day === di && hour >= s.startHour && hour < s.endHour
                          )
                          return (
                            <div key={di} className="relative bg-white dark:bg-slate-800 p-0.5 min-h-[28px]">
                              {cellShifts.map((s, si) => {
                                const emp = employees.find((e) => e.id === s.employeeId)
                                if (!emp) return null
                                return (
                                  <div
                                    key={si}
                                    className={`rounded px-1 py-0.5 text-[9px] font-medium text-white truncate ${colorMap[s.employeeId] || "bg-slate-400"}`}
                                    title={`${emp.name} (${s.startHour}h-${s.endHour}h)`}
                                  >
                                    {hour === s.startHour ? emp.name.split(" ")[0] : ""}
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-3">
                {employees.filter((e) => e.status === "Actif").map((emp) => (
                  <div key={emp.id} className="flex items-center gap-1.5">
                    <div className={`h-3 w-3 rounded ${colorMap[emp.id]}`} />
                    <span className="text-xs text-slate-600 dark:text-slate-400">{emp.name.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card className="mb-8 dark:bg-slate-800/60 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Trophy className="h-5 w-5 text-amber-500" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employeeOfMonth && (
                <div className="mb-6 flex items-center gap-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 p-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-lg font-bold text-white shadow-lg">
                    {employeeOfMonth.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Employe du mois</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{employeeOfMonth.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {employeeOfMonth.performance.orders} commandes • {employeeOfMonth.performance.rating}/5 note client
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Orders chart */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <ShoppingBag className="h-4 w-4" /> Commandes traitees
                  </h3>
                  <div className="space-y-2">
                    {employees.filter((e) => e.status === "Actif").map((emp) => (
                      <div key={emp.id} className="flex items-center gap-2">
                        <span className="w-20 truncate text-xs text-slate-600 dark:text-slate-400">
                          {emp.name.split(" ")[0]}
                        </span>
                        <div className="flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700 h-5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                            style={{ width: `${(emp.performance.orders / maxOrders) * 100}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-xs font-bold text-slate-700 dark:text-slate-300">
                          {emp.performance.orders}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Avg time */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <Clock className="h-4 w-4" /> Temps moyen service (min)
                  </h3>
                  <div className="space-y-2">
                    {employees.filter((e) => e.status === "Actif").map((emp) => (
                      <div key={emp.id} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-700/40 px-3 py-2">
                        <span className="text-xs text-slate-600 dark:text-slate-400">{emp.name.split(" ")[0]}</span>
                        <span className={`text-sm font-bold ${emp.performance.avgTime <= 10 ? "text-green-600 dark:text-green-400" : emp.performance.avgTime <= 15 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                          {emp.performance.avgTime} min
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ratings */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <Star className="h-4 w-4" /> Note client
                  </h3>
                  <div className="space-y-2">
                    {employees.filter((e) => e.status === "Actif").map((emp) => (
                      <div key={emp.id} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-700/40 px-3 py-2">
                        <span className="text-xs text-slate-600 dark:text-slate-400">{emp.name.split(" ")[0]}</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, si) => (
                            <Star
                              key={si}
                              className={`h-3.5 w-3.5 ${si < Math.round(emp.performance.rating) ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`}
                            />
                          ))}
                          <span className="ml-1 text-xs font-bold text-slate-700 dark:text-slate-300">{emp.performance.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Smart Task Assignment */}
          <Card className="dark:bg-slate-800/60 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Shuffle className="h-5 w-5" />
                  Affectation intelligente des zones
                </CardTitle>
                <Button onClick={optimizeZones} variant="outline" size="sm">
                  <Shuffle className="mr-2 h-4 w-4" />
                  Optimiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {ZONES.map((zone) => {
                  const assigned = zoneAssignments.filter((z) => z.zone === zone)
                  return (
                    <div
                      key={zone}
                      className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40 p-4"
                    >
                      <h4 className="mb-3 text-center text-sm font-bold text-slate-800 dark:text-slate-200">
                        {zone}
                      </h4>
                      <div className="space-y-2">
                        {assigned.length === 0 && (
                          <p className="text-center text-xs text-slate-400">Non affecte</p>
                        )}
                        {assigned.map((a) => {
                          const emp = employees.find((e) => e.id === a.employeeId)
                          if (!emp) return null
                          return (
                            <div key={a.employeeId} className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-[10px] font-bold text-white">
                                {emp.name.split(" ").map((n) => n[0]).join("")}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{emp.name}</p>
                                <Badge className={`text-[10px] ${ROLE_COLORS[emp.role]}`}>{emp.role}</Badge>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Employee Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Nouvel employe</h2>
                <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-700">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="dark:text-slate-300">Nom complet</Label>
                  <Input
                    value={newEmp.name}
                    onChange={(e) => setNewEmp((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Nom Prenom"
                  />
                </div>
                <div>
                  <Label className="dark:text-slate-300">Role</Label>
                  <select
                    value={newEmp.role}
                    onChange={(e) => setNewEmp((p) => ({ ...p, role: e.target.value as Role }))}
                    className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="Serveur">Serveur</option>
                    <option value="Cuisinier">Cuisinier</option>
                    <option value="Caissier">Caissier</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div>
                  <Label className="dark:text-slate-300">Telephone</Label>
                  <Input
                    value={newEmp.phone}
                    onChange={(e) => setNewEmp((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="0555 00 00 00"
                  />
                </div>
                <div>
                  <Label className="dark:text-slate-300">Email</Label>
                  <Input
                    type="email"
                    value={newEmp.email}
                    onChange={(e) => setNewEmp((p) => ({ ...p, email: e.target.value }))}
                    placeholder="email@restaurant.dz"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                    Annuler
                  </Button>
                  <Button className="flex-1" onClick={addEmployee}>
                    Ajouter
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <SiteFooter />
      </PageShell>
    </RequireAuth>
  )
}
