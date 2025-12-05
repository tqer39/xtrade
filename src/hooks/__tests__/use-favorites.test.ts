import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFavorites } from '../use-favorites';

// fetch モック
global.fetch = vi.fn();

describe('useFavorites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初期データ取得', () => {
    it('お気に入りカード・ユーザー一覧を取得してステートに保存', async () => {
      const mockFavoriteCards = [
        { id: 'fav-card-1', cardId: 'card-1', card: { id: 'card-1', name: 'Card 1' } },
      ];
      const mockFavoriteUsers = [
        {
          id: 'fav-user-1',
          favoriteUserId: 'user-2',
          favoriteUser: { id: 'user-2', name: 'User 2' },
        },
      ];

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCards: mockFavoriteCards }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteUsers: mockFavoriteUsers }),
        });

      const { result } = renderHook(() => useFavorites());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.favoriteCards).toEqual(mockFavoriteCards);
      expect(result.current.favoriteUsers).toEqual(mockFavoriteUsers);
      expect(result.current.error).toBeNull();
    });

    it('取得エラー時にエラーステートを設定', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Unauthorized' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteUsers: [] }),
        });

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to fetch favorites');
    });

    it('ネットワークエラー時にエラーステートを設定', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Network error');
    });
  });

  describe('isCardFavorited / isUserFavorited', () => {
    it('カードがお気に入りかどうかを判定', async () => {
      const mockFavoriteCards = [{ id: 'fav-1', cardId: 'card-1', card: {} }];

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCards: mockFavoriteCards }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteUsers: [] }),
        });

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isCardFavorited('card-1')).toBe(true);
      expect(result.current.isCardFavorited('card-2')).toBe(false);
    });

    it('ユーザーがお気に入りかどうかを判定', async () => {
      const mockFavoriteUsers = [{ id: 'fav-1', favoriteUserId: 'user-2', favoriteUser: {} }];

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCards: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteUsers: mockFavoriteUsers }),
        });

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isUserFavorited('user-2')).toBe(true);
      expect(result.current.isUserFavorited('user-3')).toBe(false);
    });
  });

  describe('addFavoriteCard', () => {
    it('カードをお気に入りに追加して一覧を再取得', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        // 初期取得
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCards: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteUsers: [] }),
        })
        // 追加
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCard: { id: 'fav-1', cardId: 'card-1' } }),
        })
        // 再取得
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCards: [{ id: 'fav-1', cardId: 'card-1' }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteUsers: [] }),
        });

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.addFavoriteCard('card-1');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/me/favorites/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: 'card-1' }),
      });
    });

    it('追加エラー時に例外をスロー', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCards: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteUsers: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Card not found' }),
        });

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.addFavoriteCard('invalid-card');
        })
      ).rejects.toThrow('Card not found');
    });
  });

  describe('removeFavoriteCard', () => {
    it('カードをお気に入りから削除して一覧を再取得', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        // 初期取得
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCards: [{ id: 'fav-1', cardId: 'card-1' }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteUsers: [] }),
        })
        // 削除
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ deleted: true }),
        })
        // 再取得
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCards: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteUsers: [] }),
        });

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.removeFavoriteCard('card-1');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/me/favorites/cards?cardId=card-1', {
        method: 'DELETE',
      });
    });
  });

  describe('toggleFavoriteCard', () => {
    it('お気に入りでない場合は追加', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        // 初期取得
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCards: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteUsers: [] }),
        })
        // 追加
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCard: { id: 'fav-1', cardId: 'card-1' } }),
        })
        // 再取得
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCards: [{ id: 'fav-1', cardId: 'card-1' }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteUsers: [] }),
        });

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.toggleFavoriteCard('card-1');
      });

      // POST が呼ばれることを確認（追加）
      expect(global.fetch).toHaveBeenCalledWith('/api/me/favorites/cards', expect.any(Object));
    });

    it('お気に入りの場合は削除', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        // 初期取得
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCards: [{ id: 'fav-1', cardId: 'card-1' }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteUsers: [] }),
        })
        // 削除
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ deleted: true }),
        })
        // 再取得
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCards: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteUsers: [] }),
        });

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.toggleFavoriteCard('card-1');
      });

      // DELETE が呼ばれることを確認（削除）
      expect(global.fetch).toHaveBeenCalledWith('/api/me/favorites/cards?cardId=card-1', {
        method: 'DELETE',
      });
    });
  });

  describe('addFavoriteUser', () => {
    it('ユーザーをお気に入りに追加して一覧を再取得', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        // 初期取得
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCards: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteUsers: [] }),
        })
        // 追加
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteUser: { id: 'fav-1', favoriteUserId: 'user-2' } }),
        })
        // 再取得
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCards: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ favoriteUsers: [{ id: 'fav-1', favoriteUserId: 'user-2' }] }),
        });

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.addFavoriteUser('user-2');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/me/favorites/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user-2' }),
      });
    });
  });

  describe('removeFavoriteUser', () => {
    it('ユーザーをお気に入りから削除して一覧を再取得', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        // 初期取得
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCards: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ favoriteUsers: [{ id: 'fav-1', favoriteUserId: 'user-2' }] }),
        })
        // 削除
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ deleted: true }),
        })
        // 再取得
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCards: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteUsers: [] }),
        });

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.removeFavoriteUser('user-2');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/me/favorites/users?userId=user-2', {
        method: 'DELETE',
      });
    });
  });

  describe('toggleFavoriteUser', () => {
    it('お気に入りでない場合は追加', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        // 初期取得
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCards: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteUsers: [] }),
        })
        // 追加
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteUser: { id: 'fav-1', favoriteUserId: 'user-2' } }),
        })
        // 再取得
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCards: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ favoriteUsers: [{ id: 'fav-1', favoriteUserId: 'user-2' }] }),
        });

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.toggleFavoriteUser('user-2');
      });

      // POST が呼ばれることを確認（追加）
      expect(global.fetch).toHaveBeenCalledWith('/api/me/favorites/users', expect.any(Object));
    });
  });

  describe('checkFavorites', () => {
    it('複数のカード/ユーザーのお気に入り状態を一括確認', async () => {
      const mockCheckResult = {
        cards: { 'card-1': true, 'card-2': false },
        users: { 'user-2': true },
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        // 初期取得
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCards: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteUsers: [] }),
        })
        // checkFavorites
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCheckResult),
        });

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let checkResult: { cards: Record<string, boolean>; users: Record<string, boolean> };
      await act(async () => {
        checkResult = await result.current.checkFavorites(['card-1', 'card-2'], ['user-2']);
      });

      expect(checkResult!).toEqual(mockCheckResult);
      expect(global.fetch).toHaveBeenCalledWith('/api/me/favorites/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardIds: ['card-1', 'card-2'], userIds: ['user-2'] }),
      });
    });
  });

  describe('refetch', () => {
    it('手動で一覧を再取得', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        // 初期取得
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCards: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteUsers: [] }),
        })
        // 再取得
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteCards: [{ id: 'fav-1', cardId: 'card-1' }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ favoriteUsers: [] }),
        });

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.favoriteCards).toEqual([]);

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.favoriteCards).toEqual([{ id: 'fav-1', cardId: 'card-1' }]);
      });
    });
  });
});
