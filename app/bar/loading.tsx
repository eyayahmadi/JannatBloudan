import { PageSkeleton } from "@/components/site/PageSkeleton"

export default function BarLoading() {
  return (
    <PageSkeleton
      hero={false}
      cards={6}
      label="Chargement des commandes bar…"
    />
  )
}
