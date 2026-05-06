import { PageSkeleton } from "@/components/site/PageSkeleton"

export default function ShishaLoading() {
  return (
    <PageSkeleton
      hero={false}
      cards={6}
      label="Chargement des commandes chicha…"
    />
  )
}
