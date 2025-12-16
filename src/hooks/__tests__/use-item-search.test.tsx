import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
// biome-ignore lint/style/useImportType: SWRConfig is used as a component
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useItemSearch } from '../use-item-search';

// fetch モック
global.fetch = vi.fn();

// SWR キャッシュを各テストでリセットするラッパー生成
function createWrapper() {
  const cache = new Map();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SWRConfig
        value={{
          provider: () => cache,
          dedupingInterval: 0,
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }}
      >
        {children}
      </SWRConfig>
    );
  };
}

describe('useItemSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search', () => {
    it('空のクエリで検索結果をクリア', () => {
      const { result } = renderHook(() => useItemSearch(), { wrapper: createWrapper() });

      act(() => {
        result.current.search('');
      });

      expect(result.current.searchResults).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('検索を実行してスペース付きクエリをトリム', () => {
      const { result } = renderHook(() => useItemSearch(), { wrapper: createWrapper() });

      act(() => {
        result.current.search('   ');
      });

      expect(result.current.searchResults).toEqual([]);
    });

    it('有効なクエリでAPI検索を実行', async () => {
      const mockCards = [
        { id: 'card-1', name: 'Pokemon Card', category: 'pokemon' },
        { id: 'card-2', name: 'Pokemon Card 2', category: 'pokemon' },
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ cards: mockCards }),
      });

      const { result } = renderHook(() => useItemSearch(), { wrapper: createWrapper() });

      act(() => {
        result.current.search('pokemon');
      });

      await waitFor(
        () => {
          expect(result.current.searchResults).toEqual(mockCards);
        },
        { timeout: 1000 }
      );

      expect(global.fetch).toHaveBeenCalledWith('/api/cards?q=pokemon');
    });

    it('カテゴリ付きで検索を実行', async () => {
      const mockCards = [{ id: 'card-1', name: 'Yugioh Card', category: 'yugioh' }];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ cards: mockCards }),
      });

      const { result } = renderHook(() => useItemSearch(), { wrapper: createWrapper() });

      act(() => {
        result.current.search('dragon', 'yugioh');
      });

      await waitFor(
        () => {
          expect(result.current.searchResults).toEqual(mockCards);
        },
        { timeout: 1000 }
      );

      expect(global.fetch).toHaveBeenCalledWith('/api/cards?q=dragon&category=yugioh');
    });

    it('API エラー時にエラーステートを設定', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useItemSearch(), { wrapper: createWrapper() });

      act(() => {
        result.current.search('error-query');
      });

      await waitFor(
        () => {
          expect(result.current.searchError).not.toBeNull();
        },
        { timeout: 1000 }
      );

      expect(result.current.searchError?.message).toBe('Failed to search cards');
    });
  });

  describe('createCard', () => {
    it('新規カードを作成', async () => {
      const newCard = { id: 'new-card', name: 'New Card', category: 'pokemon' };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ card: newCard }),
      });

      const { result } = renderHook(() => useItemSearch(), { wrapper: createWrapper() });

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
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Validation error' }),
      });

      const { result } = renderHook(() => useItemSearch(), { wrapper: createWrapper() });

      await expect(
        act(async () => {
          await result.current.createCard({
            name: '',
            category: 'pokemon',
          });
        })
      ).rejects.toThrow('Validation error');
    });

    it('エラーメッセージがない場合はデフォルトメッセージ', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      const { result } = renderHook(() => useItemSearch(), { wrapper: createWrapper() });

      await expect(
        act(async () => {
          await result.current.createCard({ name: 'test' });
        })
      ).rejects.toThrow('Failed to create card');
    });
  });

  describe('clearResults', () => {
    it('検索結果とクエリをクリア', () => {
      const { result } = renderHook(() => useItemSearch(), { wrapper: createWrapper() });

      // 初期状態を確認
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.searchError).toBeNull();

      act(() => {
        result.current.clearResults();
      });

      expect(result.current.searchResults).toEqual([]);
    });
  });
});
