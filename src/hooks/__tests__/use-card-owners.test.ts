import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCardOwners } from '../use-card-owners';

// fetch モック
global.fetch = vi.fn();

describe('useCardOwners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cardId が null の場合', () => {
    it('カードと所有者は空で isLoading は false', async () => {
      const { result } = renderHook(() => useCardOwners(null));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.card).toBeNull();
      expect(result.current.owners).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('正常系', () => {
    it('カードと所有者一覧を取得してステートに保存', async () => {
      const mockCard = { id: 'card-1', name: 'Test Card', category: 'pokemon' };
      const mockOwners = [
        { userId: 'user-1', name: 'User 1', quantity: 2, trustGrade: 'A', trustScore: 80 },
        { userId: 'user-2', name: 'User 2', quantity: 1, trustGrade: 'B', trustScore: 60 },
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ card: mockCard, owners: mockOwners }),
      });

      const { result } = renderHook(() => useCardOwners('card-1'));

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.card).toEqual(mockCard);
      expect(result.current.owners).toEqual(mockOwners);
      expect(result.current.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith('/api/cards/card-1/owners');
    });

    it('空の所有者一覧でも正常に処理', async () => {
      const mockCard = { id: 'card-1', name: 'Test Card', category: 'pokemon' };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ card: mockCard, owners: [] }),
      });

      const { result } = renderHook(() => useCardOwners('card-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.card).toEqual(mockCard);
      expect(result.current.owners).toEqual([]);
    });
  });

  describe('エラー系', () => {
    it('404 エラー時に「Card not found」エラーを設定', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      });

      const { result } = renderHook(() => useCardOwners('invalid-card'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Card not found');
      expect(result.current.card).toBeNull();
      expect(result.current.owners).toEqual([]);
    });

    it('その他のエラー時にエラーステートを設定', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useCardOwners('card-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to fetch card owners');
    });

    it('ネットワークエラー時にエラーステートを設定', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useCardOwners('card-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Network error');
    });
  });

  describe('refetch', () => {
    it('手動で再取得できる', async () => {
      const mockCard = { id: 'card-1', name: 'Test Card', category: 'pokemon' };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ card: mockCard, owners: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              card: mockCard,
              owners: [{ userId: 'user-1', name: 'User 1', quantity: 1 }],
            }),
        });

      const { result } = renderHook(() => useCardOwners('card-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.owners).toEqual([]);

      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.owners).toHaveLength(1);
      });
    });
  });
});
