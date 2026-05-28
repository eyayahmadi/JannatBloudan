"use client"

import { RequireAuth } from "@/components/auth/RequireAuth"
import { AIAgentBadge } from "@/components/ai/AIAgentBadge"
import { DriverDashboardView } from "@/components/delivery/DriverDashboardView"
import { StaffWorkspaceShell } from "@/components/workspace/StaffWorkspaceShell"

export default function DeliveryStaffDashboardPage() {
  return (
    <RequireAuth roles={["DELIVERY", "ADMIN"]}>
      <StaffWorkspaceShell title="Livraison" subtitle="Courses assignées et statuts">
        <div className="min-h-0 flex-1">
          <DriverDashboardView variant="workspace" />
          <AIAgentBadge context="driver" />
        </div>
      </StaffWorkspaceShell>
    </RequireAuth>
  )
}
