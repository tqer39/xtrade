import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// fetch をモック
global.fetch = vi.fn();

// useSession をモック
const mockUseSession = vi.fn();
vi.mock('@/lib/auth-client', () => ({
  useSession: () => mockUseSession(),
}));

describe('useMyCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', name: 'Test User' } },
      isPending: false,
    });
  });

  it('ログイン時にカテゴリを取得', async () => {
    const mockCategories = ['INI', 'JO1', 'BE:FIRST'];
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ categories: mockCategories }),
    });

    const { useMyCategories } = await import('../use-my-categories');
    const { result } = renderHook(() => useMyCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toEqual(mockCategories);
    expect(result.current.error).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith('/api/me/categories');
  });

  it('未ログイン時は取得しない', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
    });

    const { useMyCategories } = await import('../use-my-categories');
    const { result } = renderHook(() => useMyCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.categories).toEqual([]);
  });

  it('ローディング状態', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({ categories: [] }),
              }),
            100
          )
        )
    );

    const { useMyCategories } = await import('../use-my-categories');
    const { result } = renderHook(() => useMyCategories());

    // 最初はローディング中
    expect(result.current.isLoading).toBe(true);
  });

  it('エラー状態', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
    });

    const { useMyCategories } = await import('../use-my-categories');
    const { result } = renderHook(() => useMyCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to fetch categories');
  });

  it('refetch で再取得', async () => {
    const mockCategories1 = ['IVE'];
    const mockCategories2 = ['IVE', 'NewJeans'];

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ categories: mockCategories1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ categories: mockCategories2 }),
      });

    const { useMyCategories } = await import('../use-my-categories');
    const { result } = renderHook(() => useMyCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toEqual(mockCategories1);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.categories).toEqual(mockCategories2);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('セッション読み込み中は待機', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
    });

    const { useMyCategories } = await import('../use-my-categories');
    const { result } = renderHook(() => useMyCategories());

    // セッション読み込み中は fetch しない
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(true);
  });

  it('ネットワークエラー', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const { useMyCategories } = await import('../use-my-categories');
    const { result } = renderHook(() => useMyCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
  });

  it('categories が undefined の場合は空配列', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const { useMyCategories } = await import('../use-my-categories');
    const { result } = renderHook(() => useMyCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toEqual([]);
  });
});
