"use client"

import { PieChart } from "lucide-react"
import { AIInsightPage } from "@/components/admin/AIInsightPage"
import { MenuEngineeringDashboard } from "@/components/admin/ai/InsightAgentDashboards"

export default function MenuEngineeringPage() {
  return (
    <AIInsightPage
      title="Menu Engineering"
      subtitle="Matrice rentabilité × popularité — quadrants, KPIs et suggestions IA."
      endpoint="/api/ai/menu-engineering"
      icon={PieChart}
      dashboard={(ctx) => <MenuEngineeringDashboard {...ctx} />}
    />
  )
}
