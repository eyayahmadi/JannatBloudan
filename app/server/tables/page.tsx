"use client"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { ServerFloorPlan } from "@/components/server/ServerFloorPlan"
import { StaffWorkspaceShell } from "@/components/workspace/StaffWorkspaceShell"

export default function ServerTablesPage() {
  return (
    <RequireAuth roles={["ADMIN", "SERVER"]}>
      <StaffWorkspaceShell title="Service — salle" subtitle="Tables, alertes et actions serveur">
        <ServerFloorPlan layout="workspace" />
      </StaffWorkspaceShell>
    </RequireAuth>
  )
}
