import { PageSkeleton } from "@/components/site/PageSkeleton"

export default function MenuLoading() {
  return <PageSkeleton cards={9} label="Chargement de la carte…" />
}
