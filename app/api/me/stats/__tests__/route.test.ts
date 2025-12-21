import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetSession = vi.fn();
const mockGetUserStats = vi.fn();

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: () => mockGetSession(),
    },
  },
}));

vi.mock('@/modules/stats', () => ({
  getUserStats: () => mockGetUserStats(),
}));

describe('GET /api/me/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未認証の場合は 401 を返す', async () => {
    mockGetSession.mockResolvedValue(null);

    const { GET } = await import('../route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('セッションはあるがユーザーがnullの場合は 401 を返す', async () => {
    mockGetSession.mockResolvedValue({ user: null });

    const { GET } = await import('../route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('認証済みユーザーの統計情報を返す', async () => {
    const mockStats = {
      totalTrades: 10,
      completedTrades: 8,
      canceledTrades: 1,
      disputedTrades: 1,
      tradeSuccessRate: 0.8,
      avgRating: 4.5,
      reviewCount: 5,
      positiveCount: 4,
      negativeCount: 0,
    };

    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });
    mockGetUserStats.mockResolvedValue(mockStats);

    const { GET } = await import('../route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(mockStats);
  });

  it('統計情報が空の場合も正常に返す', async () => {
    const emptyStats = {
      totalTrades: 0,
      completedTrades: 0,
      canceledTrades: 0,
      disputedTrades: 0,
      tradeSuccessRate: 0,
      avgRating: null,
      reviewCount: 0,
      positiveCount: 0,
      negativeCount: 0,
    };

    mockGetSession.mockResolvedValue({
      user: { id: 'user-new' },
    });
    mockGetUserStats.mockResolvedValue(emptyStats);

    const { GET } = await import('../route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.totalTrades).toBe(0);
  });
});
