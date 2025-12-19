'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export type ViewMode = 'grid' | 'list';

const STORAGE_KEY = 'card-view-mode';
const DEFAULT_VIEW: ViewMode = 'grid';

interface UseViewPreferenceReturn {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  isHydrated: boolean;
}

export function useViewPreference(): UseViewPreferenceReturn {
  const [viewMode, setViewModeState] = useState<ViewMode>(DEFAULT_VIEW);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // クライアントサイドでのみURLパラメータとlocalStorageから読み込み
  useEffect(() => {
    // URLパラメータを優先
    const urlView = searchParams.get('view');
    if (urlView === 'list' || urlView === 'grid') {
      setViewModeState(urlView);
      localStorage.setItem(STORAGE_KEY, urlView);
    } else {
      // URLパラメータがない場合はlocalStorageから
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'list' || saved === 'grid') {
        setViewModeState(saved);
      }
    }
    setIsHydrated(true);
  }, [searchParams]);

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      setViewModeState(mode);
      localStorage.setItem(STORAGE_KEY, mode);

      // URLパラメータを更新
      const params = new URLSearchParams(searchParams.toString());
      params.set('view', mode);
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const toggleViewMode = useCallback(() => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
  }, [viewMode, setViewMode]);

  return {
    viewMode,
    setViewMode,
    toggleViewMode,
    isHydrated,
  };
}
