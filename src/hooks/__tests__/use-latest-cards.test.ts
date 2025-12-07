import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLatestCards } from '../use-latest-cards';

// fetch モック
global.fetch = vi.fn();

describe('useLatestCards', () => {
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

      const { result } = renderHook(() => useLatestCards());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.latestCards).toEqual(mockCards);
      expect(result.current.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith('/api/cards/latest?limit=20');
    });

    it('limit パラメーターを指定できる', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ cards: [] }),
      });

      renderHook(() => useLatestCards(50));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/cards/latest?limit=50');
      });
    });

    it('空のカード一覧でも正常に処理', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ cards: [] }),
      });

      const { result } = renderHook(() => useLatestCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.latestCards).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('cards が undefined でも空配列として処理', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const { result } = renderHook(() => useLatestCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.latestCards).toEqual([]);
    });
  });

  describe('エラー系', () => {
    it('取得エラー時にエラーステートを設定', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useLatestCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to fetch latest cards');
      expect(result.current.latestCards).toEqual([]);
    });

    it('ネットワークエラー時にエラーステートを設定', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useLatestCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Network error');
      expect(result.current.latestCards).toEqual([]);
    });
  });

  describe('refetch', () => {
    it('手動で再取得できる', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ cards: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              cards: [{ id: 'card-1', name: 'New Card' }],
            }),
        });

      const { result } = renderHook(() => useLatestCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.latestCards).toEqual([]);

      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.latestCards).toHaveLength(1);
      });

      expect(result.current.latestCards[0].name).toBe('New Card');
    });
  });
});
