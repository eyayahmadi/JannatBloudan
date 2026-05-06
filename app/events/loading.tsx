import { PageSkeleton } from "@/components/site/PageSkeleton"

export default function EventsLoading() {
  return <PageSkeleton cards={6} label="Chargement des événements…" />
}
