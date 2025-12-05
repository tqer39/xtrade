'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Card, CreateCardInput } from '@/modules/cards/types';

interface UseCardSearchReturn {
  searchResults: Card[];
  isSearching: boolean;
  searchError: Error | null;
  search: (query: string, category?: string) => void;
  createCard: (input: CreateCardInput) => Promise<Card>;
  clearResults: () => void;
}

export function useCardSearch(): UseCardSearchReturn {
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<Error | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const search = useCallback((query: string, category?: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query });
        if (category) {
          params.append('category', category);
        }

        const res = await fetch(`/api/cards?${params.toString()}`);
        if (!res.ok) {
          throw new Error('Failed to search cards');
        }

        const data = await res.json();
        setSearchResults(data.cards || []);
        setSearchError(null);
      } catch (err) {
        setSearchError(err instanceof Error ? err : new Error('Unknown error'));
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const createCard = useCallback(async (input: CreateCardInput): Promise<Card> => {
    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to create card');
    }

    const data = await res.json();
    return data.card;
  }, []);

  const clearResults = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
  }, []);

  return {
    searchResults,
    isSearching,
    searchError,
    search,
    createCard,
    clearResults,
  };
}
