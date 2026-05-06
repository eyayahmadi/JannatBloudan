import { PageSkeleton } from "@/components/site/PageSkeleton"

export default function AccountLoading() {
  return (
    <PageSkeleton
      hero={false}
      cards={4}
      label="Chargement de votre espace personnel…"
    />
  )
}
