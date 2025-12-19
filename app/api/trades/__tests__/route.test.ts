import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetSession = vi.fn();
const mockCreateTrade = vi.fn();

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
  createTrade: (
    initiatorUserId: string,
    options: { responderUserId?: string; proposedExpiredAt?: Date; initialCardId?: string }
  ) => mockCreateTrade(initiatorUserId, options),
}));

function createMockRequest(body?: Record<string, unknown>): NextRequest {
  return {
    method: 'POST',
    url: 'http://localhost:3000/api/trades',
    json: () => (body ? Promise.resolve(body) : Promise.reject(new Error('Invalid JSON'))),
  } as unknown as NextRequest;
}

describe('/api/trades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('POST - トレード作成', () => {
    it('未認証の場合は 401 を返す', async () => {
      mockGetSession.mockResolvedValue(null);

      const { POST } = await import('../route');
      const request = createMockRequest({ responderUserId: 'user-2' });
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
        url: 'http://localhost:3000/api/trades',
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as unknown as NextRequest;
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid JSON');
    });

    it('自分自身を相手に指定した場合は 400 を返す', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });

      const { POST } = await import('../route');
      const request = createMockRequest({ responderUserId: 'user-1' });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Cannot trade with yourself');
    });

    it('トレードを作成できる', async () => {
      const mockTrade = {
        id: 'trade-1',
        roomSlug: 'abc123',
        status: 'draft',
      };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockCreateTrade.mockResolvedValue(mockTrade);

      const { POST } = await import('../route');
      const request = createMockRequest({ responderUserId: 'user-2' });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.trade).toEqual(mockTrade);
      expect(mockCreateTrade).toHaveBeenCalledWith('user-1', {
        responderUserId: 'user-2',
        proposedExpiredAt: undefined,
        initialCardId: undefined,
      });
    });

    it('相手ユーザーなしでトレードを作成できる', async () => {
      const mockTrade = {
        id: 'trade-1',
        roomSlug: 'abc123',
        status: 'draft',
      };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockCreateTrade.mockResolvedValue(mockTrade);

      const { POST } = await import('../route');
      const request = createMockRequest({});
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.trade).toEqual(mockTrade);
    });

    it('初期カードIDを指定してトレードを作成できる', async () => {
      const mockTrade = {
        id: 'trade-1',
        roomSlug: 'abc123',
        status: 'draft',
      };
      mockGetSession.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockCreateTrade.mockResolvedValue(mockTrade);

      const { POST } = await import('../route');
      const request = createMockRequest({
        responderUserId: 'user-2',
        initialCardId: 'card-1',
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(mockCreateTrade).toHaveBeenCalledWith('user-1', {
        responderUserId: 'user-2',
        proposedExpiredAt: undefined,
        initialCardId: 'card-1',
      });
    });
  });
});
