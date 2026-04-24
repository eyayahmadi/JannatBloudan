"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/context/AuthContext"

type AppRole =
  | "CLIENT"
  | "ADMIN"
  | "SERVER"
  | "KITCHEN"
  | "BAR"
  | "SHISHA"
  | "CASHIER"
  | "DELIVERY"
  | "CUSTOMER"
  | "STAFF"

type RequireAuthProps = {
  children: ReactNode
  roles?: AppRole[]
  fallback?: ReactNode
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
    if (roles && user && !roles.includes(user.role)) {
      router.replace("/403")
    }
  }, [loading, isAuthenticated, user, roles, router, pathname])

  if (loading) {
    return fallback ?? <div className="p-6 text-center text-slate-500">VÇ¸rification de la session...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  if (roles && user && !roles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
