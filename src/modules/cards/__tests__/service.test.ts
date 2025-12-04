import { describe, it, expect, vi, beforeEach } from 'vitest'

// DB モジュールをモック
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockFrom = vi.fn()
const mockWhere = vi.fn()
const mockOrderBy = vi.fn()
const mockLimit = vi.fn()
const mockInnerJoin = vi.fn()
const mockSet = vi.fn()
const mockValues = vi.fn()

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
}))

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
  userHaveCard: {
    id: 'userHaveCard.id',
    userId: 'userHaveCard.userId',
    cardId: 'userHaveCard.cardId',
    quantity: 'userHaveCard.quantity',
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
}))

// drizzle-orm のモック
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
  and: vi.fn((...args) => ({ type: 'and', conditions: args })),
  like: vi.fn((a, b) => ({ type: 'like', a, b })),
  sql: vi.fn(),
}))

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
} = await import('../service')

describe('cards/service', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // デフォルトのチェーンモック設定
    mockFrom.mockReturnValue({
      where: mockWhere,
      orderBy: mockOrderBy,
      innerJoin: mockInnerJoin,
    })
    mockWhere.mockReturnValue({
      orderBy: mockOrderBy,
      limit: mockLimit,
    })
    mockOrderBy.mockReturnValue({
      limit: mockLimit,
    })
    mockLimit.mockResolvedValue([])
    mockInnerJoin.mockReturnValue({
      where: mockWhere,
    })
    mockValues.mockResolvedValue(undefined)
    mockSet.mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    })
    mockDelete.mockResolvedValue(undefined)
  })

  describe('searchCards', () => {
    it('クエリなしで全カードを検索', async () => {
      const mockCards = [
        { id: '1', name: 'Card A', category: 'common' },
        { id: '2', name: 'Card B', category: 'rare' },
      ]
      mockLimit.mockResolvedValue(mockCards)

      const result = await searchCards()

      expect(result).toEqual(mockCards)
      expect(mockFrom).toHaveBeenCalled()
    })

    it('クエリありで検索', async () => {
      const mockCards = [{ id: '1', name: 'Dragon Card', category: 'rare' }]
      mockLimit.mockResolvedValue(mockCards)

      const result = await searchCards('Dragon')

      expect(result).toEqual(mockCards)
    })

    it('カテゴリで絞り込み', async () => {
      const mockCards = [{ id: '1', name: 'Card A', category: 'rare' }]
      mockLimit.mockResolvedValue(mockCards)

      const result = await searchCards(undefined, 'rare')

      expect(result).toEqual(mockCards)
    })

    it('クエリとカテゴリの両方で絞り込み', async () => {
      const mockCards = [{ id: '1', name: 'Dragon Card', category: 'rare' }]
      mockLimit.mockResolvedValue(mockCards)

      const result = await searchCards('Dragon', 'rare')

      expect(result).toEqual(mockCards)
    })

    it('limit パラメータが適用される', async () => {
      mockLimit.mockResolvedValue([])

      await searchCards(undefined, undefined, 10)

      expect(mockLimit).toHaveBeenCalledWith(10)
    })
  })

  describe('createCard', () => {
    it('新しいカードを作成', async () => {
      const input = {
        name: 'New Card',
        category: 'common',
        rarity: 'R',
        imageUrl: 'https://example.com/image.png',
      }

      const result = await createCard(input, 'user-1')

      expect(result.name).toBe('New Card')
      expect(result.category).toBe('common')
      expect(result.rarity).toBe('R')
      expect(result.imageUrl).toBe('https://example.com/image.png')
      expect(result.createdByUserId).toBe('user-1')
      expect(result.id).toBeDefined()
      expect(mockValues).toHaveBeenCalled()
    })

    it('オプションフィールドなしで作成', async () => {
      const input = {
        name: 'Simple Card',
        category: 'common',
      }

      const result = await createCard(input, 'user-1')

      expect(result.name).toBe('Simple Card')
      expect(result.rarity).toBeNull()
      expect(result.imageUrl).toBeNull()
    })
  })

  describe('getCardById', () => {
    it('存在するカードを取得', async () => {
      const mockCard = { id: 'card-1', name: 'Test Card', category: 'common' }
      mockLimit.mockResolvedValue([mockCard])

      const result = await getCardById('card-1')

      expect(result).toEqual(mockCard)
    })

    it('存在しないカードは null を返す', async () => {
      mockLimit.mockResolvedValue([])

      const result = await getCardById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getUserHaveCards', () => {
    it('ユーザーの持っているカード一覧を取得', async () => {
      const mockHaveCards = [
        {
          id: 'have-1',
          userId: 'user-1',
          cardId: 'card-1',
          quantity: 2,
          card: { id: 'card-1', name: 'Card A', category: 'common' },
        },
      ]
      mockOrderBy.mockResolvedValue(mockHaveCards)

      const result = await getUserHaveCards('user-1')

      expect(result).toEqual(mockHaveCards)
      expect(mockInnerJoin).toHaveBeenCalled()
    })
  })

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
      ]
      mockOrderBy.mockResolvedValue(mockWantCards)

      const result = await getUserWantCards('user-1')

      expect(result).toEqual(mockWantCards)
      expect(mockInnerJoin).toHaveBeenCalled()
    })
  })

  describe('upsertHaveCard', () => {
    it('存在しないカードIDでエラー', async () => {
      // getCardById が null を返すようにモック
      mockLimit.mockResolvedValue([])

      await expect(
        upsertHaveCard('user-1', { cardId: 'non-existent', quantity: 1 })
      ).rejects.toThrow('Card not found')
    })

    it('quantity が 0 の場合は削除', async () => {
      // getCardById がカードを返すようにモック
      mockLimit.mockResolvedValueOnce([{ id: 'card-1', name: 'Test' }])

      const result = await upsertHaveCard('user-1', {
        cardId: 'card-1',
        quantity: 0,
      })

      expect(result).toBeNull()
      expect(mockDelete).toHaveBeenCalled()
    })

    it('新規レコードを作成', async () => {
      // getCardById がカードを返す
      mockLimit.mockResolvedValueOnce([{ id: 'card-1', name: 'Test' }])
      // 既存レコードなし
      mockLimit.mockResolvedValueOnce([])

      const result = await upsertHaveCard('user-1', {
        cardId: 'card-1',
        quantity: 2,
      })

      expect(result).not.toBeNull()
      expect(result?.quantity).toBe(2)
      expect(mockValues).toHaveBeenCalled()
    })

    it('既存レコードを更新', async () => {
      // getCardById がカードを返す
      mockLimit.mockResolvedValueOnce([{ id: 'card-1', name: 'Test' }])
      // 既存レコードあり
      mockLimit.mockResolvedValueOnce([
        { id: 'have-1', userId: 'user-1', cardId: 'card-1', quantity: 1 },
      ])

      const result = await upsertHaveCard('user-1', {
        cardId: 'card-1',
        quantity: 5,
      })

      expect(result).not.toBeNull()
      expect(result?.quantity).toBe(5)
      expect(mockSet).toHaveBeenCalled()
    })
  })

  describe('upsertWantCard', () => {
    it('存在しないカードIDでエラー', async () => {
      mockLimit.mockResolvedValue([])

      await expect(
        upsertWantCard('user-1', { cardId: 'non-existent' })
      ).rejects.toThrow('Card not found')
    })

    it('新規レコードを作成', async () => {
      // getCardById がカードを返す
      mockLimit.mockResolvedValueOnce([{ id: 'card-1', name: 'Test' }])
      // 既存レコードなし
      mockLimit.mockResolvedValueOnce([])

      const result = await upsertWantCard('user-1', {
        cardId: 'card-1',
        priority: 10,
      })

      expect(result).not.toBeNull()
      expect(result?.priority).toBe(10)
      expect(mockValues).toHaveBeenCalled()
    })

    it('既存レコードを更新', async () => {
      // getCardById がカードを返す
      mockLimit.mockResolvedValueOnce([{ id: 'card-1', name: 'Test' }])
      // 既存レコードあり
      mockLimit.mockResolvedValueOnce([
        { id: 'want-1', userId: 'user-1', cardId: 'card-1', priority: 5 },
      ])

      const result = await upsertWantCard('user-1', {
        cardId: 'card-1',
        priority: 20,
      })

      expect(result).not.toBeNull()
      expect(result?.priority).toBe(20)
      expect(mockSet).toHaveBeenCalled()
    })

    it('priority のデフォルト値は 0', async () => {
      // getCardById がカードを返す
      mockLimit.mockResolvedValueOnce([{ id: 'card-1', name: 'Test' }])
      // 既存レコードなし
      mockLimit.mockResolvedValueOnce([])

      const result = await upsertWantCard('user-1', { cardId: 'card-1' })

      expect(result?.priority).toBe(0)
    })
  })

  describe('removeWantCard', () => {
    it('欲しいカードを削除', async () => {
      await removeWantCard('user-1', 'card-1')

      expect(mockDelete).toHaveBeenCalled()
    })
  })
})
