"use client"

import { Rocket } from "lucide-react"
import { AIInsightPage } from "@/components/admin/AIInsightPage"

export default function NextGenPage() {
  return (
    <AIInsightPage
      title="Innovations NEXT GEN"
      subtitle="Emotion AI, predictive ordering, geo-fence, split bill, cuisine live…"
      endpoint="/api/ai/next-gen"
      icon={Rocket}
    />
  )
}
