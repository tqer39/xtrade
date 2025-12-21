import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetSession = vi.fn();
const mockUpsertWantCard = vi.fn();
const mockRemoveWantCard = vi.fn();

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
  upsertWantCard: (...args: unknown[]) => mockUpsertWantCard(...args),
  removeWantCard: (...args: unknown[]) => mockRemoveWantCard(...args),
}));

describe('POST /api/me/cards/want', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('未認証の場合は 401 を返す', async () => {
    mockGetSession.mockResolvedValue(null);

    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/me/cards/want', {
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
    const request = new Request('http://localhost/api/me/cards/want', {
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
    const request = new Request('http://localhost/api/me/cards/want', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('cardId is required');
  });

  it('priority が数値でない場合は 400 を返す', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });

    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/me/cards/want', {
      method: 'POST',
      body: JSON.stringify({ cardId: 'card-1', priority: 'high' }),
    });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('priority must be a number');
  });

  it('カードを追加できる', async () => {
    const mockResult = { id: 'want-1', cardId: 'card-1', userId: 'user-1', priority: 1 };
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockUpsertWantCard.mockResolvedValue(mockResult);

    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/me/cards/want', {
      method: 'POST',
      body: JSON.stringify({ cardId: 'card-1', priority: 1 }),
    });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.wantCard).toEqual(mockResult);
    expect(mockUpsertWantCard).toHaveBeenCalledWith('user-1', { cardId: 'card-1', priority: 1 });
  });

  it('存在しないカードの場合は 404 を返す', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockUpsertWantCard.mockRejectedValue(new Error('Card not found'));

    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/me/cards/want', {
      method: 'POST',
      body: JSON.stringify({ cardId: 'nonexistent' }),
    });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('Card not found');
  });
});

describe('DELETE /api/me/cards/want', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('未認証の場合は 401 を返す', async () => {
    mockGetSession.mockResolvedValue(null);

    const { DELETE } = await import('../route');
    const request = new Request('http://localhost/api/me/cards/want?cardId=card-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request as any);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('cardId が必須', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });

    const { DELETE } = await import('../route');
    const request = new Request('http://localhost/api/me/cards/want', {
      method: 'DELETE',
    });
    const response = await DELETE(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('cardId is required');
  });

  it('カードを削除できる', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockRemoveWantCard.mockResolvedValue(undefined);

    const { DELETE } = await import('../route');
    const request = new Request('http://localhost/api/me/cards/want?cardId=card-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.deleted).toBe(true);
    expect(mockRemoveWantCard).toHaveBeenCalledWith('user-1', 'card-1');
  });
});
