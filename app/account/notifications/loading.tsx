import { PageSkeleton } from "@/components/site/PageSkeleton"

export default function NotificationsLoading() {
  return (
    <PageSkeleton
      hero={false}
      cards={4}
      label="Chargement de vos notifications…"
    />
  )
}
