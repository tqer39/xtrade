import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePhotocardSearch } from '../use-photocard-search';

// fetch モック
global.fetch = vi.fn();

describe('usePhotocardSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search', () => {
    it('空のクエリで検索結果をクリア', async () => {
      const { result } = renderHook(() => usePhotocardSearch());

      act(() => {
        result.current.search('');
      });

      expect(result.current.searchResults).toEqual([]);
      expect(result.current.isSearching).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('スペースのみのクエリで検索結果をクリア', async () => {
      const { result } = renderHook(() => usePhotocardSearch());

      act(() => {
        result.current.search('   ');
      });

      expect(result.current.searchResults).toEqual([]);
      expect(result.current.isSearching).toBe(false);
    });

    it('検索開始時に isSearching が true になる', () => {
      const { result } = renderHook(() => usePhotocardSearch());

      act(() => {
        result.current.search('木村');
      });

      expect(result.current.isSearching).toBe(true);
    });
  });

  describe('clearResults', () => {
    it('検索結果とエラーをクリア', async () => {
      const { result } = renderHook(() => usePhotocardSearch());

      // 初期状態を確認
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.searchError).toBeNull();

      act(() => {
        result.current.clearResults();
      });

      expect(result.current.searchResults).toEqual([]);
      expect(result.current.searchError).toBeNull();
    });
  });

  describe('初期状態', () => {
    it('初期値が正しく設定されている', () => {
      const { result } = renderHook(() => usePhotocardSearch());

      expect(result.current.searchResults).toEqual([]);
      expect(result.current.isSearching).toBe(false);
      expect(result.current.searchError).toBeNull();
      expect(typeof result.current.search).toBe('function');
      expect(typeof result.current.clearResults).toBe('function');
    });
  });
});
