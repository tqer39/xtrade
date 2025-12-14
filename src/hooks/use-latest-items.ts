'use client';

import { useCallback, useEffect, useState } from 'react';
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

export function useLatestItems(options: UseLatestItemsOptions = {}): UseLatestItemsReturn {
  const { limit = 12, initialPage = 1 } = options;
  const [latestItems, setLatestItems] = useState<CardWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [query, setQuery] = useState(options.query ?? '');

  const fetchLatestItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('page', String(page));
      if (query) {
        params.set('q', query);
      }

      const res = await fetch(`/api/items/latest?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch latest items');
      }
      const data = await res.json();
      setLatestItems(data.cards || []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLatestItems([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [limit, page, query]);

  useEffect(() => {
    fetchLatestItems();
  }, [fetchLatestItems]);

  const refetch = useCallback(() => {
    fetchLatestItems();
  }, [fetchLatestItems]);

  const handleSetQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setPage(1); // 検索時はページをリセット
  }, []);

  return {
    latestItems,
    isLoading,
    error,
    refetch,
    total,
    page,
    totalPages,
    setPage,
    setQuery: handleSetQuery,
  };
}
