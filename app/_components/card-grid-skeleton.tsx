'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function CardGridSkeleton() {
  // フィーチャーカードのパターン（0, 5, 11番目を大きく）
  const featuredIndices = new Set([0, 5, 11]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5 auto-rows-fr">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton
          key={`skeleton-${i.toString()}`}
          className={`rounded-2xl bg-zinc-800 ${
            featuredIndices.has(i) ? 'aspect-[4/5] row-span-2' : 'aspect-[3/4]'
          }`}
        />
      ))}
    </div>
  );
}
