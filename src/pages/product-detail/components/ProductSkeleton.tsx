import { Skeleton } from "@/components/ui/skeleton";

export const ProductSkeleton = () => (
  <div className="container-x py-5 sm:py-8">
    {/* Breadcrumb skeleton */}
    <Skeleton className="h-4 w-64 mb-5" />

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
      {/* Gallery skeleton — matches aspect-square */}
      <div>
        <Skeleton className="w-full aspect-square rounded-3xl" />
        <div className="mt-3 grid grid-cols-5 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>

      {/* Info column skeleton */}
      <div className="space-y-5">
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-3/4 mt-2" />
          <Skeleton className="h-3 w-32 mt-2" />
        </div>
        {/* Price cards */}
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        {/* Total */}
        <Skeleton className="h-16 w-full rounded-2xl" />
        {/* Pincode */}
        <Skeleton className="h-11 w-full rounded-full" />
        {/* CTAs */}
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-12 rounded-full" />
          <Skeleton className="h-12 rounded-full" />
        </div>
        {/* Trust */}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-32 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);
