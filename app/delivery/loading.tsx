import { PageSkeleton } from "@/components/site/PageSkeleton"

export default function DeliveryLoading() {
  return <PageSkeleton cards={9} label="Chargement du catalogue de livraison…" />
}
