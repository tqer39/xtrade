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
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  delete: vi.fn().mockReturnThis(),
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
    role: 'role',
  },
  allowedUser: {
    id: 'id',
    twitterUsername: 'twitter_username',
    addedBy: 'added_by',
    createdAt: 'created_at',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ column: a, value: b })),
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'test-nanoid-123'),
}));

function createMockRequest(
  method: string,
  body?: Record<string, unknown>,
  searchParams?: Record<string, string>
): NextRequest {
  const url = new URL('http://localhost:3000/api/admin/allowed-users');
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return {
    method,
    url: url.toString(),
    json: () => Promise.resolve(body),
  } as unknown as NextRequest;
}

describe('/api/admin/allowed-users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('認証・認可', () => {
    it('未認証の場合は 401 を返す', async () => {
      mockGetSession.mockResolvedValue(null);

      const { GET } = await import('../route');
      const request = createMockRequest('GET');
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
      const request = createMockRequest('GET');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe('Forbidden: Admin access required');
    });
  });

  describe('GET - ホワイトリスト一覧取得', () => {
    it('管理者はホワイトリスト一覧を取得できる', async () => {
      const mockAllowedUsers = [
        { id: '1', twitterUsername: 'user1', addedBy: 'admin-1' },
        { id: '2', twitterUsername: 'user2', addedBy: 'admin-1' },
      ];

      mockGetSession.mockResolvedValue({
        user: { id: 'admin-1' },
      });
      mockDb.limit.mockResolvedValue([{ id: 'admin-1', role: 'admin' }]);
      mockDb.orderBy.mockResolvedValue(mockAllowedUsers);

      const { GET } = await import('../route');
      const request = createMockRequest('GET');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.allowedUsers).toEqual(mockAllowedUsers);
    });
  });

  describe('POST - ユーザー追加', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        user: { id: 'admin-1' },
      });
      mockDb.limit.mockResolvedValue([{ id: 'admin-1', role: 'admin' }]);
    });

    it('twitterUsername が必須', async () => {
      const { POST } = await import('../route');
      const request = createMockRequest('POST', {});
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('twitterUsername is required');
    });

    it('無効な twitterUsername の場合は 400 を返す', async () => {
      const { POST } = await import('../route');
      const request = createMockRequest('POST', { twitterUsername: '   ' });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid twitterUsername');
    });

    it('既存ユーザーの場合は 409 を返す', async () => {
      mockDb.limit.mockResolvedValueOnce([{ id: 'admin-1', role: 'admin' }]);
      mockDb.limit.mockResolvedValueOnce([{ id: '1', twitterUsername: 'existinguser' }]);

      const { POST } = await import('../route');
      const request = createMockRequest('POST', { twitterUsername: 'existinguser' });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(409);
      expect(json.error).toBe('User already in whitelist');
    });

    it('@ プレフィックスを除去して正規化する', async () => {
      mockDb.limit.mockResolvedValueOnce([{ id: 'admin-1', role: 'admin' }]);
      mockDb.limit.mockResolvedValueOnce([]);
      mockDb.returning.mockResolvedValue([
        { id: 'test-nanoid-123', twitterUsername: 'newuser', addedBy: 'admin-1' },
      ]);

      const { POST } = await import('../route');
      const request = createMockRequest('POST', { twitterUsername: '@NewUser' });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.allowedUser.twitterUsername).toBe('newuser');
    });
  });

  describe('DELETE - ユーザー削除', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        user: { id: 'admin-1' },
      });
      mockDb.limit.mockResolvedValue([{ id: 'admin-1', role: 'admin' }]);
    });

    it('id が必須', async () => {
      const { DELETE } = await import('../route');
      const request = createMockRequest('DELETE', {}, {});
      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('id is required');
    });

    it('存在しないユーザーの場合は 404 を返す', async () => {
      mockDb.returning.mockResolvedValue([]);

      const { DELETE } = await import('../route');
      const request = createMockRequest('DELETE', {}, { id: 'nonexistent' });
      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe('User not found');
    });

    it('ユーザーを正常に削除できる', async () => {
      const deletedUser = { id: '1', twitterUsername: 'deleteduser' };
      mockDb.returning.mockResolvedValue([deletedUser]);

      const { DELETE } = await import('../route');
      const request = createMockRequest('DELETE', {}, { id: '1' });
      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.deleted).toEqual(deletedUser);
    });
  });
});
