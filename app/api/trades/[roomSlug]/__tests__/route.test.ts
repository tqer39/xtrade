import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetSession = vi.fn();
const mockGetTradeDetail = vi.fn();

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

vi.mock('@/modules/trades', () => ({
  getTradeDetail: (roomSlug: string) => mockGetTradeDetail(roomSlug),
}));

function createMockRequest(): NextRequest {
  return {
    method: 'GET',
    url: 'http://localhost:3000/api/trades/abc123',
  } as unknown as NextRequest;
}

describe('/api/trades/[roomSlug]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('GET - トレード詳細取得', () => {
    it('未認証の場合は 401 を返す', async () => {
      mockGetSession.mockResolvedValue(null);

      const { GET } = await import('../route');
      const request = createMockRequest();
      const response = await GET(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('トレードが存在しない場合は 404 を返す', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockGetTradeDetail.mockResolvedValue(null);

      const { GET } = await import('../route');
      const request = createMockRequest();
      const response = await GET(request, {
        params: Promise.resolve({ roomSlug: 'non-existent' }),
      });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe('Trade not found');
    });

    it('トレード詳細を取得できる', async () => {
      const mockTradeDetail = {
        id: 'trade-1',
        roomSlug: 'abc123',
        status: 'draft',
        initiator: { id: 'user-1', name: 'User 1' },
        responder: null,
        items: [],
      };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockGetTradeDetail.mockResolvedValue(mockTradeDetail);

      const { GET } = await import('../route');
      const request = createMockRequest();
      const response = await GET(request, { params: Promise.resolve({ roomSlug: 'abc123' }) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.trade).toEqual(mockTradeDetail);
      expect(mockGetTradeDetail).toHaveBeenCalledWith('abc123');
    });
  });
});
