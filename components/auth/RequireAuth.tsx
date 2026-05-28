"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/context/AuthContext"
import { isStaffRole, type AppRole } from "@/lib/auth/roles"

type RequireAuthRole = AppRole

type RequireAuthProps = {
  children: ReactNode
  roles?: RequireAuthRole[]
  fallback?: ReactNode
}

/**
 * `STAFF` dans `roles` = tout le personnel interne (SERVER, CUISINE, etc.).
 * En base, le rôle « staff » est normalisé en SERVER (voir normalizeRole) :
 * sans cette règle, includes(user.role) échoue et la page reste vide.
 */
function matchesAllowedRoles(userRole: RequireAuthRole, roles: RequireAuthRole[]): boolean {
  if (roles.includes(userRole)) return true
  if (roles.includes("STAFF") && isStaffRole(userRole)) return true
  return false
}

export function RequireAuth({ children, roles, fallback }: RequireAuthProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { loading, isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
      return
    }
    if (roles && user && !matchesAllowedRoles(user.role, roles)) {
      router.replace("/403")
    }
  }, [loading, isAuthenticated, user, roles, router, pathname])

  if (loading) {
    return fallback ?? <div className="p-6 text-center text-slate-500">Vérification de la session...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  if (roles && user && !matchesAllowedRoles(user.role, roles)) {
    return null
  }

  return <>{children}</>
}
