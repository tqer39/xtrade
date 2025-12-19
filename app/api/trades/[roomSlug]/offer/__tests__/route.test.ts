import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetSession = vi.fn();
const mockGetTradeByRoomSlug = vi.fn();
const mockUpdateOffer = vi.fn();

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

class MockTradeTransitionError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'TradeTransitionError';
  }
}

vi.mock('@/modules/trades', () => ({
  getTradeByRoomSlug: (roomSlug: string) => mockGetTradeByRoomSlug(roomSlug),
  updateOffer: (trade: unknown, userId: string, data: unknown) =>
    mockUpdateOffer(trade, userId, data),
  TradeTransitionError: MockTradeTransitionError,
}));

function createMockRequest(body?: Record<string, unknown>): NextRequest {
  return {
    method: 'POST',
    url: 'http://localhost:3000/api/trades/abc123/offer',
    json: () => (body ? Promise.resolve(body) : Promise.reject(new Error('Invalid JSON'))),
  } as unknown as NextRequest;
}

describe('/api/trades/[roomSlug]/offer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('POST - オファー更新', () => {
    it('未認証の場合は 401 を返す', async () => {
      mockGetSession.mockResolvedValue(null);

      const { POST } = await import('../route');
      const request = createMockRequest({ items: [{ cardId: 'card-1' }] });
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
      const request = createMockRequest({ items: [{ cardId: 'card-1' }] });
      const response = await POST(request, {
        params: Promise.resolve({ roomSlug: 'non-existent' }),
      });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe('Trade not found');
    });

    it('無効な JSON の場合は 400 を返す', async () => {
      const mockTrade = { id: 'trade-1', roomSlug: 'abc123' };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockGetTradeByRoomSlug.mockResolvedValue(mockTrade);

      const { POST } = await import('../route');
      const request = {
        method: 'POST',
        url: 'http://localhost:3000/api/trades/abc123/offer',
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as unknown as NextRequest;
      const response = await POST(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid JSON');
    });

    it('items が必須', async () => {
      const mockTrade = { id: 'trade-1', roomSlug: 'abc123' };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockGetTradeByRoomSlug.mockResolvedValue(mockTrade);

      const { POST } = await import('../route');
      const request = createMockRequest({});
      const response = await POST(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('items is required');
    });

    it('各アイテムに cardId が必須', async () => {
      const mockTrade = { id: 'trade-1', roomSlug: 'abc123' };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockGetTradeByRoomSlug.mockResolvedValue(mockTrade);

      const { POST } = await import('../route');
      const request = createMockRequest({ items: [{ cardId: 'card-1' }, {}] });
      const response = await POST(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Each item must have a cardId');
    });

    it('権限がない場合は 403 を返す', async () => {
      const mockTrade = { id: 'trade-1', roomSlug: 'abc123' };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockGetTradeByRoomSlug.mockResolvedValue(mockTrade);
      mockUpdateOffer.mockRejectedValue(
        new MockTradeTransitionError('Not authorized', 'UNAUTHORIZED')
      );

      const { POST } = await import('../route');
      const request = createMockRequest({ items: [{ cardId: 'card-1' }] });
      const response = await POST(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe('Not authorized');
    });

    it('オファーを更新できる', async () => {
      const mockTrade = { id: 'trade-1', roomSlug: 'abc123' };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockGetTradeByRoomSlug.mockResolvedValue(mockTrade);
      mockUpdateOffer.mockResolvedValue(undefined);

      const { POST } = await import('../route');
      const request = createMockRequest({ items: [{ cardId: 'card-1' }, { cardId: 'card-2' }] });
      const response = await POST(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(mockUpdateOffer).toHaveBeenCalledWith(mockTrade, 'user-1', {
        items: [{ cardId: 'card-1' }, { cardId: 'card-2' }],
      });
    });
  });
});
