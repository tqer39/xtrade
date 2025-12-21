import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetCardWithCreator = vi.fn();

vi.mock('@/modules/cards', () => ({
  getCardWithCreator: (...args: unknown[]) => mockGetCardWithCreator(...args),
}));

describe('GET /api/items/[itemId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('カード詳細を返す', async () => {
    const mockCard = {
      id: 'card-1',
      name: 'Test Card',
      creator: { id: 'user-1', name: 'Creator' },
    };
    mockGetCardWithCreator.mockResolvedValue(mockCard);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/items/card-1');
    const response = await GET(request, { params: Promise.resolve({ itemId: 'card-1' }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.card).toEqual(mockCard);
    expect(mockGetCardWithCreator).toHaveBeenCalledWith('card-1');
  });

  it('存在しないカードの場合は 404 を返す', async () => {
    mockGetCardWithCreator.mockResolvedValue(null);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/items/nonexistent');
    const response = await GET(request, { params: Promise.resolve({ itemId: 'nonexistent' }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('Card not found');
  });
});
