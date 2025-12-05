import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetSession = vi.fn();
const mockCheckFavorites = vi.fn();

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
  checkFavorites: (userId: string, cardIds: string[], userIds: string[]) =>
    mockCheckFavorites(userId, cardIds, userIds),
}));

function createMockRequest(method: string, body?: Record<string, unknown>): NextRequest {
  return {
    method,
    url: 'http://localhost:3000/api/me/favorites/check',
    json: () => Promise.resolve(body),
  } as unknown as NextRequest;
}

describe('/api/me/favorites/check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('POST - お気に入り状態一括確認', () => {
    it('未認証の場合は 401 を返す', async () => {
      mockGetSession.mockResolvedValue(null);

      const { POST } = await import('../route');
      const request = createMockRequest('POST', { cardIds: [], userIds: [] });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('無効な JSON の場合は 400 を返す', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });

      const { POST } = await import('../route');
      const request = {
        method: 'POST',
        url: 'http://localhost:3000/api/me/favorites/check',
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as unknown as NextRequest;
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid JSON');
    });

    it('cardIds と userIds が配列でない場合は 400 を返す', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });

      const { POST } = await import('../route');
      const request = createMockRequest('POST', { cardIds: 'not-array', userIds: [] });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('cardIds and userIds must be arrays');
    });

    it('お気に入り状態を一括確認できる', async () => {
      const mockResult = {
        cards: { 'card-1': true, 'card-2': false },
        users: { 'user-2': true },
      };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockCheckFavorites.mockResolvedValue(mockResult);

      const { POST } = await import('../route');
      const request = createMockRequest('POST', {
        cardIds: ['card-1', 'card-2'],
        userIds: ['user-2'],
      });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(mockResult);
      expect(mockCheckFavorites).toHaveBeenCalledWith('user-1', ['card-1', 'card-2'], ['user-2']);
    });

    it('cardIds と userIds がない場合はデフォルトで空配列', async () => {
      const mockResult = { cards: {}, users: {} };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockCheckFavorites.mockResolvedValue(mockResult);

      const { POST } = await import('../route');
      const request = createMockRequest('POST', {});
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(mockResult);
      expect(mockCheckFavorites).toHaveBeenCalledWith('user-1', [], []);
    });
  });
});
