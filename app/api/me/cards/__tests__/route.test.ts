import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetSession = vi.fn();
const mockGetUserHaveCards = vi.fn();
const mockGetUserWantCards = vi.fn();

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

vi.mock('@/modules/cards', () => ({
  getUserHaveCards: (...args: unknown[]) => mockGetUserHaveCards(...args),
  getUserWantCards: (...args: unknown[]) => mockGetUserWantCards(...args),
}));

describe('GET /api/me/cards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
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

  it('認証済みの場合はカード一覧を返す', async () => {
    const mockHaveCards = [
      { id: '1', name: 'Have Card 1' },
      { id: '2', name: 'Have Card 2' },
    ];
    const mockWantCards = [{ id: '3', name: 'Want Card 1' }];

    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockGetUserHaveCards.mockResolvedValue(mockHaveCards);
    mockGetUserWantCards.mockResolvedValue(mockWantCards);

    const { GET } = await import('../route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.haveCards).toEqual(mockHaveCards);
    expect(json.wantCards).toEqual(mockWantCards);
    expect(mockGetUserHaveCards).toHaveBeenCalledWith('user-1');
    expect(mockGetUserWantCards).toHaveBeenCalledWith('user-1');
  });

  it('カードが空の場合も正常に返す', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockGetUserHaveCards.mockResolvedValue([]);
    mockGetUserWantCards.mockResolvedValue([]);

    const { GET } = await import('../route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.haveCards).toEqual([]);
    expect(json.wantCards).toEqual([]);
  });
});
