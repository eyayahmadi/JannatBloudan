"use client"

import { GraduationCap } from "lucide-react"
import { AIInsightPage } from "@/components/admin/AIInsightPage"
import { LearningDashboard } from "@/components/admin/ai/InsightAgentDashboards"

export default function LearningPage() {
  return (
    <AIInsightPage
      title="Auto-Learning & modèles"
      subtitle="Santé du modèle, drift, exploration et expériences A/B."
      endpoint="/api/ai/learning"
      icon={GraduationCap}
      dashboard={(ctx) => <LearningDashboard {...ctx} />}
    />
  )
}
