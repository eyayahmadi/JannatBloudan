"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { useSupabaseRealtime } from "@/lib/hooks/useSupabaseRealtime"
import { useWorkflowNotifications } from "@/lib/hooks/useWorkflowNotifications"

function shouldEnableRealtime(pathname: string): boolean {
  return (
    /^\/(kitchen|bar|shisha|server|pos|caisse|admin|table)(\/|$)/.test(pathname) ||
    pathname === "/menu" ||
    pathname.startsWith("/delivery")
  )
}

/** Active Realtime + notifications workflow sur les parcours staff / QR / menu. */
export function RealtimeSyncProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? ""
  const enabled = shouldEnableRealtime(pathname)
  useSupabaseRealtime(enabled)
  useWorkflowNotifications(enabled)
  return <>{children}</>
}
