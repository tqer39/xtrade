'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CardSet, CardSetWithCount, CardSetWithItems } from '@/modules/cards/types';

interface UseMySetsReturn {
  sets: CardSetWithCount[];
  isLoading: boolean;
  error: Error | null;
  createSet: (name: string, description?: string, isPublic?: boolean) => Promise<CardSet>;
  updateSet: (
    setId: string,
    data: { name?: string; description?: string; isPublic?: boolean }
  ) => Promise<void>;
  deleteSet: (setId: string) => Promise<void>;
  getSetDetail: (setId: string) => Promise<CardSetWithItems | null>;
  addCardToSet: (setId: string, cardId: string, quantity?: number) => Promise<void>;
  removeCardFromSet: (setId: string, cardId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useMySets(): UseMySetsReturn {
  const [sets, setSets] = useState<CardSetWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/me/sets');
      if (!res.ok) {
        throw new Error('Failed to fetch sets');
      }
      const data = await res.json();
      setSets(data.sets || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSets();
  }, [fetchSets]);

  const createSet = useCallback(
    async (name: string, description?: string, isPublic?: boolean): Promise<CardSet> => {
      const res = await fetch('/api/me/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, isPublic }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create set');
      }
      const data = await res.json();
      await fetchSets();
      return data.set;
    },
    [fetchSets]
  );

  const updateSet = useCallback(
    async (setId: string, data: { name?: string; description?: string; isPublic?: boolean }) => {
      const res = await fetch(`/api/me/sets/${setId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error || 'Failed to update set');
      }
      await fetchSets();
    },
    [fetchSets]
  );

  const deleteSet = useCallback(
    async (setId: string) => {
      const res = await fetch(`/api/me/sets/${setId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete set');
      }
      await fetchSets();
    },
    [fetchSets]
  );

  const getSetDetail = useCallback(async (setId: string): Promise<CardSetWithItems | null> => {
    const res = await fetch(`/api/me/sets/${setId}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      const data = await res.json();
      throw new Error(data.error || 'Failed to fetch set');
    }
    const data = await res.json();
    return data.set;
  }, []);

  const addCardToSet = useCallback(async (setId: string, cardId: string, quantity?: number) => {
    const res = await fetch(`/api/me/sets/${setId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId, quantity }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to add card to set');
    }
  }, []);

  const removeCardFromSet = useCallback(async (setId: string, cardId: string) => {
    const res = await fetch(`/api/me/sets/${setId}/items/${cardId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to remove card from set');
    }
  }, []);

  return {
    sets,
    isLoading,
    error,
    createSet,
    updateSet,
    deleteSet,
    getSetDetail,
    addCardToSet,
    removeCardFromSet,
    refetch: fetchSets,
  };
}
