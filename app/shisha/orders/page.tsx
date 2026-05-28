"use client"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { StationBoard } from "@/components/stations/StationBoard"
import { StaffWorkspaceShell } from "@/components/workspace/StaffWorkspaceShell"

export default function ShishaOrdersPage() {
  return (
    <RequireAuth roles={["ADMIN", "SHISHA"]}>
      <StaffWorkspaceShell title="Chicha" subtitle="Commandes station SHISHA">
        <StationBoard station="SHISHA" layout="workspace" />
      </StaffWorkspaceShell>
    </RequireAuth>
  )
}
