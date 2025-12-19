import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetSession = vi.fn();
const mockGetTradeByRoomSlug = vi.fn();
const mockUncancelTrade = vi.fn();

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
  uncancelTrade: (trade: unknown, userId: string) => mockUncancelTrade(trade, userId),
  TradeTransitionError: MockTradeTransitionError,
}));

function createMockRequest(): Request {
  return {
    method: 'POST',
    url: 'http://localhost:3000/api/trades/abc123/uncancel',
  } as unknown as Request;
}

describe('/api/trades/[roomSlug]/uncancel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('POST - キャンセル取消', () => {
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
      const mockTrade = { id: 'trade-1', roomSlug: 'abc123', status: 'canceled' };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-3' },
      });
      mockGetTradeByRoomSlug.mockResolvedValue(mockTrade);
      mockUncancelTrade.mockRejectedValue(
        new MockTradeTransitionError('Not authorized', 'UNAUTHORIZED')
      );

      const { POST } = await import('../route');
      const request = createMockRequest();
      const response = await POST(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe('Not authorized');
    });

    it('キャンセル状態でない場合は 400 を返す', async () => {
      const mockTrade = { id: 'trade-1', roomSlug: 'abc123', status: 'proposed' };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockGetTradeByRoomSlug.mockResolvedValue(mockTrade);
      mockUncancelTrade.mockRejectedValue(
        new MockTradeTransitionError('Trade is not canceled', 'INVALID_TRANSITION')
      );

      const { POST } = await import('../route');
      const request = createMockRequest();
      const response = await POST(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Trade is not canceled');
    });

    it('キャンセルを取り消せる', async () => {
      const mockTrade = { id: 'trade-1', roomSlug: 'abc123', status: 'canceled' };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockGetTradeByRoomSlug.mockResolvedValue(mockTrade);
      mockUncancelTrade.mockResolvedValue('proposed');

      const { POST } = await import('../route');
      const request = createMockRequest();
      const response = await POST(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.status).toBe('proposed');
      expect(mockUncancelTrade).toHaveBeenCalledWith(mockTrade, 'user-1');
    });
  });
});
