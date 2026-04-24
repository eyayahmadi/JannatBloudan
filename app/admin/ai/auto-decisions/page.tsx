"use client"

import { Gavel } from "lucide-react"
import { AIInsightPage } from "@/components/admin/AIInsightPage"

export default function AutoDecisionsPage() {
  return (
    <AIInsightPage
      title="Agent Decision automatique"
      subtitle="Promo, prix, stock — regles + governance (seuils)"
      endpoint="/api/ai/auto-decisions"
      icon={Gavel}
    />
  )
}
