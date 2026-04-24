"use client"

import { GraduationCap } from "lucide-react"
import { AIInsightPage } from "@/components/admin/AIInsightPage"

export default function LearningPage() {
  return (
    <AIInsightPage
      title="Auto-Learning & modeles"
      subtitle="Registry en ligne, drift, RL policy (demo operationnelle)"
      endpoint="/api/ai/learning"
      icon={GraduationCap}
    />
  )
}
