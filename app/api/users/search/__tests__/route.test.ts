import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetSession = vi.fn();
const mockSearchUsers = vi.fn();

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

vi.mock('@/modules/users', () => ({
  searchUsers: (query?: string, limit?: number) => mockSearchUsers(query, limit),
}));

function createMockRequest(searchParams?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost:3000/api/users/search');
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return {
    method: 'GET',
    url: url.toString(),
  } as unknown as NextRequest;
}

describe('/api/users/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('GET - ユーザー検索', () => {
    it('未認証の場合は 401 を返す', async () => {
      mockGetSession.mockResolvedValue(null);

      const { GET } = await import('../route');
      const request = createMockRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('認証済みの場合はユーザー一覧を返す', async () => {
      const mockUsers = [
        { id: '1', name: 'User A', twitterUsername: 'user_a', trustGrade: 'A' },
        { id: '2', name: 'User B', twitterUsername: 'user_b', trustGrade: 'B' },
      ];
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockSearchUsers.mockResolvedValue(mockUsers);

      const { GET } = await import('../route');
      const request = createMockRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.users).toEqual(mockUsers);
      expect(mockSearchUsers).toHaveBeenCalledWith(undefined, 50);
    });

    it('クエリパラメータで検索できる', async () => {
      const mockUsers = [{ id: '1', name: 'Test User', twitterUsername: 'test', trustGrade: 'A' }];
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockSearchUsers.mockResolvedValue(mockUsers);

      const { GET } = await import('../route');
      const request = createMockRequest({ q: 'test' });
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.users).toEqual(mockUsers);
      expect(mockSearchUsers).toHaveBeenCalledWith('test', 50);
    });

    it('件数制限を指定できる', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockSearchUsers.mockResolvedValue([]);

      const { GET } = await import('../route');
      const request = createMockRequest({ limit: '10' });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSearchUsers).toHaveBeenCalledWith(undefined, 10);
    });

    it('件数制限の最大値は100', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockSearchUsers.mockResolvedValue([]);

      const { GET } = await import('../route');
      const request = createMockRequest({ limit: '200' });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSearchUsers).toHaveBeenCalledWith(undefined, 100);
    });
  });
});
