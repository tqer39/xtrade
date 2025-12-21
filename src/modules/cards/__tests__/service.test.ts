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
const mockSet = vi.fn();
const mockValues = vi.fn();

vi.mock('@/db/drizzle', () => ({
  db: {
    select: () => ({
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
    description: 'card.description',
    imageUrl: 'card.imageUrl',
    createdByUserId: 'card.createdByUserId',
    createdAt: 'card.createdAt',
    updatedAt: 'card.updatedAt',
  },
  user: {
    id: 'user.id',
    name: 'user.name',
    image: 'user.image',
    twitterUsername: 'user.twitterUsername',
    trustScore: 'user.trustScore',
    trustGrade: 'user.trustGrade',
  },
  userHaveCard: {
    id: 'userHaveCard.id',
    userId: 'userHaveCard.userId',
    cardId: 'userHaveCard.cardId',
    createdAt: 'userHaveCard.createdAt',
    updatedAt: 'userHaveCard.updatedAt',
  },
  userWantCard: {
    id: 'userWantCard.id',
    userId: 'userWantCard.userId',
    cardId: 'userWantCard.cardId',
    priority: 'userWantCard.priority',
    createdAt: 'userWantCard.createdAt',
    updatedAt: 'userWantCard.updatedAt',
  },
}));

// drizzle-orm のモック
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
  and: vi.fn((...args) => ({ type: 'and', conditions: args })),
  like: vi.fn((a, b) => ({ type: 'like', a, b })),
  desc: vi.fn((a) => ({ type: 'desc', column: a })),
  sql: vi.fn(),
}));

// モック後にインポート
const {
  searchCards,
  createCard,
  getCardById,
  getUserHaveCards,
  getUserWantCards,
  upsertHaveCard,
  upsertWantCard,
  removeWantCard,
  getLatestCards,
  getCardOwners,
  getUserCategories,
  getLatestCardsWithCreator,
  getUserListingCards,
  getCardWithCreator,
  getCardOwnersWithWantCards,
} = await import('../service');

describe('cards/service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // デフォルトのチェーンモック設定
    mockFrom.mockReturnValue({
      where: mockWhere,
      orderBy: mockOrderBy,
      innerJoin: mockInnerJoin,
    });
    mockWhere.mockReturnValue({
      orderBy: mockOrderBy,
      limit: mockLimit,
    });
    mockOrderBy.mockReturnValue({
      limit: mockLimit,
    });
    mockLimit.mockResolvedValue([]);
    mockInnerJoin.mockReturnValue({
      where: mockWhere,
    });
    mockValues.mockResolvedValue(undefined);
    mockSet.mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    mockDelete.mockResolvedValue(undefined);
  });

  describe('searchCards', () => {
    it('クエリなしで全カードを検索', async () => {
      const mockCards = [
        { id: '1', name: 'Card A', category: 'common' },
        { id: '2', name: 'Card B', category: 'rare' },
      ];
      mockLimit.mockResolvedValue(mockCards);

      const result = await searchCards();

      expect(result).toEqual(mockCards);
      expect(mockFrom).toHaveBeenCalled();
    });

    it('クエリありで検索', async () => {
      const mockCards = [{ id: '1', name: 'Dragon Card', category: 'rare' }];
      mockLimit.mockResolvedValue(mockCards);

      const result = await searchCards('Dragon');

      expect(result).toEqual(mockCards);
    });

    it('カテゴリで絞り込み', async () => {
      const mockCards = [{ id: '1', name: 'Card A', category: 'rare' }];
      mockLimit.mockResolvedValue(mockCards);

      const result = await searchCards(undefined, 'rare');

      expect(result).toEqual(mockCards);
    });

    it('クエリとカテゴリの両方で絞り込み', async () => {
      const mockCards = [{ id: '1', name: 'Dragon Card', category: 'rare' }];
      mockLimit.mockResolvedValue(mockCards);

      const result = await searchCards('Dragon', 'rare');

      expect(result).toEqual(mockCards);
    });

    it('limit パラメータが適用される', async () => {
      mockLimit.mockResolvedValue([]);

      await searchCards(undefined, undefined, 10);

      expect(mockLimit).toHaveBeenCalledWith(10);
    });
  });

  describe('createCard', () => {
    it('新しいカードを作成', async () => {
      const input = {
        name: 'New Card',
        category: 'common',
        description: 'テスト用の説明',
        imageUrl: 'https://example.com/image.png',
      };

      const result = await createCard(input, 'user-1');

      expect(result.name).toBe('New Card');
      expect(result.category).toBe('common');
      expect(result.description).toBe('テスト用の説明');
      expect(result.imageUrl).toBe('https://example.com/image.png');
      expect(result.createdByUserId).toBe('user-1');
      expect(result.id).toBeDefined();
      expect(mockValues).toHaveBeenCalled();
    });

    it('オプションフィールドなしで作成', async () => {
      const input = {
        name: 'Simple Card',
        category: 'common',
      };

      const result = await createCard(input, 'user-1');

      expect(result.name).toBe('Simple Card');
      expect(result.description).toBeNull();
      expect(result.imageUrl).toBeNull();
    });
  });

  describe('getCardById', () => {
    it('存在するカードを取得', async () => {
      const mockCard = { id: 'card-1', name: 'Test Card', category: 'common' };
      mockLimit.mockResolvedValue([mockCard]);

      const result = await getCardById('card-1');

      expect(result).toEqual(mockCard);
    });

    it('存在しないカードは null を返す', async () => {
      mockLimit.mockResolvedValue([]);

      const result = await getCardById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getUserHaveCards', () => {
    it('ユーザーの持っているカード一覧を取得', async () => {
      const mockHaveCards = [
        {
          id: 'have-1',
          userId: 'user-1',
          cardId: 'card-1',
          card: { id: 'card-1', name: 'Card A', category: 'common' },
        },
      ];
      mockOrderBy.mockResolvedValue(mockHaveCards);

      const result = await getUserHaveCards('user-1');

      expect(result).toEqual(mockHaveCards);
      expect(mockInnerJoin).toHaveBeenCalled();
    });
  });

  describe('getUserWantCards', () => {
    it('ユーザーの欲しいカード一覧を取得', async () => {
      const mockWantCards = [
        {
          id: 'want-1',
          userId: 'user-1',
          cardId: 'card-1',
          priority: 1,
          card: { id: 'card-1', name: 'Card A', category: 'rare' },
        },
      ];
      mockOrderBy.mockResolvedValue(mockWantCards);

      const result = await getUserWantCards('user-1');

      expect(result).toEqual(mockWantCards);
      expect(mockInnerJoin).toHaveBeenCalled();
    });
  });

  describe('upsertHaveCard', () => {
    it('存在しないカードIDでエラー', async () => {
      // getCardById が null を返すようにモック
      mockLimit.mockResolvedValue([]);

      await expect(upsertHaveCard('user-1', { cardId: 'non-existent' })).rejects.toThrow(
        'Card not found'
      );
    });

    it('新規レコードを作成', async () => {
      // getCardById がカードを返す
      mockLimit.mockResolvedValueOnce([{ id: 'card-1', name: 'Test' }]);
      // 既存レコードなし
      mockLimit.mockResolvedValueOnce([]);

      const result = await upsertHaveCard('user-1', {
        cardId: 'card-1',
      });

      expect(result).not.toBeNull();
      expect(mockValues).toHaveBeenCalled();
    });

    it('既存レコードがある場合はそのまま返す', async () => {
      // getCardById がカードを返す
      mockLimit.mockResolvedValueOnce([{ id: 'card-1', name: 'Test' }]);
      // 既存レコードあり
      mockLimit.mockResolvedValueOnce([{ id: 'have-1', userId: 'user-1', cardId: 'card-1' }]);

      const result = await upsertHaveCard('user-1', {
        cardId: 'card-1',
      });

      expect(result).not.toBeNull();
      expect(result?.id).toBe('have-1');
    });
  });

  describe('upsertWantCard', () => {
    it('存在しないカードIDでエラー', async () => {
      mockLimit.mockResolvedValue([]);

      await expect(upsertWantCard('user-1', { cardId: 'non-existent' })).rejects.toThrow(
        'Card not found'
      );
    });

    it('新規レコードを作成', async () => {
      // getCardById がカードを返す
      mockLimit.mockResolvedValueOnce([{ id: 'card-1', name: 'Test' }]);
      // 既存レコードなし
      mockLimit.mockResolvedValueOnce([]);

      const result = await upsertWantCard('user-1', {
        cardId: 'card-1',
        priority: 10,
      });

      expect(result).not.toBeNull();
      expect(result?.priority).toBe(10);
      expect(mockValues).toHaveBeenCalled();
    });

    it('既存レコードを更新', async () => {
      // getCardById がカードを返す
      mockLimit.mockResolvedValueOnce([{ id: 'card-1', name: 'Test' }]);
      // 既存レコードあり
      mockLimit.mockResolvedValueOnce([
        { id: 'want-1', userId: 'user-1', cardId: 'card-1', priority: 5 },
      ]);

      const result = await upsertWantCard('user-1', {
        cardId: 'card-1',
        priority: 20,
      });

      expect(result).not.toBeNull();
      expect(result?.priority).toBe(20);
      expect(mockSet).toHaveBeenCalled();
    });

    it('priority のデフォルト値は 0', async () => {
      // getCardById がカードを返す
      mockLimit.mockResolvedValueOnce([{ id: 'card-1', name: 'Test' }]);
      // 既存レコードなし
      mockLimit.mockResolvedValueOnce([]);

      const result = await upsertWantCard('user-1', { cardId: 'card-1' });

      expect(result?.priority).toBe(0);
    });
  });

  describe('removeWantCard', () => {
    it('欲しいカードを削除', async () => {
      await removeWantCard('user-1', 'card-1');

      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('getLatestCards', () => {
    it('最新登録カードを取得', async () => {
      const mockCards = [
        { id: 'card-1', name: 'Card 1', createdAt: new Date() },
        { id: 'card-2', name: 'Card 2', createdAt: new Date() },
      ];
      mockLimit.mockResolvedValueOnce(mockCards);

      const result = await getLatestCards(20);

      expect(result).toEqual(mockCards);
      expect(mockFrom).toHaveBeenCalled();
      expect(mockOrderBy).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith(20);
    });

    it('limit のデフォルト値は 20', async () => {
      mockLimit.mockResolvedValueOnce([]);

      await getLatestCards();

      expect(mockLimit).toHaveBeenCalledWith(20);
    });

    it('limit の最大値は 100', async () => {
      mockLimit.mockResolvedValueOnce([]);

      await getLatestCards(200);

      expect(mockLimit).toHaveBeenCalledWith(100);
    });
  });

  describe('getCardOwners', () => {
    it('カード所有者一覧を取得', async () => {
      const mockOwners = [{ userId: 'user-1', name: 'User 1', trustGrade: 'A', trustScore: 80 }];
      mockWhere.mockReturnValue({
        orderBy: vi.fn().mockResolvedValueOnce(mockOwners),
      });

      const result = await getCardOwners('card-1');

      expect(result).toEqual(mockOwners);
      expect(mockFrom).toHaveBeenCalled();
    });

    it('所有者がいない場合は空配列を返す', async () => {
      mockWhere.mockReturnValue({
        orderBy: vi.fn().mockResolvedValueOnce([]),
      });

      const result = await getCardOwners('card-1');

      expect(result).toEqual([]);
    });
  });

  describe('getUserCategories', () => {
    it('ユーザーのカテゴリ一覧を取得', async () => {
      const mockSelectDistinct = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi
              .fn()
              .mockResolvedValueOnce([{ category: 'カテゴリA' }, { category: 'カテゴリB' }])
              .mockResolvedValueOnce([{ category: 'カテゴリB' }, { category: 'カテゴリC' }]),
          }),
        }),
      });

      // db.selectDistinct をモック
      const db = await import('@/db/drizzle');
      (db.db as unknown as { selectDistinct: typeof mockSelectDistinct }).selectDistinct =
        mockSelectDistinct;

      const result = await getUserCategories('user-1');

      // 重複を排除してソートされた配列を期待
      expect(result).toEqual(['カテゴリA', 'カテゴリB', 'カテゴリC']);
    });

    it('カテゴリがない場合は空配列を返す', async () => {
      const mockSelectDistinct = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]),
          }),
        }),
      });

      const db = await import('@/db/drizzle');
      (db.db as unknown as { selectDistinct: typeof mockSelectDistinct }).selectDistinct =
        mockSelectDistinct;

      const result = await getUserCategories('user-1');

      expect(result).toEqual([]);
    });

    it('null カテゴリは除外される', async () => {
      const mockSelectDistinct = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi
              .fn()
              .mockResolvedValueOnce([{ category: 'カテゴリA' }, { category: null }])
              .mockResolvedValueOnce([{ category: null }]),
          }),
        }),
      });

      const db = await import('@/db/drizzle');
      (db.db as unknown as { selectDistinct: typeof mockSelectDistinct }).selectDistinct =
        mockSelectDistinct;

      const result = await getUserCategories('user-1');

      expect(result).toEqual(['カテゴリA']);
    });
  });

  describe('getLatestCardsWithCreator', () => {
    it('最新カードを作成者情報付きで取得', async () => {
      const mockLeftJoin = vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: 'card-1',
              name: 'Test Card',
              category: 'common',
              description: null,
              imageUrl: null,
              createdByUserId: 'user-1',
              createdAt: new Date(),
              updatedAt: new Date(),
              creator: {
                id: 'user-1',
                name: 'Test User',
                image: null,
                twitterUsername: 'test',
                trustScore: 80,
                trustGrade: 'A',
              },
            },
          ]),
        }),
      });
      mockFrom.mockReturnValue({
        leftJoin: mockLeftJoin,
      });

      const result = await getLatestCardsWithCreator(10);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Card');
      expect(result[0].creator?.name).toBe('Test User');
    });

    it('作成者情報がない場合は creator が null', async () => {
      const mockLeftJoin = vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: 'card-1',
              name: 'Test Card',
              category: 'common',
              description: null,
              imageUrl: null,
              createdByUserId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              creator: { id: null, name: null, image: null, twitterUsername: null },
            },
          ]),
        }),
      });
      mockFrom.mockReturnValue({
        leftJoin: mockLeftJoin,
      });

      const result = await getLatestCardsWithCreator(10);

      expect(result[0].creator).toBeNull();
    });
  });

  describe('getUserListingCards', () => {
    it('ユーザーの出品カード一覧を取得', async () => {
      mockInnerJoin.mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([
            {
              id: 'card-1',
              name: 'Card A',
              category: 'common',
              createdAt: new Date(),
            },
          ]),
        }),
      });

      const result = await getUserListingCards('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Card A');
    });

    it('出品カードがない場合は空配列', async () => {
      mockInnerJoin.mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      });

      const result = await getUserListingCards('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getCardWithCreator', () => {
    it('カード詳細を作成者情報付きで取得', async () => {
      const mockLeftJoin = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: 'card-1',
              name: 'Test Card',
              category: 'common',
              description: 'テスト説明',
              imageUrl: 'https://example.com/img.jpg',
              createdByUserId: 'user-1',
              createdAt: new Date(),
              updatedAt: new Date(),
              creator: {
                id: 'user-1',
                name: 'Creator',
                image: null,
                twitterUsername: 'creator',
                trustScore: 90,
                trustGrade: 'S',
              },
            },
          ]),
        }),
      });
      mockFrom.mockReturnValue({
        leftJoin: mockLeftJoin,
      });

      const result = await getCardWithCreator('card-1');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test Card');
      expect(result?.creator?.name).toBe('Creator');
      expect(result?.creator?.trustGrade).toBe('S');
    });

    it('カードが存在しない場合は null', async () => {
      const mockLeftJoin = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      });
      mockFrom.mockReturnValue({
        leftJoin: mockLeftJoin,
      });

      const result = await getCardWithCreator('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getCardOwnersWithWantCards', () => {
    it('所有者がいない場合は空配列', async () => {
      // getCardOwners が空を返す
      mockWhere.mockReturnValue({
        orderBy: vi.fn().mockResolvedValueOnce([]),
      });

      const result = await getCardOwnersWithWantCards('card-1');

      expect(result).toEqual([]);
    });
  });
});
