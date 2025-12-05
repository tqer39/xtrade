import { beforeEach, describe, expect, it, vi } from 'vitest';

// DB モジュールをモック
const _mockSelect = vi.fn();
const _mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockInnerJoin = vi.fn();
const mockValues = vi.fn();

vi.mock('@/db/drizzle', () => ({
  db: {
    select: (_fields?: Record<string, unknown>) => ({
      from: mockFrom,
    }),
    insert: () => ({
      values: mockValues,
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
    createdByUserId: 'card.createdByUserId',
    createdAt: 'card.createdAt',
    updatedAt: 'card.updatedAt',
  },
  user: {
    id: 'user.id',
    name: 'user.name',
    twitterUsername: 'user.twitterUsername',
    image: 'user.image',
    trustGrade: 'user.trustGrade',
    trustScore: 'user.trustScore',
  },
  userFavoriteCard: {
    id: 'userFavoriteCard.id',
    userId: 'userFavoriteCard.userId',
    cardId: 'userFavoriteCard.cardId',
    createdAt: 'userFavoriteCard.createdAt',
  },
  userFavoriteUser: {
    id: 'userFavoriteUser.id',
    userId: 'userFavoriteUser.userId',
    favoriteUserId: 'userFavoriteUser.favoriteUserId',
    createdAt: 'userFavoriteUser.createdAt',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
  and: vi.fn((...args) => ({ type: 'and', conditions: args })),
  inArray: vi.fn((field, values) => ({ type: 'inArray', field, values })),
}));

// モック後にインポート
const {
  getUserFavoriteCards,
  addFavoriteCard,
  removeFavoriteCard,
  isCardFavorited,
  getUserFavoriteUsers,
  addFavoriteUser,
  removeFavoriteUser,
  isUserFavorited,
  checkFavorites,
} = await import('../service');

describe('favorites/service', () => {
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
    mockInnerJoin.mockReturnValue({
      where: mockWhere,
      orderBy: mockOrderBy,
    });
    mockOrderBy.mockReturnValue({
      limit: mockLimit,
    });
    mockLimit.mockResolvedValue([]);
    mockValues.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
  });

  describe('getUserFavoriteCards', () => {
    it('お気に入りカード一覧を取得', async () => {
      const mockFavoriteCards = [
        {
          id: 'fav-1',
          userId: 'user-1',
          cardId: 'card-1',
          createdAt: new Date(),
          card: {
            id: 'card-1',
            name: 'Test Card',
            category: 'pokemon',
            rarity: 'SR',
            imageUrl: 'https://example.com/card.jpg',
            createdByUserId: 'user-2',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];
      mockOrderBy.mockResolvedValueOnce(mockFavoriteCards);

      const result = await getUserFavoriteCards('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].card.name).toBe('Test Card');
    });

    it('お気に入りがない場合は空配列を返す', async () => {
      mockOrderBy.mockResolvedValueOnce([]);

      const result = await getUserFavoriteCards('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('addFavoriteCard', () => {
    it('カードをお気に入りに追加', async () => {
      const mockCard = {
        id: 'card-1',
        name: 'Test Card',
        category: 'pokemon',
        rarity: 'SR',
        imageUrl: 'https://example.com/card.jpg',
        createdByUserId: 'user-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockLimit.mockResolvedValueOnce([mockCard]); // カードが存在
      mockLimit.mockResolvedValueOnce([]); // 既存のお気に入りなし

      const result = await addFavoriteCard('user-1', 'card-1');

      expect(result.card).toEqual(mockCard);
      expect(result.cardId).toBe('card-1');
      expect(mockValues).toHaveBeenCalled();
    });

    it('既にお気に入りの場合は既存データを返す', async () => {
      const mockCard = {
        id: 'card-1',
        name: 'Test Card',
        category: 'pokemon',
        rarity: 'SR',
        imageUrl: null,
        createdByUserId: 'user-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const existingFavorite = {
        id: 'fav-1',
        userId: 'user-1',
        cardId: 'card-1',
        createdAt: new Date(),
      };
      mockLimit.mockResolvedValueOnce([mockCard]); // カードが存在
      mockLimit.mockResolvedValueOnce([existingFavorite]); // 既存のお気に入りあり

      const result = await addFavoriteCard('user-1', 'card-1');

      expect(result.id).toBe('fav-1');
      expect(mockValues).not.toHaveBeenCalled(); // 新規作成しない
    });

    it('カードが存在しない場合エラー', async () => {
      mockLimit.mockResolvedValueOnce([]); // カードが存在しない

      await expect(addFavoriteCard('user-1', 'non-existent')).rejects.toThrow('Card not found');
    });
  });

  describe('removeFavoriteCard', () => {
    it('カードをお気に入りから削除', async () => {
      await removeFavoriteCard('user-1', 'card-1');

      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('isCardFavorited', () => {
    it('お気に入りの場合 true を返す', async () => {
      mockLimit.mockResolvedValueOnce([{ id: 'fav-1' }]);

      const result = await isCardFavorited('user-1', 'card-1');

      expect(result).toBe(true);
    });

    it('お気に入りでない場合 false を返す', async () => {
      mockLimit.mockResolvedValueOnce([]);

      const result = await isCardFavorited('user-1', 'card-1');

      expect(result).toBe(false);
    });
  });

  describe('getUserFavoriteUsers', () => {
    it('お気に入りユーザー一覧を取得', async () => {
      const mockFavoriteUsers = [
        {
          id: 'fav-1',
          userId: 'user-1',
          favoriteUserId: 'user-2',
          createdAt: new Date(),
          favoriteUser: {
            id: 'user-2',
            name: 'Test User',
            twitterUsername: 'testuser',
            image: 'https://example.com/user.jpg',
            trustGrade: 'A',
            trustScore: 100,
          },
        },
      ];
      mockOrderBy.mockResolvedValueOnce(mockFavoriteUsers);

      const result = await getUserFavoriteUsers('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].favoriteUser.name).toBe('Test User');
    });

    it('お気に入りがない場合は空配列を返す', async () => {
      mockOrderBy.mockResolvedValueOnce([]);

      const result = await getUserFavoriteUsers('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('addFavoriteUser', () => {
    it('ユーザーをお気に入りに追加', async () => {
      const mockUser = {
        id: 'user-2',
        name: 'Test User',
        twitterUsername: 'testuser',
        image: 'https://example.com/user.jpg',
        trustGrade: 'A',
        trustScore: 100,
      };
      mockLimit.mockResolvedValueOnce([mockUser]); // ユーザーが存在
      mockLimit.mockResolvedValueOnce([]); // 既存のお気に入りなし

      const result = await addFavoriteUser('user-1', 'user-2');

      expect(result.favoriteUser).toEqual(mockUser);
      expect(result.favoriteUserId).toBe('user-2');
      expect(mockValues).toHaveBeenCalled();
    });

    it('既にお気に入りの場合は既存データを返す', async () => {
      const mockUser = {
        id: 'user-2',
        name: 'Test User',
        twitterUsername: null,
        image: null,
        trustGrade: null,
        trustScore: null,
      };
      const existingFavorite = {
        id: 'fav-1',
        userId: 'user-1',
        favoriteUserId: 'user-2',
        createdAt: new Date(),
      };
      mockLimit.mockResolvedValueOnce([mockUser]); // ユーザーが存在
      mockLimit.mockResolvedValueOnce([existingFavorite]); // 既存のお気に入りあり

      const result = await addFavoriteUser('user-1', 'user-2');

      expect(result.id).toBe('fav-1');
      expect(mockValues).not.toHaveBeenCalled(); // 新規作成しない
    });

    it('自分自身をお気に入りにできない', async () => {
      await expect(addFavoriteUser('user-1', 'user-1')).rejects.toThrow('Cannot favorite yourself');
    });

    it('ユーザーが存在しない場合エラー', async () => {
      mockLimit.mockResolvedValueOnce([]); // ユーザーが存在しない

      await expect(addFavoriteUser('user-1', 'non-existent')).rejects.toThrow('User not found');
    });
  });

  describe('removeFavoriteUser', () => {
    it('ユーザーをお気に入りから削除', async () => {
      await removeFavoriteUser('user-1', 'user-2');

      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('isUserFavorited', () => {
    it('お気に入りの場合 true を返す', async () => {
      mockLimit.mockResolvedValueOnce([{ id: 'fav-1' }]);

      const result = await isUserFavorited('user-1', 'user-2');

      expect(result).toBe(true);
    });

    it('お気に入りでない場合 false を返す', async () => {
      mockLimit.mockResolvedValueOnce([]);

      const result = await isUserFavorited('user-1', 'user-2');

      expect(result).toBe(false);
    });
  });

  describe('checkFavorites', () => {
    it('複数のカード/ユーザーのお気に入り状態を一括確認', async () => {
      // カードのお気に入り状態
      mockWhere.mockReturnValueOnce([{ cardId: 'card-1' }, { cardId: 'card-3' }]);
      // ユーザーのお気に入り状態
      mockWhere.mockReturnValueOnce([{ favoriteUserId: 'user-2' }]);

      const result = await checkFavorites(
        'user-1',
        ['card-1', 'card-2', 'card-3'],
        ['user-2', 'user-3']
      );

      expect(result.cards['card-1']).toBe(true);
      expect(result.cards['card-2']).toBe(false);
      expect(result.cards['card-3']).toBe(true);
      expect(result.users['user-2']).toBe(true);
      expect(result.users['user-3']).toBe(false);
    });

    it('空の配列の場合は空のオブジェクトを返す', async () => {
      const result = await checkFavorites('user-1', [], []);

      expect(result.cards).toEqual({});
      expect(result.users).toEqual({});
    });

    it('カードのみの確認', async () => {
      mockWhere.mockReturnValueOnce([{ cardId: 'card-1' }]);

      const result = await checkFavorites('user-1', ['card-1', 'card-2'], []);

      expect(result.cards['card-1']).toBe(true);
      expect(result.cards['card-2']).toBe(false);
      expect(result.users).toEqual({});
    });

    it('ユーザーのみの確認', async () => {
      mockWhere.mockReturnValueOnce([{ favoriteUserId: 'user-2' }]);

      const result = await checkFavorites('user-1', [], ['user-2', 'user-3']);

      expect(result.cards).toEqual({});
      expect(result.users['user-2']).toBe(true);
      expect(result.users['user-3']).toBe(false);
    });
  });
});
