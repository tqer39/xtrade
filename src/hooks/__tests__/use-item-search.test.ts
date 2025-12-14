import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useItemSearch } from '../use-item-search';

// fetch モック
global.fetch = vi.fn();

describe('useItemSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search', () => {
    it('空のクエリで検索結果をクリア', async () => {
      const { result } = renderHook(() => useItemSearch());

      act(() => {
        result.current.search('');
      });

      expect(result.current.searchResults).toEqual([]);
      expect(result.current.isSearching).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('検索を実行してスペース付きクエリをトリム', async () => {
      const { result } = renderHook(() => useItemSearch());

      act(() => {
        result.current.search('   ');
      });

      expect(result.current.searchResults).toEqual([]);
      expect(result.current.isSearching).toBe(false);
    });
  });

  describe('createCard', () => {
    it('新規カードを作成', async () => {
      vi.useRealTimers();

      const newCard = { id: 'new-card', name: 'New Card', category: 'pokemon' };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ card: newCard }),
      });

      const { result } = renderHook(() => useItemSearch());

      let createdCard: typeof newCard | undefined;
      await act(async () => {
        createdCard = await result.current.createCard({
          name: 'New Card',
          category: 'pokemon',
        });
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Card', category: 'pokemon' }),
      });
      expect(createdCard).toEqual(newCard);
    });

    it('作成エラー時に例外をスロー', async () => {
      vi.useRealTimers();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Validation error' }),
      });

      const { result } = renderHook(() => useItemSearch());

      await expect(
        act(async () => {
          await result.current.createCard({
            name: '',
            category: 'pokemon',
          });
        })
      ).rejects.toThrow('Validation error');
    });
  });

  describe('clearResults', () => {
    it('検索結果とエラーをクリア', async () => {
      const { result } = renderHook(() => useItemSearch());

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
});
