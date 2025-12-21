import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetSession = vi.fn();
const mockUpsertHaveCard = vi.fn();

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

vi.mock('@/modules/cards', () => ({
  upsertHaveCard: (...args: unknown[]) => mockUpsertHaveCard(...args),
}));

describe('POST /api/me/cards/have', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('未認証の場合は 401 を返す', async () => {
    mockGetSession.mockResolvedValue(null);

    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/me/cards/have', {
      method: 'POST',
      body: JSON.stringify({ cardId: 'card-1' }),
    });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('無効な JSON の場合は 400 を返す', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });

    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/me/cards/have', {
      method: 'POST',
      body: 'invalid json',
    });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid JSON');
  });

  it('cardId が必須', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });

    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/me/cards/have', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('cardId is required');
  });

  it('カードを追加できる', async () => {
    const mockResult = { id: 'have-1', cardId: 'card-1', userId: 'user-1' };
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockUpsertHaveCard.mockResolvedValue(mockResult);

    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/me/cards/have', {
      method: 'POST',
      body: JSON.stringify({ cardId: 'card-1' }),
    });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.haveCard).toEqual(mockResult);
    expect(mockUpsertHaveCard).toHaveBeenCalledWith('user-1', { cardId: 'card-1' });
  });

  it('存在しないカードの場合は 404 を返す', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockUpsertHaveCard.mockRejectedValue(new Error('Card not found'));

    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/me/cards/have', {
      method: 'POST',
      body: JSON.stringify({ cardId: 'nonexistent' }),
    });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('Card not found');
  });
});
