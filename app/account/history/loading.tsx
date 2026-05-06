import { PageSkeleton } from "@/components/site/PageSkeleton"

export default function HistoryLoading() {
  return (
    <PageSkeleton
      hero={false}
      cards={6}
      label="Chargement de votre historique de commandes…"
    />
  )
}
