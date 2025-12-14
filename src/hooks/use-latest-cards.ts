'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CardWithCreator } from '@/modules/cards/types';

interface UseLatestCardsOptions {
  limit?: number;
  initialPage?: number;
  query?: string;
}

interface UseLatestCardsReturn {
  latestCards: CardWithCreator[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  total: number;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  setQuery: (query: string) => void;
}

export function useLatestCards(options: UseLatestCardsOptions = {}): UseLatestCardsReturn {
  const { limit = 12, initialPage = 1 } = options;
  const [latestCards, setLatestCards] = useState<CardWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [query, setQuery] = useState(options.query ?? '');

  const fetchLatestCards = useCallback(async () => {
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
        throw new Error('Failed to fetch latest cards');
      }
      const data = await res.json();
      setLatestCards(data.cards || []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLatestCards([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [limit, page, query]);

  useEffect(() => {
    fetchLatestCards();
  }, [fetchLatestCards]);

  const refetch = useCallback(() => {
    fetchLatestCards();
  }, [fetchLatestCards]);

  const handleSetQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setPage(1); // 検索時はページをリセット
  }, []);

  return {
    latestCards,
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
