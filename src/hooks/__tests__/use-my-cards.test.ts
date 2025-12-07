import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMyCards } from '../use-my-cards';

// fetch モック
global.fetch = vi.fn();

// useSession モック
const mockUseSession = vi.fn();
vi.mock('@/lib/auth-client', () => ({
  useSession: () => mockUseSession(),
}));

describe('useMyCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // デフォルトでログイン状態を返す
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', name: 'Test User' } },
      isPending: false,
    });
  });

  describe('初期データ取得', () => {
    it('カード一覧を取得してステートに保存', async () => {
      const mockHaveCards = [
        { id: 'have-1', cardId: 'card-1', quantity: 2, card: { id: 'card-1', name: 'Card 1' } },
      ];
      const mockWantCards = [
        { id: 'want-1', cardId: 'card-2', priority: 1, card: { id: 'card-2', name: 'Card 2' } },
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ haveCards: mockHaveCards, wantCards: mockWantCards }),
      });

      const { result } = renderHook(() => useMyCards());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.haveCards).toEqual(mockHaveCards);
      expect(result.current.wantCards).toEqual(mockWantCards);
      expect(result.current.error).toBeNull();
    });

    it('取得エラー時にエラーステートを設定', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      const { result } = renderHook(() => useMyCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to fetch cards');
    });

    it('ネットワークエラー時にエラーステートを設定', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useMyCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Network error');
    });
  });

  describe('addHaveCard', () => {
    it('持っているカードを追加して一覧を再取得', async () => {
      const mockCards = { haveCards: [], wantCards: [] };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCards),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ haveCard: { id: 'new-have' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              haveCards: [{ id: 'new-have', cardId: 'card-1', quantity: 1 }],
              wantCards: [],
            }),
        });

      const { result } = renderHook(() => useMyCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.addHaveCard('card-1', 1);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/me/cards/have', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: 'card-1', quantity: 1 }),
      });
    });

    it('追加エラー時に例外をスロー', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ haveCards: [], wantCards: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Card not found' }),
        });

      const { result } = renderHook(() => useMyCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.addHaveCard('invalid-card');
        })
      ).rejects.toThrow('Card not found');
    });
  });

  describe('addWantCard', () => {
    it('欲しいカードを追加して一覧を再取得', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ haveCards: [], wantCards: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ wantCard: { id: 'new-want' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              haveCards: [],
              wantCards: [{ id: 'new-want', cardId: 'card-2', priority: 5 }],
            }),
        });

      const { result } = renderHook(() => useMyCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.addWantCard('card-2', 5);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/me/cards/want', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: 'card-2', priority: 5 }),
      });
    });
  });

  describe('refetch', () => {
    it('手動で一覧を再取得', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ haveCards: [], wantCards: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              haveCards: [{ id: 'have-1' }],
              wantCards: [],
            }),
        });

      const { result } = renderHook(() => useMyCards());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.haveCards).toEqual([]);

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.haveCards).toEqual([{ id: 'have-1' }]);
      });
    });
  });
});
