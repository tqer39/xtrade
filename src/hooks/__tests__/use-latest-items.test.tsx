import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
// biome-ignore lint/style/useImportType: SWRConfig is used as a component
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLatestItems } from '../use-latest-items';

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

describe('useLatestItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('正常系', () => {
    it('最新カード一覧を取得してステートに保存', async () => {
      const mockCards = [
        { id: 'card-1', name: 'Card 1', category: 'pokemon' },
        { id: 'card-2', name: 'Card 2', category: 'onepiece' },
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ cards: mockCards }),
      });

      const { result } = renderHook(() => useLatestItems(), { wrapper: createWrapper() });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.latestItems).toEqual(mockCards);
      expect(result.current.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith('/api/items/latest?limit=12&page=1');
    });

    it('limit パラメーターを指定できる', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ cards: [] }),
      });

      renderHook(() => useLatestItems({ limit: 50 }), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/items/latest?limit=50&page=1');
      });
    });

    it('空のカード一覧でも正常に処理', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ cards: [] }),
      });

      const { result } = renderHook(() => useLatestItems(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.latestItems).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('cards が undefined でも空配列として処理', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const { result } = renderHook(() => useLatestItems(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.latestItems).toEqual([]);
    });
  });

  describe('エラー系', () => {
    it('取得エラー時にエラーステートを設定', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useLatestItems(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to fetch latest items');
    });

    it('ネットワークエラー時にエラーステートを設定', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useLatestItems(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Network error');
    });
  });

  describe('refetch', () => {
    it('手動で再取得できる', async () => {
      const mockCards1: never[] = [];
      const mockCards2 = [{ id: 'card-1', name: 'New Card' }];

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ cards: mockCards1 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ cards: mockCards2 }),
        });

      const { result } = renderHook(() => useLatestItems(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.latestItems).toEqual([]);

      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.latestItems).toHaveLength(1);
      });

      expect(result.current.latestItems[0].name).toBe('New Card');
    });
  });
});
