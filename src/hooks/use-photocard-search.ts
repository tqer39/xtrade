'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PhotocardMaster } from '@/modules/photocard/types';

export type SortBy = 'name' | 'relevance';

interface UsePhotocardSearchOptions {
  sortBy?: SortBy;
}

interface UsePhotocardSearchReturn {
  searchResults: PhotocardMaster[];
  isSearching: boolean;
  searchError: Error | null;
  search: (query: string, groupName?: string) => void;
  clearResults: () => void;
}

/**
 * フォトカードマスター検索フック
 * デバウンス付きで検索を実行
 */
export function usePhotocardSearch(
  options: UsePhotocardSearchOptions = {}
): UsePhotocardSearchReturn {
  const { sortBy = 'relevance' } = options;
  const [searchResults, setSearchResults] = useState<PhotocardMaster[]>([]);
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

  const search = useCallback(
    (query: string, groupName?: string) => {
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
          const params = new URLSearchParams({ q: query, sortBy });
          if (groupName) {
            params.append('group', groupName);
          }

          const res = await fetch(`/api/photocards/search?${params.toString()}`);
          if (!res.ok) {
            throw new Error('Failed to search photocards');
          }

          const data = await res.json();
          setSearchResults(data.photocards || []);
          setSearchError(null);
        } catch (err) {
          setSearchError(err instanceof Error ? err : new Error('Unknown error'));
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    },
    [sortBy]
  );

  const clearResults = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
  }, []);

  return {
    searchResults,
    isSearching,
    searchError,
    search,
    clearResults,
  };
}
