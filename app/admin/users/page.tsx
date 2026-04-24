"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BadgeCheck,
  Check,
  ChefHat,
  CircleDollarSign,
  Loader2,
  Mail,
  Phone,
  Pencil,
  Plus,
  Search,
  Shield,
  ShoppingBag,
  Trash2,
  Truck,
  User as UserIcon,
  UserCog,
  Users,
  Wine,
  X,
} from "lucide-react"
import { PageShell } from "@/components/site/PageShell"
import { SiteHeader } from "@/components/site/SiteHeader"
import { PageHero } from "@/components/site/PageHero"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AIAgentBadge } from "@/components/ai/AIAgentBadge"
import { ASSIGNABLE_ROLES, type AppRole } from "@/lib/auth/roles"
import { SITE } from "@/lib/site-config"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type AdminUser = {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  role: AppRole
  is_active: boolean
  created_at: string
  last_sign_in_at: string | null
  banned_until: string | null
}

const ROLE_META: Record<AppRole, { label: string; icon: React.ElementType; color: string }> = {
  ADMIN: { label: "Administrateur", icon: Shield, color: "bg-rose-100 text-rose-800 border-rose-300" },
  SERVER: { label: "Serveur", icon: UserIcon, color: "bg-cyan-100 text-cyan-800 border-cyan-300" },
  KITCHEN: { label: "Cuisine", icon: ChefHat, color: "bg-orange-100 text-orange-800 border-orange-300" },
  BAR: { label: "Bar", icon: Wine, color: "bg-sky-100 text-sky-800 border-sky-300" },
  SHISHA: { label: "Chicha", icon: ShoppingBag, color: "bg-violet-100 text-violet-800 border-violet-300" },
  CASHIER: { label: "Caisse", icon: CircleDollarSign, color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  DELIVERY: { label: "Livreur", icon: Truck, color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  CLIENT: { label: "Client", icon: Users, color: "bg-amber-100 text-amber-800 border-amber-300" },
  CUSTOMER: { label: "Client", icon: Users, color: "bg-amber-100 text-amber-800 border-amber-300" },
  STAFF: { label: "Staff", icon: BadgeCheck, color: "bg-slate-100 text-slate-800 border-slate-300" },
}

export default function AdminUsersPage() {
  return (
    <RequireAuth roles={["ADMIN"]}>
      <PageShell>
        <SiteHeader backHref="/admin" hideMainNav />
        <PageHero
          imageSrc={SITE.images.interior}
          imageAlt=""
          kicker="Administration"
          title="Gestion des utilisateurs"
          subtitle="Créez et gérez les comptes clients, admins et staff (cuisine, bar, chicha, serveur, caisse, livreur)."
          height="sm"
        />
        <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <UsersManager />
        </div>
        <AIAgentBadge context="admin" />
      </PageShell>
    </RequireAuth>
  )
}

function UsersManager() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<AppRole | "ALL">("ALL")
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Erreur")
      setUsers(json.users ?? [])
    } catch (e: any) {
      toast.error(e.message ?? "Impossible de charger les utilisateurs")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false
      if (!q) return true
      return (
        u.email.toLowerCase().includes(q) ||
        u.first_name.toLowerCase().includes(q) ||
        u.last_name.toLowerCase().includes(q) ||
        (u.phone ?? "").toLowerCase().includes(q)
      )
    })
  }, [users, search, roleFilter])

  const stats = useMemo(() => {
    return ASSIGNABLE_ROLES.map((r) => ({
      role: r,
      count: users.filter((u) => u.role === r).length,
    }))
  }, [users])

  return (
    <div className="space-y-6">
      {/* Stats chips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8"
      >
        {stats.map((s) => {
          const meta = ROLE_META[s.role]
          const Icon = meta.icon
          return (
            <button
              key={s.role}
              type="button"
              onClick={() => setRoleFilter(roleFilter === s.role ? "ALL" : s.role)}
              className={cn(
                "flex items-center gap-3 rounded-2xl border bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md",
                roleFilter === s.role ? "border-amber-500 ring-2 ring-amber-300/40" : "border-amber-100",
              )}
            >
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", meta.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-amber-700/70">{meta.label}</p>
                <p className="numeric-display text-xl font-bold text-amber-950">{s.count}</p>
              </div>
            </button>
          )
        })}
      </motion.div>

      {/* Toolbar */}
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-700/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (email, nom, téléphone)…"
            className="border-amber-200 bg-white/90 pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          {roleFilter !== "ALL" ? (
            <Button variant="outline" size="sm" onClick={() => setRoleFilter("ALL")}>
              <X className="mr-1 h-3.5 w-3.5" />
              Filtre: {ROLE_META[roleFilter].label}
            </Button>
          ) : null}
          <Button
            onClick={() => setCreating(true)}
            className="bg-gradient-to-r from-amber-700 to-orange-600 text-white shadow-md hover:from-amber-800 hover:to-orange-700"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Ajouter un utilisateur
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-amber-100 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-amber-50/70 text-xs uppercase tracking-wider text-amber-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Utilisateur</th>
                <th className="px-4 py-3 text-left font-semibold">Rôle</th>
                <th className="hidden px-4 py-3 text-left font-semibold md:table-cell">Contact</th>
                <th className="hidden px-4 py-3 text-left font-semibold lg:table-cell">Créé le</th>
                <th className="px-4 py-3 text-center font-semibold">Statut</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-amber-700" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-amber-800/70">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const meta = ROLE_META[u.role]
                  const RoleIcon = meta.icon
                  const initials = `${u.first_name?.[0] ?? ""}${u.last_name?.[0] ?? ""}`.toUpperCase() || u.email[0].toUpperCase()
                  return (
                    <tr key={u.id} className="transition hover:bg-amber-50/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-orange-700 font-semibold text-white">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-amber-950">
                              {u.first_name} {u.last_name}
                              {u.first_name || u.last_name ? null : <span className="text-amber-800/60">—</span>}
                            </p>
                            <p className="text-xs text-amber-800/70">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", meta.color)}>
                          <RoleIcon className="h-3.5 w-3.5" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-amber-900/80 md:table-cell">
                        {u.phone ?? <span className="text-amber-800/40">—</span>}
                      </td>
                      <td className="hidden px-4 py-3 text-amber-900/80 lg:table-cell">
                        {new Date(u.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {u.is_active ? (
                          <Badge className="bg-emerald-100 text-emerald-800">Actif</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Désactivé</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditing(u)}
                            className="text-amber-800 hover:bg-amber-100"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <DeleteButton user={u} onDeleted={load} />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      <AnimatePresence>
        {creating ? (
          <UserFormModal
            mode="create"
            onClose={() => setCreating(false)}
            onSaved={() => {
              setCreating(false)
              void load()
            }}
          />
        ) : null}
        {editing ? (
          <UserFormModal
            mode="edit"
            user={editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null)
              void load()
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Create / Edit modal                                                       */
/* -------------------------------------------------------------------------- */

function UserFormModal({
  mode,
  user,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit"
  user?: AdminUser
  onClose: () => void
  onSaved: () => void
}) {
  const [firstName, setFirstName] = useState(user?.first_name ?? "")
  const [lastName, setLastName] = useState(user?.last_name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [role, setRole] = useState<AppRole>((user?.role as AppRole) ?? "SERVER")
  const [password, setPassword] = useState("")
  const [isActive, setIsActive] = useState<boolean>(user?.is_active ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            role,
            password: password || randomPassword(),
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || "Erreur création")
        toast.success("Utilisateur créé avec succès")
      } else if (user) {
        const res = await fetch(`/api/admin/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            role,
            is_active: isActive,
            ...(password ? { password } : {}),
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || "Erreur mise à jour")
        toast.success("Utilisateur mis à jour")
      }
      onSaved()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-amber-100 px-6 py-4">
          <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-amber-950">
            <UserCog className="h-5 w-5 text-amber-700" />
            {mode === "create" ? "Nouvel utilisateur" : "Modifier utilisateur"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-amber-800 transition hover:bg-amber-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-amber-950">Prénom</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-amber-950">Nom</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-amber-950">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-700/40" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-amber-950">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-700/40" />
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
                placeholder="+33 6 12 34 56 78"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-amber-950">Rôle</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ASSIGNABLE_ROLES.map((r) => {
                const meta = ROLE_META[r]
                const Icon = meta.icon
                const active = role === r
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-xs font-semibold transition",
                      active
                        ? "border-amber-600 bg-amber-50 text-amber-900 shadow-sm"
                        : "border-amber-100 bg-white text-amber-800 hover:border-amber-300",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {meta.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-amber-950">
              {mode === "create" ? "Mot de passe temporaire" : "Nouveau mot de passe (optionnel)"}
            </label>
            <Input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "create" ? "Laissez vide pour générer automatiquement" : "Laissez vide pour ne pas changer"}
              className="font-mono"
            />
            {mode === "create" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 text-amber-700"
                onClick={() => setPassword(randomPassword())}
              >
                Générer un mot de passe
              </Button>
            ) : null}
          </div>

          {mode === "edit" ? (
            <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/40 p-3">
              <div>
                <p className="font-medium text-amber-950">Compte actif</p>
                <p className="text-xs text-amber-800/70">
                  Si désactivé, l'utilisateur ne pourra plus se connecter.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive((v) => !v)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition",
                  isActive ? "bg-emerald-500" : "bg-slate-300",
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white shadow transition",
                    isActive ? "translate-x-6" : "translate-x-1",
                  )}
                />
              </button>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}

          <div className="flex items-center justify-end gap-2 border-t border-amber-100 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-amber-700 to-orange-600 text-white hover:from-amber-800 hover:to-orange-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
              {mode === "create" ? "Créer" : "Enregistrer"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Delete                                                                    */
/* -------------------------------------------------------------------------- */

function DeleteButton({ user, onDeleted }: { user: AdminUser; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false)
  const onClick = async () => {
    const confirmed = window.confirm(
      `Supprimer définitivement ${user.email} ?\nCette action est irréversible.`,
    )
    if (!confirmed) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || "Erreur suppression")
      toast.success("Utilisateur supprimé")
      onDeleted()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={loading}
      className="text-red-600 hover:bg-red-50 hover:text-red-700"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/*  Utils                                                                     */
/* -------------------------------------------------------------------------- */

function randomPassword() {
  const words = ["Bloudan", "Mezze", "Safran", "Jasmin", "Cedre", "Harissa", "Cardamome"]
  const w = words[Math.floor(Math.random() * words.length)]
  const n = Math.floor(1000 + Math.random() * 9000)
  const sym = "!@#$%"[Math.floor(Math.random() * 5)]
  return `${w}${n}${sym}`
}
