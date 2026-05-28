import { type AppRole, dashboardPathForRole, isStaffRole, normalizeRole } from "@/lib/auth/roles"

const ROLE_HOME_LABEL: Partial<Record<AppRole, string>> = {
  SERVER: "Salle",
  KITCHEN: "Cuisine",
  BAR: "Bar",
  SHISHA: "Chicha",
  CASHIER: "Caisse",
  DELIVERY: "Livraison",
}

function normalizePath(path: string): string {
  const raw = path.split("?")[0]?.split("#")[0] ?? "/"
  if (!raw || raw === "") return "/"
  return raw.length > 1 && raw.endsWith("/") ? raw.slice(0, -1) : raw
}

/**
 * Cible du lien « retour » pour le personnel lorsque l’UI pointait vers `/admin`.
 * Le tableau de bord `/admin` est réservé au rôle ADMIN ; les autres rôles
 * sont renvoyés vers leur espace (`dashboardPathForRole`) ou l’accueil du site.
 */
export function getStaffPortalBackNav(role: unknown, pathname: string): { href: string; label: string } {
  const r = normalizeRole(role)
  if (r === "ADMIN") {
    return { href: "/admin", label: "Admin" }
  }

  if (!isStaffRole(r)) {
    return { href: "/", label: "Accueil" }
  }

  const href = dashboardPathForRole(r)
  const p = normalizePath(pathname)
  const h = normalizePath(href)

  if (p === h || (h !== "/" && p.startsWith(`${h}/`))) {
    return { href: "/", label: "Accueil" }
  }

  return { href, label: ROLE_HOME_LABEL[r] ?? "Accueil" }
}
