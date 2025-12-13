'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CardWithCreator } from '@/modules/cards/types';

interface UseLatestCardsReturn {
  latestCards: CardWithCreator[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useLatestCards(limit = 20): UseLatestCardsReturn {
  const [latestCards, setLatestCards] = useState<CardWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLatestCards = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/cards/latest?limit=${limit}`);
      if (!res.ok) {
        throw new Error('Failed to fetch latest cards');
      }
      const data = await res.json();
      setLatestCards(data.cards || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLatestCards([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchLatestCards();
  }, [fetchLatestCards]);

  const refetch = useCallback(() => {
    fetchLatestCards();
  }, [fetchLatestCards]);

  return {
    latestCards,
    isLoading,
    error,
    refetch,
  };
}
