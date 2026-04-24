/**
 * Role-based routing helpers
 * --------------------------
 * Les rôles stockés dans Supabase `user_metadata.role` peuvent prendre
 * les valeurs suivantes. Le système est volontairement tolérant
 * (normalisation MAJ/minuscules + alias) pour rester compatible avec
 * l'historique (`CUSTOMER`, `STAFF`).
 */

export const ROLES = [
  "ADMIN",
  "SERVER",
  "KITCHEN",
  "BAR",
  "SHISHA",
  "CASHIER",
  "DELIVERY",
  "CLIENT",
  // legacy
  "STAFF",
  "CUSTOMER",
] as const

export type AppRole = (typeof ROLES)[number]

/**
 * Normalise une valeur de rôle (chaîne) en AppRole.
 * Fallback sur CLIENT.
 */
export function normalizeRole(raw: unknown): AppRole {
  if (typeof raw !== "string") return "CLIENT"
  const up = raw.trim().toUpperCase()
  // Aliases rétrocompatibles
  if (up === "CUSTOMER") return "CLIENT"
  if (up === "STAFF") return "SERVER"
  if ((ROLES as readonly string[]).includes(up)) return up as AppRole
  return "CLIENT"
}

/**
 * Retourne l'URL du dashboard correspondant à un rôle après login.
 * Chemins canoniques (le reste du code doit s'y référer).
 */
export function dashboardPathForRole(role: AppRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard"
    case "SERVER":
      return "/server/tables"
    case "KITCHEN":
      return "/kitchen/orders"
    case "BAR":
      return "/bar/orders"
    case "SHISHA":
      return "/shisha/orders"
    case "CASHIER":
      return "/cashier/dashboard"
    case "DELIVERY":
      return "/delivery/dashboard"
    case "CLIENT":
    case "CUSTOMER":
    case "STAFF":
    default:
      return "/account"
  }
}

/**
 * Rôles internes (staff) uniquement créables par un ADMIN.
 * Le signup public ne peut JAMAIS attribuer un de ces rôles.
 */
export const INTERNAL_ROLES: AppRole[] = [
  "ADMIN",
  "SERVER",
  "KITCHEN",
  "BAR",
  "SHISHA",
  "CASHIER",
  "DELIVERY",
]

/**
 * Rôles attribuables via l'UI admin (Gestion utilisateurs).
 * On exclut les alias legacy.
 */
export const ASSIGNABLE_ROLES: AppRole[] = [
  "CLIENT",
  "ADMIN",
  "SERVER",
  "KITCHEN",
  "BAR",
  "SHISHA",
  "CASHIER",
  "DELIVERY",
]

/**
 * Vérifie si un rôle fait partie du staff (interne).
 */
export function isStaffRole(role: AppRole): boolean {
  return INTERNAL_ROLES.includes(role)
}

/**
 * Vérifie si le rôle est celui d'un client.
 */
export function isClientRole(role: AppRole): boolean {
  return role === "CLIENT" || role === "CUSTOMER"
}
