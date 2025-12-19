import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetSession = vi.fn();
const mockGetTradeByRoomSlug = vi.fn();
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
  transitionTrade: (trade: unknown, status: string, userId: string) =>
    mockTransitionTrade(trade, status, userId),
  TradeTransitionError: MockTradeTransitionError,
}));

function createMockRequest(): NextRequest {
  return {
    method: 'POST',
    url: 'http://localhost:3000/api/trades/abc123/propose',
  } as unknown as NextRequest;
}

describe('/api/trades/[roomSlug]/propose', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('POST - トレード提案', () => {
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
      const mockTrade = { id: 'trade-1', roomSlug: 'abc123', status: 'draft' };
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

    it('状態遷移が無効な場合は 400 を返す', async () => {
      const mockTrade = { id: 'trade-1', roomSlug: 'abc123', status: 'completed' };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockGetTradeByRoomSlug.mockResolvedValue(mockTrade);
      mockTransitionTrade.mockRejectedValue(
        new MockTradeTransitionError('Invalid transition', 'INVALID_TRANSITION')
      );

      const { POST } = await import('../route');
      const request = createMockRequest();
      const response = await POST(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid transition');
    });

    it('トレードを提案できる', async () => {
      const mockTrade = { id: 'trade-1', roomSlug: 'abc123', status: 'draft' };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockGetTradeByRoomSlug.mockResolvedValue(mockTrade);
      mockTransitionTrade.mockResolvedValue(undefined);

      const { POST } = await import('../route');
      const request = createMockRequest();
      const response = await POST(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.status).toBe('proposed');
      expect(mockTransitionTrade).toHaveBeenCalledWith(mockTrade, 'proposed', 'user-1');
    });
  });
});
