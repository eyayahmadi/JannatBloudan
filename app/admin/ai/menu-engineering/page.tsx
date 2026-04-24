"use client"

import { PieChart } from "lucide-react"
import { AIInsightPage } from "@/components/admin/AIInsightPage"

export default function MenuEngineeringPage() {
  return (
    <AIInsightPage
      title="Menu Engineering"
      subtitle="Stars, cash cows, puzzles, dogs — rentabilite vs popularite"
      endpoint="/api/ai/menu-engineering"
      icon={PieChart}
    />
  )
}
