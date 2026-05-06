import { PageSkeleton } from "@/components/site/PageSkeleton"

export default function KitchenLoading() {
  return (
    <PageSkeleton
      hero={false}
      cards={6}
      label="Chargement des commandes cuisine…"
    />
  )
}
