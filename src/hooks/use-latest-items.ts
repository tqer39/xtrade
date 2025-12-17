'use client';

import { useCallback, useState } from 'react';
import useSWR from 'swr';
import type { CardWithCreator } from '@/modules/cards/types';

interface UseLatestItemsOptions {
  limit?: number;
  initialPage?: number;
  query?: string;
}

interface UseLatestItemsReturn {
  latestItems: CardWithCreator[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  total: number;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  setQuery: (query: string) => void;
}

interface LatestItemsResponse {
  cards: CardWithCreator[];
  total: number;
  totalPages: number;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch latest items');
    return res.json();
  });

export function useLatestItems(options: UseLatestItemsOptions = {}): UseLatestItemsReturn {
  const { limit = 12, initialPage = 1 } = options;
  const [page, setPage] = useState(initialPage);
  const [query, setQueryState] = useState(options.query ?? '');

  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('page', String(page));
  if (query) {
    params.set('q', query);
  }

  const { data, isLoading, error, mutate } = useSWR<LatestItemsResponse>(
    `/api/items/latest?${params.toString()}`,
    fetcher,
    { keepPreviousData: true }
  );

  const handleSetQuery = useCallback((newQuery: string) => {
    setQueryState((prev) => {
      if (prev !== newQuery) {
        setPage(1); // クエリが変わった時のみページをリセット
      }
      return newQuery;
    });
  }, []);

  return {
    latestItems: data?.cards ?? [],
    isLoading,
    error: error ?? null,
    refetch: () => mutate(),
    total: data?.total ?? 0,
    page,
    totalPages: data?.totalPages ?? 0,
    setPage,
    setQuery: handleSetQuery,
  };
}
