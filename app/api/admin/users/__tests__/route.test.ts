import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetSession = vi.fn();
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
  orderBy: vi.fn(),
};

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
  db: mockDb,
}));

vi.mock('@/db/schema', () => ({
  user: {
    id: 'id',
    name: 'name',
    email: 'email',
    image: 'image',
    twitterUsername: 'twitter_username',
    role: 'role',
    trustScore: 'trust_score',
    trustGrade: 'trust_grade',
    createdAt: 'created_at',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ column: a, value: b })),
  desc: vi.fn((a) => ({ column: a, order: 'desc' })),
}));

function createMockRequest(): NextRequest {
  const url = new URL('http://localhost:3000/api/admin/users');

  return {
    method: 'GET',
    url: url.toString(),
  } as unknown as NextRequest;
}

describe('/api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('認証・認可', () => {
    it('未認証の場合は 401 を返す', async () => {
      mockGetSession.mockResolvedValue(null);

      const { GET } = await import('../route');
      const request = createMockRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('管理者以外の場合は 403 を返す', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockDb.limit.mockResolvedValue([{ id: 'user-1', role: 'user' }]);

      const { GET } = await import('../route');
      const request = createMockRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe('Forbidden: Admin access required');
    });

    it('ユーザーが存在しない場合は 403 を返す', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockDb.limit.mockResolvedValue([]);

      const { GET } = await import('../route');
      const request = createMockRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe('Forbidden: Admin access required');
    });
  });

  describe('GET - 登録済みユーザー一覧取得', () => {
    it('管理者は登録済みユーザー一覧を取得できる', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'User 1',
          email: 'user1@example.com',
          image: 'https://example.com/image1.png',
          twitterUsername: 'user1',
          role: 'user',
          trustScore: 80,
          trustGrade: 'A',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          name: 'User 2',
          email: 'user2@example.com',
          image: null,
          twitterUsername: 'user2',
          role: 'admin',
          trustScore: 100,
          trustGrade: 'S',
          createdAt: '2024-01-02T00:00:00.000Z',
        },
      ];

      mockGetSession.mockResolvedValue({
        user: { id: 'admin-1' },
      });
      mockDb.limit.mockResolvedValue([{ id: 'admin-1', role: 'admin' }]);
      mockDb.orderBy.mockResolvedValue(mockUsers);

      const { GET } = await import('../route');
      const request = createMockRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.users).toEqual(mockUsers);
      expect(json.users).toHaveLength(2);
    });

    it('ユーザーが0人の場合は空配列を返す', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'admin-1' },
      });
      mockDb.limit.mockResolvedValue([{ id: 'admin-1', role: 'admin' }]);
      mockDb.orderBy.mockResolvedValue([]);

      const { GET } = await import('../route');
      const request = createMockRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.users).toEqual([]);
    });
  });
});
