"use client"

import { Rocket } from "lucide-react"
import { AIInsightPage } from "@/components/admin/AIInsightPage"
import { NextGenDashboard } from "@/components/admin/ai/InsightAgentDashboards"

export default function NextGenPage() {
  return (
    <AIInsightPage
      title="Innovations NEXT GEN"
      subtitle="Laboratoire produit — feuille de route, ROI et activation sandbox."
      endpoint="/api/ai/next-gen"
      icon={Rocket}
      dashboard={(ctx) => <NextGenDashboard {...ctx} />}
    />
  )
}
