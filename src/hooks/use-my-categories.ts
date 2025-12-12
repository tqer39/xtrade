'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';

interface UseMyCategories {
  categories: string[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useMyCategories(): UseMyCategories {
  const { data: session, isPending: isSessionPending } = useSession();
  const isLoggedIn = !!session?.user;

  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!isLoggedIn) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/me/categories');
      if (!res.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isSessionPending) {
      fetchCategories();
    }
  }, [fetchCategories, isSessionPending]);

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
  };
}
