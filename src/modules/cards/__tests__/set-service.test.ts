import { beforeEach, describe, expect, it, vi } from 'vitest';

// DB モジュールをモック
const _mockSelect = vi.fn();
const _mockInsert = vi.fn();
const _mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockInnerJoin = vi.fn();
const mockLeftJoin = vi.fn();
const mockGroupBy = vi.fn();
const mockSet = vi.fn();
const mockValues = vi.fn();

vi.mock('@/db/drizzle', () => ({
  db: {
    select: (_fields?: Record<string, unknown>) => ({
      from: mockFrom,
    }),
    insert: () => ({
      values: mockValues,
    }),
    update: () => ({
      set: mockSet,
    }),
    delete: () => ({
      where: mockDelete,
    }),
  },
}));

vi.mock('@/db/schema', () => ({
  card: {
    id: 'card.id',
    name: 'card.name',
    category: 'card.category',
    rarity: 'card.rarity',
    imageUrl: 'card.imageUrl',
  },
  cardSet: {
    id: 'cardSet.id',
    userId: 'cardSet.userId',
    name: 'cardSet.name',
    description: 'cardSet.description',
    isPublic: 'cardSet.isPublic',
    createdAt: 'cardSet.createdAt',
    updatedAt: 'cardSet.updatedAt',
  },
  cardSetItem: {
    id: 'cardSetItem.id',
    setId: 'cardSetItem.setId',
    cardId: 'cardSetItem.cardId',
    quantity: 'cardSetItem.quantity',
    createdAt: 'cardSetItem.createdAt',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
  and: vi.fn((...args) => ({ type: 'and', conditions: args })),
  sql: vi.fn((strings, ...values) => ({ type: 'sql', strings, values })),
  count: vi.fn((field) => ({ type: 'count', field })),
}));

// getCardById のモック
vi.mock('../service', () => ({
  getCardById: vi.fn(),
}));

// モック後にインポート
const {
  getUserSets,
  getSetById,
  createSet,
  updateSet,
  deleteSet,
  addItemToSet,
  removeItemFromSet,
  isSetOwner,
} = await import('../set-service');

const { getCardById } = await import('../service');

describe('cards/set-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // デフォルトのチェーンモック設定
    mockFrom.mockReturnValue({
      where: mockWhere,
      orderBy: mockOrderBy,
      innerJoin: mockInnerJoin,
      leftJoin: mockLeftJoin,
    });
    mockWhere.mockReturnValue({
      orderBy: mockOrderBy,
      limit: mockLimit,
      groupBy: mockGroupBy,
    });
    mockLeftJoin.mockReturnValue({
      where: mockWhere,
    });
    mockGroupBy.mockReturnValue({
      orderBy: mockOrderBy,
    });
    mockOrderBy.mockReturnValue({
      limit: mockLimit,
    });
    mockInnerJoin.mockReturnValue({
      where: mockWhere,
      orderBy: mockOrderBy,
    });
    mockLimit.mockResolvedValue([]);
    mockValues.mockResolvedValue(undefined);
    mockSet.mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    mockDelete.mockResolvedValue(undefined);
  });

  describe('getUserSets', () => {
    it('ユーザーのセット一覧を取得（カード数・サムネイル含む）', async () => {
      const mockSets = [
        {
          id: 'set-1',
          userId: 'user-1',
          name: 'Test Set',
          description: 'Description',
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          itemCount: 2,
        },
      ];
      mockOrderBy.mockResolvedValueOnce(mockSets);

      // サムネイル取得のモック
      mockOrderBy.mockResolvedValueOnce([
        { setId: 'set-1', imageUrl: 'https://example.com/img1.jpg' },
        { setId: 'set-1', imageUrl: 'https://example.com/img2.jpg' },
      ]);

      const result = await getUserSets('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].itemCount).toBe(2);
      expect(result[0].thumbnails).toHaveLength(2);
    });

    it('セットがない場合は空配列を返す', async () => {
      mockOrderBy.mockResolvedValueOnce([]);

      const result = await getUserSets('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getSetById', () => {
    it('セットとアイテムを取得', async () => {
      const mockSet = {
        id: 'set-1',
        name: 'Test Set',
        description: null,
        isPublic: false,
      };
      const mockItems = [
        {
          id: 'item-1',
          setId: 'set-1',
          cardId: 'card-1',
          quantity: 2,
          card: { id: 'card-1', name: 'Card A' },
        },
      ];
      mockLimit.mockResolvedValueOnce([mockSet]);
      mockOrderBy.mockResolvedValueOnce(mockItems);

      const result = await getSetById('set-1');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test Set');
      expect(result?.items).toHaveLength(1);
    });

    it('存在しないセットは null を返す', async () => {
      mockLimit.mockResolvedValueOnce([]);

      const result = await getSetById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createSet', () => {
    it('新しいセットを作成', async () => {
      const result = await createSet('user-1', {
        name: 'New Set',
        description: 'Description',
        isPublic: true,
      });

      expect(result.name).toBe('New Set');
      expect(result.description).toBe('Description');
      expect(result.isPublic).toBe(true);
      expect(result.userId).toBe('user-1');
      expect(result.id).toBeDefined();
      expect(mockValues).toHaveBeenCalled();
    });

    it('オプションフィールドなしで作成', async () => {
      const result = await createSet('user-1', { name: 'Simple Set' });

      expect(result.name).toBe('Simple Set');
      expect(result.description).toBeNull();
      expect(result.isPublic).toBe(false);
    });
  });

  describe('updateSet', () => {
    it('セットを更新', async () => {
      const existingSet = {
        id: 'set-1',
        userId: 'user-1',
        name: 'Old Name',
        description: null,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockLimit.mockResolvedValueOnce([existingSet]);

      const result = await updateSet('set-1', {
        name: 'New Name',
        isPublic: true,
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe('New Name');
      expect(result?.isPublic).toBe(true);
      expect(mockSet).toHaveBeenCalled();
    });

    it('存在しないセットは null を返す', async () => {
      mockLimit.mockResolvedValueOnce([]);

      const result = await updateSet('non-existent', { name: 'New Name' });

      expect(result).toBeNull();
    });
  });

  describe('deleteSet', () => {
    it('セットを削除', async () => {
      await deleteSet('set-1');

      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('addItemToSet', () => {
    it('カードが存在しない場合エラー', async () => {
      (getCardById as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      await expect(addItemToSet('set-1', { cardId: 'non-existent' })).rejects.toThrow(
        'Card not found'
      );
    });

    it('セットが存在しない場合エラー', async () => {
      (getCardById as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: 'card-1',
        name: 'Test Card',
      });
      mockLimit.mockResolvedValueOnce([]); // セットが存在しない

      await expect(addItemToSet('non-existent', { cardId: 'card-1' })).rejects.toThrow(
        'Set not found'
      );
    });

    it('新規アイテムを追加', async () => {
      (getCardById as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: 'card-1',
        name: 'Test Card',
      });
      mockLimit.mockResolvedValueOnce([{ id: 'set-1' }]); // セットが存在
      mockLimit.mockResolvedValueOnce([]); // 既存アイテムなし

      await addItemToSet('set-1', { cardId: 'card-1', quantity: 2 });

      expect(mockValues).toHaveBeenCalled();
    });

    it('既存アイテムを更新', async () => {
      (getCardById as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: 'card-1',
        name: 'Test Card',
      });
      mockLimit.mockResolvedValueOnce([{ id: 'set-1' }]); // セットが存在
      mockLimit.mockResolvedValueOnce([{ id: 'item-1', quantity: 1 }]); // 既存アイテムあり

      await addItemToSet('set-1', { cardId: 'card-1', quantity: 3 });

      expect(mockSet).toHaveBeenCalled();
    });
  });

  describe('removeItemFromSet', () => {
    it('セットからカードを削除', async () => {
      await removeItemFromSet('set-1', 'card-1');

      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('isSetOwner', () => {
    it('所有者の場合 true を返す', async () => {
      mockLimit.mockResolvedValueOnce([{ userId: 'user-1' }]);

      const result = await isSetOwner('set-1', 'user-1');

      expect(result).toBe(true);
    });

    it('所有者でない場合 false を返す', async () => {
      mockLimit.mockResolvedValueOnce([{ userId: 'other-user' }]);

      const result = await isSetOwner('set-1', 'user-1');

      expect(result).toBe(false);
    });

    it('セットが存在しない場合 false を返す', async () => {
      mockLimit.mockResolvedValueOnce([]);

      const result = await isSetOwner('non-existent', 'user-1');

      expect(result).toBe(false);
    });
  });
});
