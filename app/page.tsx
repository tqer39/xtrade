import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { HomePageClient } from './_components/home-page-client';

function HomePageFallback() {
  return (
    <div className="container mx-auto px-4 py-4">
      <Skeleton className="h-8 w-48 mb-6" />
      <Skeleton className="h-10 w-full mb-4" />
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomePageFallback />}>
      <HomePageClient />
    </Suspense>
  );
}
