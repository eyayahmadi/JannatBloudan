"use client"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { StationBoard } from "@/components/stations/StationBoard"
import { StaffWorkspaceShell } from "@/components/workspace/StaffWorkspaceShell"

export default function BarOrdersPage() {
  return (
    <RequireAuth roles={["ADMIN", "BAR"]}>
      <StaffWorkspaceShell title="Bar" subtitle="File des boissons & desserts — station BAR">
        <StationBoard station="BAR" layout="workspace" />
      </StaffWorkspaceShell>
    </RequireAuth>
  )
}
