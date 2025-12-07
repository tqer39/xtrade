'use client';

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

  // クライアントサイドでのみ localStorage から読み込み
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'list' || saved === 'grid') {
      setViewModeState(saved);
    }
    setIsHydrated(true);
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

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
