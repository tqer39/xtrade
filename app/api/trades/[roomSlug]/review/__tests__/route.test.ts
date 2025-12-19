import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetSession = vi.fn();
const mockGetTradeByRoomSlug = vi.fn();
const mockCreateReview = vi.fn();
const mockGetTradeReviews = vi.fn();
const mockHasReviewedTrade = vi.fn();

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

class MockReviewError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'ReviewError';
  }
}

vi.mock('@/modules/reviews', () => ({
  createReview: (tradeId: string, reviewerUserId: string, input: unknown) =>
    mockCreateReview(tradeId, reviewerUserId, input),
  getTradeReviews: (tradeId: string) => mockGetTradeReviews(tradeId),
  hasReviewedTrade: (tradeId: string, userId: string) => mockHasReviewedTrade(tradeId, userId),
  ReviewError: MockReviewError,
}));

vi.mock('@/modules/trades', () => ({
  getTradeByRoomSlug: (roomSlug: string) => mockGetTradeByRoomSlug(roomSlug),
}));

function createMockRequest(method: string, body?: Record<string, unknown>): NextRequest {
  return {
    method,
    url: 'http://localhost:3000/api/trades/abc123/review',
    json: () => (body ? Promise.resolve(body) : Promise.reject(new Error('Invalid JSON'))),
  } as unknown as NextRequest;
}

describe('/api/trades/[roomSlug]/review', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('POST - レビュー投稿', () => {
    it('未認証の場合は 401 を返す', async () => {
      mockGetSession.mockResolvedValue(null);

      const { POST } = await import('../route');
      const request = createMockRequest('POST', { rating: 5, comment: 'Good!' });
      const response = await POST(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('トレードが存在しない場合は 404 を返す', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockGetTradeByRoomSlug.mockResolvedValue(null);

      const { POST } = await import('../route');
      const request = createMockRequest('POST', { rating: 5, comment: 'Good!' });
      const response = await POST(request, {
        params: Promise.resolve({ roomSlug: 'non-existent' }),
      });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe('Trade not found');
    });

    it('トレード参加者でない場合は 403 を返す', async () => {
      const mockTrade = { id: 'trade-1', roomSlug: 'abc123' };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-3' },
      });
      mockGetTradeByRoomSlug.mockResolvedValue(mockTrade);
      mockCreateReview.mockRejectedValue(
        new MockReviewError('Not a participant', 'NOT_PARTICIPANT')
      );

      const { POST } = await import('../route');
      const request = createMockRequest('POST', { rating: 5, comment: 'Good!' });
      const response = await POST(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe('Not a participant');
    });

    it('既にレビュー済みの場合は 409 を返す', async () => {
      const mockTrade = { id: 'trade-1', roomSlug: 'abc123' };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockGetTradeByRoomSlug.mockResolvedValue(mockTrade);
      mockCreateReview.mockRejectedValue(
        new MockReviewError('Already reviewed', 'ALREADY_REVIEWED')
      );

      const { POST } = await import('../route');
      const request = createMockRequest('POST', { rating: 5, comment: 'Good!' });
      const response = await POST(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(409);
      expect(json.error).toBe('Already reviewed');
    });

    it('不正な評価の場合は 400 を返す', async () => {
      const mockTrade = { id: 'trade-1', roomSlug: 'abc123' };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockGetTradeByRoomSlug.mockResolvedValue(mockTrade);
      mockCreateReview.mockRejectedValue(new MockReviewError('Invalid rating', 'INVALID_RATING'));

      const { POST } = await import('../route');
      const request = createMockRequest('POST', { rating: 10, comment: 'Good!' });
      const response = await POST(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid rating');
    });

    it('レビューを投稿できる', async () => {
      const mockTrade = { id: 'trade-1', roomSlug: 'abc123' };
      const mockReview = {
        id: 'review-1',
        tradeId: 'trade-1',
        reviewerUserId: 'user-1',
        revieweeUserId: 'user-2',
        rating: 5,
        comment: 'Great trade!',
      };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockGetTradeByRoomSlug.mockResolvedValue(mockTrade);
      mockCreateReview.mockResolvedValue(mockReview);

      const { POST } = await import('../route');
      const request = createMockRequest('POST', { rating: 5, comment: 'Great trade!' });
      const response = await POST(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json).toEqual(mockReview);
      expect(mockCreateReview).toHaveBeenCalledWith('trade-1', 'user-1', {
        rating: 5,
        comment: 'Great trade!',
      });
    });
  });

  describe('GET - レビュー一覧取得', () => {
    it('未認証の場合は 401 を返す', async () => {
      mockGetSession.mockResolvedValue(null);

      const { GET } = await import('../route');
      const request = createMockRequest('GET');
      const response = await GET(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('トレードが存在しない場合は 404 を返す', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockGetTradeByRoomSlug.mockResolvedValue(null);

      const { GET } = await import('../route');
      const request = createMockRequest('GET');
      const response = await GET(request, {
        params: Promise.resolve({ roomSlug: 'non-existent' }),
      });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe('Trade not found');
    });

    it('レビュー一覧を取得できる', async () => {
      const mockTrade = { id: 'trade-1', roomSlug: 'abc123' };
      const mockReviews = [
        { id: 'review-1', rating: 5, comment: 'Great!' },
        { id: 'review-2', rating: 4, comment: 'Good' },
      ];
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockGetTradeByRoomSlug.mockResolvedValue(mockTrade);
      mockGetTradeReviews.mockResolvedValue(mockReviews);
      mockHasReviewedTrade.mockResolvedValue(true);

      const { GET } = await import('../route');
      const request = createMockRequest('GET');
      const response = await GET(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.reviews).toEqual(mockReviews);
      expect(json.hasReviewed).toBe(true);
    });
  });
});
