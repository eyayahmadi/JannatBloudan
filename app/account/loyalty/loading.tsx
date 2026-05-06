import { PageSkeleton } from "@/components/site/PageSkeleton"

export default function LoyaltyLoading() {
  return (
    <PageSkeleton
      hero={false}
      cards={3}
      label="Chargement de votre programme fidélité…"
    />
  )
}
