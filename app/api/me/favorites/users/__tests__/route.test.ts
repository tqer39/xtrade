import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetSession = vi.fn();
const mockGetUserFavoriteUsers = vi.fn();
const mockAddFavoriteUser = vi.fn();
const mockRemoveFavoriteUser = vi.fn();

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

vi.mock('@/modules/favorites', () => ({
  getUserFavoriteUsers: () => mockGetUserFavoriteUsers(),
  addFavoriteUser: (userId: string, favoriteUserId: string) =>
    mockAddFavoriteUser(userId, favoriteUserId),
  removeFavoriteUser: (userId: string, favoriteUserId: string) =>
    mockRemoveFavoriteUser(userId, favoriteUserId),
}));

function createMockRequest(
  method: string,
  body?: Record<string, unknown>,
  searchParams?: Record<string, string>
): NextRequest {
  const url = new URL('http://localhost:3000/api/me/favorites/users');
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

describe('/api/me/favorites/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('GET - お気に入りユーザー一覧取得', () => {
    it('未認証の場合は 401 を返す', async () => {
      mockGetSession.mockResolvedValue(null);

      const { GET } = await import('../route');
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('認証済みの場合はお気に入りユーザー一覧を返す', async () => {
      const mockFavoriteUsers = [
        { id: 'fav-1', favoriteUserId: 'user-2', favoriteUser: { name: 'Test User' } },
      ];
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockGetUserFavoriteUsers.mockResolvedValue(mockFavoriteUsers);

      const { GET } = await import('../route');
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.favoriteUsers).toEqual(mockFavoriteUsers);
    });
  });

  describe('POST - ユーザーをお気に入りに追加', () => {
    it('未認証の場合は 401 を返す', async () => {
      mockGetSession.mockResolvedValue(null);

      const { POST } = await import('../route');
      const request = createMockRequest('POST', { userId: 'user-2' });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('userId が必須', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });

      const { POST } = await import('../route');
      const request = createMockRequest('POST', {});
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('userId is required');
    });

    it('無効な JSON の場合は 400 を返す', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });

      const { POST } = await import('../route');
      const request = {
        method: 'POST',
        url: 'http://localhost:3000/api/me/favorites/users',
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as unknown as NextRequest;
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid JSON');
    });

    it('ユーザーが存在しない場合は 404 を返す', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockAddFavoriteUser.mockRejectedValue(new Error('User not found'));

      const { POST } = await import('../route');
      const request = createMockRequest('POST', { userId: 'non-existent' });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe('User not found');
    });

    it('自分自身をお気に入りにできない', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockAddFavoriteUser.mockRejectedValue(new Error('Cannot favorite yourself'));

      const { POST } = await import('../route');
      const request = createMockRequest('POST', { userId: 'user-1' });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Cannot favorite yourself');
    });

    it('ユーザーをお気に入りに追加できる', async () => {
      const mockResult = {
        id: 'fav-1',
        favoriteUserId: 'user-2',
        favoriteUser: { name: 'Test User' },
      };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockAddFavoriteUser.mockResolvedValue(mockResult);

      const { POST } = await import('../route');
      const request = createMockRequest('POST', { userId: 'user-2' });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.favoriteUser).toEqual(mockResult);
      expect(mockAddFavoriteUser).toHaveBeenCalledWith('user-1', 'user-2');
    });
  });

  describe('DELETE - ユーザーをお気に入りから削除', () => {
    it('未認証の場合は 401 を返す', async () => {
      mockGetSession.mockResolvedValue(null);

      const { DELETE } = await import('../route');
      const request = createMockRequest('DELETE', {}, { userId: 'user-2' });
      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('userId が必須', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });

      const { DELETE } = await import('../route');
      const request = createMockRequest('DELETE', {}, {});
      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('userId is required');
    });

    it('ユーザーをお気に入りから削除できる', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockRemoveFavoriteUser.mockResolvedValue(undefined);

      const { DELETE } = await import('../route');
      const request = createMockRequest('DELETE', {}, { userId: 'user-2' });
      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.deleted).toBe(true);
      expect(mockRemoveFavoriteUser).toHaveBeenCalledWith('user-1', 'user-2');
    });
  });
});
