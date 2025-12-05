import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetSession = vi.fn();
const mockGetUserFavoriteCards = vi.fn();
const mockAddFavoriteCard = vi.fn();
const mockRemoveFavoriteCard = vi.fn();

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
  getUserFavoriteCards: () => mockGetUserFavoriteCards(),
  addFavoriteCard: (userId: string, cardId: string) => mockAddFavoriteCard(userId, cardId),
  removeFavoriteCard: (userId: string, cardId: string) => mockRemoveFavoriteCard(userId, cardId),
}));

function createMockRequest(
  method: string,
  body?: Record<string, unknown>,
  searchParams?: Record<string, string>
): NextRequest {
  const url = new URL('http://localhost:3000/api/me/favorites/cards');
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

describe('/api/me/favorites/cards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('GET - お気に入りカード一覧取得', () => {
    it('未認証の場合は 401 を返す', async () => {
      mockGetSession.mockResolvedValue(null);

      const { GET } = await import('../route');
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('認証済みの場合はお気に入りカード一覧を返す', async () => {
      const mockFavoriteCards = [{ id: 'fav-1', cardId: 'card-1', card: { name: 'Test Card' } }];
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockGetUserFavoriteCards.mockResolvedValue(mockFavoriteCards);

      const { GET } = await import('../route');
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.favoriteCards).toEqual(mockFavoriteCards);
    });
  });

  describe('POST - カードをお気に入りに追加', () => {
    it('未認証の場合は 401 を返す', async () => {
      mockGetSession.mockResolvedValue(null);

      const { POST } = await import('../route');
      const request = createMockRequest('POST', { cardId: 'card-1' });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('cardId が必須', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });

      const { POST } = await import('../route');
      const request = createMockRequest('POST', {});
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('cardId is required');
    });

    it('無効な JSON の場合は 400 を返す', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });

      const { POST } = await import('../route');
      const request = {
        method: 'POST',
        url: 'http://localhost:3000/api/me/favorites/cards',
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as unknown as NextRequest;
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid JSON');
    });

    it('カードが存在しない場合は 404 を返す', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockAddFavoriteCard.mockRejectedValue(new Error('Card not found'));

      const { POST } = await import('../route');
      const request = createMockRequest('POST', { cardId: 'non-existent' });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe('Card not found');
    });

    it('カードをお気に入りに追加できる', async () => {
      const mockResult = {
        id: 'fav-1',
        cardId: 'card-1',
        card: { name: 'Test Card' },
      };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockAddFavoriteCard.mockResolvedValue(mockResult);

      const { POST } = await import('../route');
      const request = createMockRequest('POST', { cardId: 'card-1' });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.favoriteCard).toEqual(mockResult);
      expect(mockAddFavoriteCard).toHaveBeenCalledWith('user-1', 'card-1');
    });
  });

  describe('DELETE - カードをお気に入りから削除', () => {
    it('未認証の場合は 401 を返す', async () => {
      mockGetSession.mockResolvedValue(null);

      const { DELETE } = await import('../route');
      const request = createMockRequest('DELETE', {}, { cardId: 'card-1' });
      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('cardId が必須', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });

      const { DELETE } = await import('../route');
      const request = createMockRequest('DELETE', {}, {});
      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('cardId is required');
    });

    it('カードをお気に入りから削除できる', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockRemoveFavoriteCard.mockResolvedValue(undefined);

      const { DELETE } = await import('../route');
      const request = createMockRequest('DELETE', {}, { cardId: 'card-1' });
      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.deleted).toBe(true);
      expect(mockRemoveFavoriteCard).toHaveBeenCalledWith('user-1', 'card-1');
    });
  });
});
