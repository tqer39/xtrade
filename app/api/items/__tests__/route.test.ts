import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetSession = vi.fn();
const mockSearchCards = vi.fn();
const mockCreateCard = vi.fn();

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
  searchCards: (...args: unknown[]) => mockSearchCards(...args),
  createCard: (...args: unknown[]) => mockCreateCard(...args),
}));

describe('GET /api/items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('未認証の場合は 401 を返す', async () => {
    mockGetSession.mockResolvedValue(null);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/items');
    const response = await GET(request as any);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('認証済みの場合はカード一覧を返す', async () => {
    const mockCards = [
      { id: '1', name: 'Card A', category: 'Category1' },
      { id: '2', name: 'Card B', category: 'Category2' },
    ];
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockSearchCards.mockResolvedValue(mockCards);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/items');
    const response = await GET(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.cards).toEqual(mockCards);
    expect(mockSearchCards).toHaveBeenCalledWith(undefined, undefined, 50);
  });

  it('検索クエリを渡せる', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockSearchCards.mockResolvedValue([]);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/items?q=test');
    const response = await GET(request as any);

    expect(response.status).toBe(200);
    expect(mockSearchCards).toHaveBeenCalledWith('test', undefined, 50);
  });

  it('カテゴリでフィルタできる', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockSearchCards.mockResolvedValue([]);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/items?category=INI');
    const response = await GET(request as any);

    expect(response.status).toBe(200);
    expect(mockSearchCards).toHaveBeenCalledWith(undefined, 'INI', 50);
  });

  it('limit を指定できる', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockSearchCards.mockResolvedValue([]);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/items?limit=20');
    const response = await GET(request as any);

    expect(response.status).toBe(200);
    expect(mockSearchCards).toHaveBeenCalledWith(undefined, undefined, 20);
  });

  it('limit は最大 100 に制限される', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockSearchCards.mockResolvedValue([]);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/items?limit=200');
    const response = await GET(request as any);

    expect(response.status).toBe(200);
    expect(mockSearchCards).toHaveBeenCalledWith(undefined, undefined, 100);
  });
});

describe('POST /api/items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('未認証の場合は 401 を返す', async () => {
    mockGetSession.mockResolvedValue(null);

    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/items', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Card' }),
    });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('無効な JSON の場合は 400 を返す', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });

    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/items', {
      method: 'POST',
      body: 'invalid json',
    });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid JSON');
  });

  it('name が必須', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });

    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/items', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('name is required');
  });

  it('空の name は拒否される', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });

    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/items', {
      method: 'POST',
      body: JSON.stringify({ name: '   ' }),
    });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('name is required');
  });

  it('カードを作成できる', async () => {
    const mockCard = { id: 'card-1', name: 'Test Card' };
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockCreateCard.mockResolvedValue(mockCard);

    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/items', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Card', category: 'INI' }),
    });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.card).toEqual(mockCard);
    expect(mockCreateCard).toHaveBeenCalledWith(
      { name: 'Test Card', category: 'INI', description: undefined, imageUrl: undefined },
      'user-1'
    );
  });
});
