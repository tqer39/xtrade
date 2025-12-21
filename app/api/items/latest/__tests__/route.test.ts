import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockSearchLatestCardsWithCreator = vi.fn();

vi.mock('@/modules/cards', () => ({
  searchLatestCardsWithCreator: (...args: unknown[]) => mockSearchLatestCardsWithCreator(...args),
}));

describe('GET /api/items/latest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('最新カード一覧を返す', async () => {
    const mockResult = {
      cards: [
        { id: '1', name: 'Card A', creator: { name: 'User 1' } },
        { id: '2', name: 'Card B', creator: { name: 'User 2' } },
      ],
      total: 2,
      page: 1,
      totalPages: 1,
    };
    mockSearchLatestCardsWithCreator.mockResolvedValue(mockResult);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/items/latest');
    const response = await GET(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(mockResult);
    expect(mockSearchLatestCardsWithCreator).toHaveBeenCalledWith({
      query: undefined,
      page: 1,
      limit: 12,
    });
  });

  it('検索クエリを渡せる', async () => {
    mockSearchLatestCardsWithCreator.mockResolvedValue({
      cards: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/items/latest?q=test');
    const response = await GET(request as any);

    expect(response.status).toBe(200);
    expect(mockSearchLatestCardsWithCreator).toHaveBeenCalledWith({
      query: 'test',
      page: 1,
      limit: 12,
    });
  });

  it('page と limit を指定できる', async () => {
    mockSearchLatestCardsWithCreator.mockResolvedValue({
      cards: [],
      total: 100,
      page: 3,
      totalPages: 10,
    });

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/items/latest?page=3&limit=10');
    const response = await GET(request as any);

    expect(response.status).toBe(200);
    expect(mockSearchLatestCardsWithCreator).toHaveBeenCalledWith({
      query: undefined,
      page: 3,
      limit: 10,
    });
  });

  it('limit は最大 100 に制限される', async () => {
    mockSearchLatestCardsWithCreator.mockResolvedValue({
      cards: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/items/latest?limit=200');
    const response = await GET(request as any);

    expect(response.status).toBe(200);
    expect(mockSearchLatestCardsWithCreator).toHaveBeenCalledWith({
      query: undefined,
      page: 1,
      limit: 100,
    });
  });

  it('page が 0 以下の場合は 1 に補正される', async () => {
    mockSearchLatestCardsWithCreator.mockResolvedValue({
      cards: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/items/latest?page=0');
    const response = await GET(request as any);

    expect(response.status).toBe(200);
    expect(mockSearchLatestCardsWithCreator).toHaveBeenCalledWith({
      query: undefined,
      page: 1,
      limit: 12,
    });
  });

  it('Cache-Control ヘッダーが設定される', async () => {
    mockSearchLatestCardsWithCreator.mockResolvedValue({
      cards: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/items/latest');
    const response = await GET(request as any);

    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=60, stale-while-revalidate=30'
    );
  });
});
