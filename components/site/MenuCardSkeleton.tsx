import { Skeleton } from "@/components/ui/skeleton"

export function MenuCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-amber-200/40 bg-white shadow-md dark:border-white/10 dark:bg-white/5">
      <Skeleton className="h-56 w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}

export function MenuCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <MenuCardSkeleton key={i} />
      ))}
    </div>
  )
}
