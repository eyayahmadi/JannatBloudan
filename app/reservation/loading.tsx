import { PageSkeleton } from "@/components/site/PageSkeleton"

export default function ReservationLoading() {
  return (
    <PageSkeleton
      cards={4}
      label="Chargement du module de réservation…"
    />
  )
}
