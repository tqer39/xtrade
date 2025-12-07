'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={`skeleton-${i.toString()}`} className="aspect-square rounded-lg" />
      ))}
    </div>
  );
}
