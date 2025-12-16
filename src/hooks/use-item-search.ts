'use client';

import { useCallback, useState } from 'react';
import useSWR from 'swr';
import type { Card, CreateCardInput } from '@/modules/cards/types';
import { useDebounce } from './use-debounce';

interface UseItemSearchReturn {
  searchResults: Card[];
  isSearching: boolean;
  searchError: Error | null;
  search: (query: string, category?: string) => void;
  createCard: (input: CreateCardInput) => Promise<Card>;
  clearResults: () => void;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to search cards');
    return res.json();
  });

export function useItemSearch(): UseItemSearchReturn {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const searchKey = debouncedQuery.trim()
    ? `/api/items?q=${encodeURIComponent(debouncedQuery)}${category ? `&category=${encodeURIComponent(category)}` : ''}`
    : null;

  const { data, isLoading, error } = useSWR<{ cards: Card[] }>(searchKey, fetcher, {
    keepPreviousData: true,
  });

  const search = useCallback((q: string, cat?: string) => {
    setQuery(q);
    if (cat !== undefined) {
      setCategory(cat);
    }
  }, []);

  const createCard = useCallback(async (input: CreateCardInput): Promise<Card> => {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const responseData = await res.json();
        throw new Error(responseData.error || 'Failed to create card');
      }
      throw new Error(`Failed to create card: ${res.status}`);
    }

    const responseData = await res.json();
    return responseData.card;
  }, []);

  const clearResults = useCallback(() => {
    setQuery('');
    setCategory('');
  }, []);

  return {
    searchResults: data?.cards ?? [],
    isSearching: isLoading,
    searchError: error ?? null,
    search,
    createCard,
    clearResults,
  };
}
