import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MyTrade } from '../use-my-trades';

// SWR をモック
vi.mock('swr', () => ({
  default: vi.fn(),
}));

// fetch をモック
global.fetch = vi.fn();

describe('useMyTrades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('取引一覧を取得', async () => {
    const mockTrades: MyTrade[] = [
      {
        id: 'trade-1',
        roomSlug: 'room-1',
        status: 'proposed',
        partner: { id: 'user-2', name: 'Partner', image: null, trustGrade: 'A' },
        myItemCount: 2,
        theirItemCount: 1,
        isInitiator: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      },
      {
        id: 'trade-2',
        roomSlug: 'room-2',
        status: 'completed',
        partner: { id: 'user-3', name: 'Other', image: null, trustGrade: 'B' },
        myItemCount: 1,
        theirItemCount: 2,
        isInitiator: false,
        createdAt: '2024-01-03',
        updatedAt: '2024-01-04',
      },
    ];

    const mockUseSWR = (await import('swr')).default as ReturnType<typeof vi.fn>;
    mockUseSWR.mockReturnValue({
      data: { trades: mockTrades },
      error: null,
      isLoading: false,
      mutate: vi.fn(),
    });

    const { useMyTrades } = await import('../use-my-trades');
    const { result } = renderHook(() => useMyTrades());

    expect(result.current.trades).toHaveLength(2);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('activeTrades は draft/proposed/agreed のみ', async () => {
    const mockTrades: MyTrade[] = [
      {
        id: 'trade-1',
        roomSlug: 'room-1',
        status: 'draft',
        partner: null,
        myItemCount: 0,
        theirItemCount: 0,
        isInitiator: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: 'trade-2',
        roomSlug: 'room-2',
        status: 'proposed',
        partner: null,
        myItemCount: 1,
        theirItemCount: 1,
        isInitiator: true,
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02',
      },
      {
        id: 'trade-3',
        roomSlug: 'room-3',
        status: 'agreed',
        partner: null,
        myItemCount: 1,
        theirItemCount: 1,
        isInitiator: true,
        createdAt: '2024-01-03',
        updatedAt: '2024-01-03',
      },
      {
        id: 'trade-4',
        roomSlug: 'room-4',
        status: 'completed',
        partner: null,
        myItemCount: 1,
        theirItemCount: 1,
        isInitiator: true,
        createdAt: '2024-01-04',
        updatedAt: '2024-01-04',
      },
    ];

    const mockUseSWR = (await import('swr')).default as ReturnType<typeof vi.fn>;
    mockUseSWR.mockReturnValue({
      data: { trades: mockTrades },
      error: null,
      isLoading: false,
      mutate: vi.fn(),
    });

    const { useMyTrades } = await import('../use-my-trades');
    const { result } = renderHook(() => useMyTrades());

    expect(result.current.activeTrades).toHaveLength(3);
    expect(result.current.activeTrades.map((t) => t.status)).toEqual([
      'draft',
      'proposed',
      'agreed',
    ]);
  });

  it('completedTrades は completed/canceled/disputed/expired のみ', async () => {
    const mockTrades: MyTrade[] = [
      {
        id: 'trade-1',
        roomSlug: 'room-1',
        status: 'completed',
        partner: null,
        myItemCount: 1,
        theirItemCount: 1,
        isInitiator: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: 'trade-2',
        roomSlug: 'room-2',
        status: 'canceled',
        partner: null,
        myItemCount: 1,
        theirItemCount: 1,
        isInitiator: true,
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02',
      },
      {
        id: 'trade-3',
        roomSlug: 'room-3',
        status: 'disputed',
        partner: null,
        myItemCount: 1,
        theirItemCount: 1,
        isInitiator: true,
        createdAt: '2024-01-03',
        updatedAt: '2024-01-03',
      },
      {
        id: 'trade-4',
        roomSlug: 'room-4',
        status: 'expired',
        partner: null,
        myItemCount: 1,
        theirItemCount: 1,
        isInitiator: true,
        createdAt: '2024-01-04',
        updatedAt: '2024-01-04',
      },
      {
        id: 'trade-5',
        roomSlug: 'room-5',
        status: 'proposed',
        partner: null,
        myItemCount: 1,
        theirItemCount: 1,
        isInitiator: true,
        createdAt: '2024-01-05',
        updatedAt: '2024-01-05',
      },
    ];

    const mockUseSWR = (await import('swr')).default as ReturnType<typeof vi.fn>;
    mockUseSWR.mockReturnValue({
      data: { trades: mockTrades },
      error: null,
      isLoading: false,
      mutate: vi.fn(),
    });

    const { useMyTrades } = await import('../use-my-trades');
    const { result } = renderHook(() => useMyTrades());

    expect(result.current.completedTrades).toHaveLength(4);
    expect(result.current.completedTrades.map((t) => t.status)).toEqual([
      'completed',
      'canceled',
      'disputed',
      'expired',
    ]);
  });

  it('ローディング状態を正しく返す', async () => {
    const mockUseSWR = (await import('swr')).default as ReturnType<typeof vi.fn>;
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
      mutate: vi.fn(),
    });

    const { useMyTrades } = await import('../use-my-trades');
    const { result } = renderHook(() => useMyTrades());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.trades).toEqual([]);
  });

  it('エラー状態を正しく返す', async () => {
    const mockError = new Error('取引一覧の取得に失敗しました');
    const mockUseSWR = (await import('swr')).default as ReturnType<typeof vi.fn>;
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
      mutate: vi.fn(),
    });

    const { useMyTrades } = await import('../use-my-trades');
    const { result } = renderHook(() => useMyTrades());

    expect(result.current.error).toBe(mockError);
    expect(result.current.trades).toEqual([]);
  });

  it('refetch で mutate を呼び出す', async () => {
    const mockMutate = vi.fn();
    const mockUseSWR = (await import('swr')).default as ReturnType<typeof vi.fn>;
    mockUseSWR.mockReturnValue({
      data: { trades: [] },
      error: null,
      isLoading: false,
      mutate: mockMutate,
    });

    const { useMyTrades } = await import('../use-my-trades');
    const { result } = renderHook(() => useMyTrades());

    result.current.refetch();

    expect(mockMutate).toHaveBeenCalled();
  });

  it('データがない場合は空配列', async () => {
    const mockUseSWR = (await import('swr')).default as ReturnType<typeof vi.fn>;
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
      mutate: vi.fn(),
    });

    const { useMyTrades } = await import('../use-my-trades');
    const { result } = renderHook(() => useMyTrades());

    expect(result.current.trades).toEqual([]);
    expect(result.current.activeTrades).toEqual([]);
    expect(result.current.completedTrades).toEqual([]);
  });
});
