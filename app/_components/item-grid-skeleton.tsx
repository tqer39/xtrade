'use client';

import { Skeleton } from '@/components/ui/skeleton';

// ランダムな高さのパターン
const heightPatterns = [
  'aspect-[3/4]',
  'aspect-[4/5]',
  'aspect-[3/4]',
  'aspect-[5/6]',
  'aspect-[3/4]',
  'aspect-[4/5]',
  'aspect-[3/4]',
  'aspect-[5/7]',
  'aspect-[3/4]',
  'aspect-[4/5]',
  'aspect-[3/4]',
  'aspect-[5/6]',
];

export function ItemGridSkeleton() {
  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-0.5">
      {heightPatterns.map((height, i) => (
        <Skeleton
          key={`skeleton-${i.toString()}`}
          className={`bg-zinc-800 rounded-sm mb-0.5 ${height}`}
        />
      ))}
    </div>
  );
}
