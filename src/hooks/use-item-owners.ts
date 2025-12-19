'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Card, CardOwner } from '@/modules/cards/types';

interface UseItemOwnersReturn {
  card: Card | null;
  owners: CardOwner[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useItemOwners(cardId: string | null): UseItemOwnersReturn {
  const [card, setCard] = useState<Card | null>(null);
  const [owners, setOwners] = useState<CardOwner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCardOwners = useCallback(async () => {
    if (!cardId) {
      setCard(null);
      setOwners([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/items/${cardId}/owners`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Card not found');
        }
        throw new Error('Failed to fetch card owners');
      }
      const data = await res.json();
      setCard(data.card || null);
      setOwners(data.owners || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setCard(null);
      setOwners([]);
    } finally {
      setIsLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    fetchCardOwners();
  }, [fetchCardOwners]);

  const refetch = useCallback(() => {
    fetchCardOwners();
  }, [fetchCardOwners]);

  return {
    card,
    owners,
    isLoading,
    error,
    refetch,
  };
}
