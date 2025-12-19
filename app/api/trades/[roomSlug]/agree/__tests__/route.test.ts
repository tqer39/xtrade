import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetSession = vi.fn();
const mockGetTradeByRoomSlug = vi.fn();
const mockSetResponder = vi.fn();
const mockTransitionTrade = vi.fn();

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
  setResponder: (trade: unknown, userId: string) => mockSetResponder(trade, userId),
  transitionTrade: (trade: unknown, status: string, userId: string, options?: unknown) =>
    mockTransitionTrade(trade, status, userId, options),
  TradeTransitionError: MockTradeTransitionError,
}));

function createMockRequest(body?: Record<string, unknown>): NextRequest {
  const bodyText = body ? JSON.stringify(body) : '';
  return {
    method: 'POST',
    url: 'http://localhost:3000/api/trades/abc123/agree',
    text: () => Promise.resolve(bodyText),
  } as unknown as NextRequest;
}

describe('/api/trades/[roomSlug]/agree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('POST - トレード合意', () => {
    it('未認証の場合は 401 を返す', async () => {
      mockGetSession.mockResolvedValue(null);

      const { POST } = await import('../route');
      const request = createMockRequest();
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
      const request = createMockRequest();
      const response = await POST(request, {
        params: Promise.resolve({ roomSlug: 'non-existent' }),
      });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe('Trade not found');
    });

    it('権限がない場合は 403 を返す', async () => {
      const mockTrade = { id: 'trade-1', roomSlug: 'abc123', responderUserId: 'user-2' };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockGetTradeByRoomSlug.mockResolvedValue(mockTrade);
      mockTransitionTrade.mockRejectedValue(
        new MockTradeTransitionError('Not authorized', 'UNAUTHORIZED')
      );

      const { POST } = await import('../route');
      const request = createMockRequest();
      const response = await POST(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe('Not authorized');
    });

    it('トレードに合意できる', async () => {
      const mockTrade = { id: 'trade-1', roomSlug: 'abc123', responderUserId: 'user-2' };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-2' },
      });
      mockGetTradeByRoomSlug.mockResolvedValue(mockTrade);
      mockTransitionTrade.mockResolvedValue(undefined);

      const { POST } = await import('../route');
      const request = createMockRequest();
      const response = await POST(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.status).toBe('agreed');
      expect(mockTransitionTrade).toHaveBeenCalledWith(mockTrade, 'agreed', 'user-2', {
        agreedExpiredAt: undefined,
      });
    });

    it('応答者が未設定の場合は自動設定される', async () => {
      const mockTrade = { id: 'trade-1', roomSlug: 'abc123', responderUserId: null };
      const mockTradeWithResponder = { ...mockTrade, responderUserId: 'user-2' };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-2' },
      });
      mockGetTradeByRoomSlug
        .mockResolvedValueOnce(mockTrade)
        .mockResolvedValueOnce(mockTradeWithResponder);
      mockSetResponder.mockResolvedValue(undefined);
      mockTransitionTrade.mockResolvedValue(undefined);

      const { POST } = await import('../route');
      const request = createMockRequest();
      const response = await POST(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(mockSetResponder).toHaveBeenCalledWith(mockTrade, 'user-2');
    });

    it('期限を指定して合意できる', async () => {
      const mockTrade = { id: 'trade-1', roomSlug: 'abc123', responderUserId: 'user-2' };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-2' },
      });
      mockGetTradeByRoomSlug.mockResolvedValue(mockTrade);
      mockTransitionTrade.mockResolvedValue(undefined);

      const { POST } = await import('../route');
      const expiredAt = '2025-12-31T23:59:59.000Z';
      const request = createMockRequest({ agreedExpiredAt: expiredAt });
      const response = await POST(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(mockTransitionTrade).toHaveBeenCalledWith(mockTrade, 'agreed', 'user-2', {
        agreedExpiredAt: new Date(expiredAt),
      });
    });
  });
});
