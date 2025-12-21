import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetSession = vi.fn();
const mockFindMatches = vi.fn();

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

vi.mock('@/modules/matches', () => ({
  findMatches: (...args: unknown[]) => mockFindMatches(...args),
}));

describe('GET /api/matches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('未認証の場合は 401 を返す', async () => {
    mockGetSession.mockResolvedValue(null);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/matches');
    const response = await GET(request as any);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('セッションはあるがユーザーがnullの場合は 401 を返す', async () => {
    mockGetSession.mockResolvedValue({ user: null });

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/matches');
    const response = await GET(request as any);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('認証済みの場合はマッチング結果を返す', async () => {
    const mockResult = {
      matches: [{ userId: 'user-2', matchScore: 5 }],
      total: 1,
    };
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindMatches.mockResolvedValue(mockResult);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/matches');
    const response = await GET(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(mockResult);
    expect(mockFindMatches).toHaveBeenCalledWith('user-1', {
      minTrustGrade: undefined,
      limit: 20,
      offset: 0,
    });
  });

  it('minTrustGrade でフィルタできる', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindMatches.mockResolvedValue({ matches: [], total: 0 });

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/matches?minTrustGrade=A');
    const response = await GET(request as any);

    expect(response.status).toBe(200);
    expect(mockFindMatches).toHaveBeenCalledWith('user-1', {
      minTrustGrade: 'A',
      limit: 20,
      offset: 0,
    });
  });

  it('無効な minTrustGrade は 400 を返す', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/matches?minTrustGrade=X');
    const response = await GET(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('Invalid minTrustGrade');
  });

  it('limit と offset を指定できる', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindMatches.mockResolvedValue({ matches: [], total: 0 });

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/matches?limit=10&offset=5');
    const response = await GET(request as any);

    expect(response.status).toBe(200);
    expect(mockFindMatches).toHaveBeenCalledWith('user-1', {
      minTrustGrade: undefined,
      limit: 10,
      offset: 5,
    });
  });

  it('limit が 100 を超えると 400 を返す', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/matches?limit=101');
    const response = await GET(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('limit must be between 1 and 100');
  });

  it('limit が 0 以下は 400 を返す', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/matches?limit=0');
    const response = await GET(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('limit must be between 1 and 100');
  });

  it('offset が負の値は 400 を返す', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/matches?offset=-1');
    const response = await GET(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('offset must be a non-negative number');
  });
});
