import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetSession = vi.fn();
const mockDbSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();

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

vi.mock('@/db/drizzle', () => ({
  db: {
    select: () => ({
      from: mockFrom,
    }),
  },
}));

vi.mock('@/db/schema', () => ({
  trade: {
    id: 'trade.id',
    roomSlug: 'trade.roomSlug',
    status: 'trade.status',
    initiatorUserId: 'trade.initiatorUserId',
    responderUserId: 'trade.responderUserId',
    createdAt: 'trade.createdAt',
    updatedAt: 'trade.updatedAt',
  },
  user: {
    id: 'user.id',
    name: 'user.name',
    image: 'user.image',
    trustGrade: 'user.trustGrade',
  },
  tradeItem: {
    tradeId: 'tradeItem.tradeId',
    offeredByUserId: 'tradeItem.offeredByUserId',
  },
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args) => ({ type: 'and', args })),
  or: vi.fn((...args) => ({ type: 'or', args })),
  eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
  desc: vi.fn((col) => ({ type: 'desc', col })),
  inArray: vi.fn((col, vals) => ({ type: 'inArray', col, vals })),
}));

// NextRequest のモックを作成するヘルパー
function createMockNextRequest(url: string) {
  const urlObj = new URL(url);
  return {
    nextUrl: urlObj,
    url,
  } as any;
}

describe('GET /api/me/trades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('未認証の場合は 401 を返す', async () => {
    mockGetSession.mockResolvedValue(null);

    const { GET } = await import('../route');
    const request = createMockNextRequest('http://localhost/api/me/trades');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('セッションはあるがユーザーがnullの場合は 401 を返す', async () => {
    mockGetSession.mockResolvedValue({ user: null });

    const { GET } = await import('../route');
    const request = createMockNextRequest('http://localhost/api/me/trades');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('認証済みユーザーの取引一覧を返す（空の場合）', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    // 取引クエリ（空）
    mockFrom.mockReturnValue({
      where: mockWhere.mockReturnValue({
        orderBy: mockOrderBy.mockReturnValue({
          limit: mockLimit.mockResolvedValue([]),
        }),
      }),
    });

    const { GET } = await import('../route');
    const request = createMockNextRequest('http://localhost/api/me/trades');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.trades).toEqual([]);
  });

  it('認証済みユーザーの取引一覧を返す（取引あり）', async () => {
    const now = new Date();
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    // 取引クエリ
    mockFrom
      .mockReturnValueOnce({
        where: mockWhere.mockReturnValue({
          orderBy: mockOrderBy.mockReturnValue({
            limit: mockLimit.mockResolvedValue([
              {
                id: 'trade-1',
                roomSlug: 'room-abc',
                status: 'proposed',
                initiatorUserId: 'user-1',
                responderUserId: 'user-2',
                createdAt: now,
                updatedAt: now,
              },
            ]),
          }),
        }),
      })
      // ユーザークエリ
      .mockReturnValueOnce({
        where: vi.fn().mockResolvedValue([
          { id: 'user-1', name: 'User 1', image: null, trustGrade: 'A' },
          { id: 'user-2', name: 'User 2', image: null, trustGrade: 'B' },
        ]),
      })
      // アイテムクエリ
      .mockReturnValueOnce({
        where: vi.fn().mockResolvedValue([
          { tradeId: 'trade-1', offeredByUserId: 'user-1' },
          { tradeId: 'trade-1', offeredByUserId: 'user-2' },
        ]),
      });

    const { GET } = await import('../route');
    const request = createMockNextRequest('http://localhost/api/me/trades');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.trades).toHaveLength(1);
    expect(json.trades[0].id).toBe('trade-1');
    expect(json.trades[0].status).toBe('proposed');
    expect(json.trades[0].isInitiator).toBe(true);
  });

  it('status=active でフィルタリングできる', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    mockFrom.mockReturnValue({
      where: mockWhere.mockReturnValue({
        orderBy: mockOrderBy.mockReturnValue({
          limit: mockLimit.mockResolvedValue([]),
        }),
      }),
    });

    const { GET } = await import('../route');
    const request = createMockNextRequest('http://localhost/api/me/trades?status=active');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockWhere).toHaveBeenCalled();
  });

  it('status=completed でフィルタリングできる', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
    });

    mockFrom.mockReturnValue({
      where: mockWhere.mockReturnValue({
        orderBy: mockOrderBy.mockReturnValue({
          limit: mockLimit.mockResolvedValue([]),
        }),
      }),
    });

    const { GET } = await import('../route');
    const request = createMockNextRequest('http://localhost/api/me/trades?status=completed');
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockWhere).toHaveBeenCalled();
  });
});
