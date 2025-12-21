import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockGetCardById = vi.fn();
const mockGetCardOwnersWithWantCards = vi.fn();

vi.mock('@/modules/cards', () => ({
  getCardById: (...args: unknown[]) => mockGetCardById(...args),
  getCardOwnersWithWantCards: (...args: unknown[]) => mockGetCardOwnersWithWantCards(...args),
}));

describe('GET /api/items/[itemId]/owners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('カードと所有者一覧を返す', async () => {
    const mockCard = { id: 'card-1', name: 'Test Card' };
    const mockOwners = [
      { userId: 'user-1', name: 'User 1', wantCards: [] },
      { userId: 'user-2', name: 'User 2', wantCards: [{ cardId: 'card-2' }] },
    ];
    mockGetCardById.mockResolvedValue(mockCard);
    mockGetCardOwnersWithWantCards.mockResolvedValue(mockOwners);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/items/card-1/owners');
    const response = await GET(request, { params: Promise.resolve({ itemId: 'card-1' }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.card).toEqual(mockCard);
    expect(json.owners).toEqual(mockOwners);
    expect(mockGetCardById).toHaveBeenCalledWith('card-1');
    expect(mockGetCardOwnersWithWantCards).toHaveBeenCalledWith('card-1');
  });

  it('存在しないカードの場合は 404 を返す', async () => {
    mockGetCardById.mockResolvedValue(null);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/items/nonexistent/owners');
    const response = await GET(request, { params: Promise.resolve({ itemId: 'nonexistent' }) });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('Card not found');
    expect(mockGetCardOwnersWithWantCards).not.toHaveBeenCalled();
  });

  it('所有者がいない場合は空配列を返す', async () => {
    const mockCard = { id: 'card-1', name: 'Test Card' };
    mockGetCardById.mockResolvedValue(mockCard);
    mockGetCardOwnersWithWantCards.mockResolvedValue([]);

    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/items/card-1/owners');
    const response = await GET(request, { params: Promise.resolve({ itemId: 'card-1' }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.card).toEqual(mockCard);
    expect(json.owners).toEqual([]);
  });
});
