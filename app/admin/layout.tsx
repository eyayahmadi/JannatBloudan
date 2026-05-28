"use client"

import type { ReactNode } from "react"
import { AdminPortalShell } from "@/components/admin/AdminPortalShell"
import { RequireAuth } from "@/components/auth/RequireAuth"

type AdminLayoutProps = {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <RequireAuth roles={["ADMIN"]}>
      <AdminPortalShell>{children}</AdminPortalShell>
    </RequireAuth>
  )
}
