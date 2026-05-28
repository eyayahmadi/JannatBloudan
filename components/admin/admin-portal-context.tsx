"use client"

import { createContext, useContext } from "react"

export type AdminDashboardPeriod = "today" | "week" | "month"

export type AdminPortalContextValue = {
  /** Masque le chrome mesh / min-height des pages imbriquées. */
  suppressPageChrome: boolean
  /** Masque le SiteHeader interne des pages (navigation par le shell). */
  suppressPageHeaders: boolean
  dashboardPeriod: AdminDashboardPeriod
  setDashboardPeriod: (p: AdminDashboardPeriod) => void
}

const AdminPortalContext = createContext<AdminPortalContextValue | null>(null)

export function AdminPortalProvider({
  value,
  children,
}: {
  value: AdminPortalContextValue
  children: React.ReactNode
}) {
  return <AdminPortalContext.Provider value={value}>{children}</AdminPortalContext.Provider>
}

export function useAdminPortal(): AdminPortalContextValue {
  const v = useContext(AdminPortalContext)
  if (!v) {
    throw new Error("useAdminPortal must be used within AdminPortalProvider")
  }
  return v
}

export function useAdminPortalOptional(): AdminPortalContextValue | null {
  return useContext(AdminPortalContext)
}
