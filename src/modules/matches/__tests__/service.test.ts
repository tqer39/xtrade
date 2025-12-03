import { describe, it, expect, vi, beforeEach } from 'vitest'

// DB モック
const mockSelect = vi.fn()
const mockFrom = vi.fn()
const mockWhere = vi.fn()
const mockInnerJoin = vi.fn()

vi.mock('@/db/drizzle', () => ({
  db: {
    select: () => ({
      from: mockFrom,
    }),
  },
}))

vi.mock('@/db/schema', () => ({
  user: {
    id: 'user.id',
    name: 'user.name',
    twitterUsername: 'user.twitterUsername',
    image: 'user.image',
    trustGrade: 'user.trustGrade',
    trustScore: 'user.trustScore',
  },
  userHaveCard: {
    userId: 'userHaveCard.userId',
    cardId: 'userHaveCard.cardId',
  },
  userWantCard: {
    userId: 'userWantCard.userId',
    cardId: 'userWantCard.cardId',
  },
  card: {
    id: 'card.id',
    name: 'card.name',
  },
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
  ne: vi.fn((a, b) => ({ type: 'ne', a, b })),
  and: vi.fn((...args) => ({ type: 'and', conditions: args })),
  inArray: vi.fn((a, b) => ({ type: 'inArray', a, b })),
  gte: vi.fn((a, b) => ({ type: 'gte', a, b })),
  sql: vi.fn(),
}))

// モック後にインポート
const { findMatches } = await import('../service')

describe('matches/service', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // デフォルトのチェーンモック設定
    mockFrom.mockReturnValue({
      where: mockWhere,
      innerJoin: mockInnerJoin,
    })
    mockWhere.mockResolvedValue([])
    mockInnerJoin.mockReturnValue({
      where: mockWhere,
    })
  })

  describe('findMatches', () => {
    it('カードを登録していない場合は空を返す', async () => {
      // 持っているカード: なし
      mockWhere.mockResolvedValueOnce([])
      // 欲しいカード: なし
      mockWhere.mockResolvedValueOnce([])

      const result = await findMatches('user-1')

      expect(result.matches).toEqual([])
      expect(result.total).toBe(0)
    })

    it('持っているカードのみの場合も検索可能', async () => {
      // 持っているカード: card-1
      mockWhere.mockResolvedValueOnce([{ cardId: 'card-1' }])
      // 欲しいカード: なし
      mockWhere.mockResolvedValueOnce([])
      // 自分のカードを欲しがっているユーザー: なし
      mockWhere.mockResolvedValueOnce([])

      const result = await findMatches('user-1')

      expect(result.matches).toEqual([])
      expect(result.total).toBe(0)
    })

    it('欲しいカードのみの場合も検索可能', async () => {
      // 持っているカード: なし
      mockWhere.mockResolvedValueOnce([])
      // 欲しいカード: card-1
      mockWhere.mockResolvedValueOnce([{ cardId: 'card-1' }])
      // 欲しいカードを持っているユーザー: なし
      mockWhere.mockResolvedValueOnce([])

      const result = await findMatches('user-1')

      expect(result.matches).toEqual([])
      expect(result.total).toBe(0)
    })

    it('マッチング候補が見つからない場合は空を返す', async () => {
      // 持っているカード: card-1
      mockWhere.mockResolvedValueOnce([{ cardId: 'card-1' }])
      // 欲しいカード: card-2
      mockWhere.mockResolvedValueOnce([{ cardId: 'card-2' }])
      // 欲しいカードを持っているユーザー: なし
      mockWhere.mockResolvedValueOnce([])
      // 自分のカードを欲しがっているユーザー: なし
      mockWhere.mockResolvedValueOnce([])

      const result = await findMatches('user-1')

      expect(result.matches).toEqual([])
      expect(result.total).toBe(0)
    })

    it('マッチング候補が見つかった場合は詳細を返す', async () => {
      // 持っているカード: card-1
      mockWhere.mockResolvedValueOnce([{ cardId: 'card-1' }])
      // 欲しいカード: card-2
      mockWhere.mockResolvedValueOnce([{ cardId: 'card-2' }])
      // 欲しいカードを持っているユーザー: user-2
      mockWhere.mockResolvedValueOnce([{ userId: 'user-2' }])
      // 自分のカードを欲しがっているユーザー: user-2
      mockWhere.mockResolvedValueOnce([{ userId: 'user-2' }])
      // 候補ユーザーの詳細
      mockWhere.mockResolvedValueOnce([
        {
          id: 'user-2',
          name: 'User 2',
          twitterUsername: 'user2',
          image: 'https://example.com/user2.png',
          trustGrade: 'A',
          trustScore: 75,
        },
      ])
      // 相手が持っていて自分が欲しいカード
      mockWhere.mockResolvedValueOnce([{ cardId: 'card-2', cardName: 'Card 2' }])
      // 自分が持っていて相手が欲しいカード
      mockWhere.mockResolvedValueOnce([{ cardId: 'card-1', cardName: 'Card 1' }])

      const result = await findMatches('user-1')

      expect(result.matches.length).toBe(1)
      expect(result.matches[0].user.id).toBe('user-2')
      expect(result.matches[0].theyHaveIWant.length).toBe(1)
      expect(result.matches[0].iHaveTheyWant.length).toBe(1)
      expect(result.matches[0].matchScore).toBe(2)
      expect(result.total).toBe(1)
    })

    it('limit と offset が適用される', async () => {
      // 持っているカード
      mockWhere.mockResolvedValueOnce([{ cardId: 'card-1' }])
      // 欲しいカード
      mockWhere.mockResolvedValueOnce([{ cardId: 'card-2' }])
      // 欲しいカードを持っているユーザー: user-2, user-3
      mockWhere.mockResolvedValueOnce([
        { userId: 'user-2' },
        { userId: 'user-3' },
      ])
      // 自分のカードを欲しがっているユーザー
      mockWhere.mockResolvedValueOnce([])
      // 候補ユーザーの詳細
      mockWhere.mockResolvedValueOnce([
        {
          id: 'user-2',
          name: 'User 2',
          twitterUsername: 'user2',
          image: null,
          trustGrade: 'B',
          trustScore: 50,
        },
        {
          id: 'user-3',
          name: 'User 3',
          twitterUsername: 'user3',
          image: null,
          trustGrade: 'A',
          trustScore: 70,
        },
      ])
      // user-2: theyHaveIWant
      mockWhere.mockResolvedValueOnce([{ cardId: 'card-2', cardName: 'Card 2' }])
      // user-2: iHaveTheyWant
      mockWhere.mockResolvedValueOnce([])
      // user-3: theyHaveIWant
      mockWhere.mockResolvedValueOnce([{ cardId: 'card-2', cardName: 'Card 2' }])
      // user-3: iHaveTheyWant
      mockWhere.mockResolvedValueOnce([])

      const result = await findMatches('user-1', { limit: 1, offset: 0 })

      expect(result.matches.length).toBe(1)
      expect(result.total).toBe(2)
    })

    it('minTrustGrade でフィルタリング', async () => {
      // 持っているカード
      mockWhere.mockResolvedValueOnce([{ cardId: 'card-1' }])
      // 欲しいカード
      mockWhere.mockResolvedValueOnce([{ cardId: 'card-2' }])
      // 欲しいカードを持っているユーザー
      mockWhere.mockResolvedValueOnce([{ userId: 'user-2' }])
      // 自分のカードを欲しがっているユーザー
      mockWhere.mockResolvedValueOnce([])
      // 候補ユーザーの詳細 (フィルタ後)
      mockWhere.mockResolvedValueOnce([])

      const result = await findMatches('user-1', { minTrustGrade: 'S' })

      // S グレード以上のユーザーがいないので空
      expect(result.matches).toEqual([])
      expect(result.total).toBe(0)
    })

    it('マッチスコアでソートされる', async () => {
      // 持っているカード
      mockWhere.mockResolvedValueOnce([
        { cardId: 'card-1' },
        { cardId: 'card-2' },
      ])
      // 欲しいカード
      mockWhere.mockResolvedValueOnce([
        { cardId: 'card-3' },
        { cardId: 'card-4' },
      ])
      // 欲しいカードを持っているユーザー
      mockWhere.mockResolvedValueOnce([
        { userId: 'user-2' },
        { userId: 'user-3' },
      ])
      // 自分のカードを欲しがっているユーザー
      mockWhere.mockResolvedValueOnce([])
      // 候補ユーザーの詳細
      mockWhere.mockResolvedValueOnce([
        {
          id: 'user-2',
          name: 'User 2',
          twitterUsername: 'user2',
          image: null,
          trustGrade: 'B',
          trustScore: 50,
        },
        {
          id: 'user-3',
          name: 'User 3',
          twitterUsername: 'user3',
          image: null,
          trustGrade: 'A',
          trustScore: 70,
        },
      ])
      // user-2: theyHaveIWant (1 card)
      mockWhere.mockResolvedValueOnce([{ cardId: 'card-3', cardName: 'Card 3' }])
      // user-2: iHaveTheyWant
      mockWhere.mockResolvedValueOnce([])
      // user-3: theyHaveIWant (2 cards - higher score)
      mockWhere.mockResolvedValueOnce([
        { cardId: 'card-3', cardName: 'Card 3' },
        { cardId: 'card-4', cardName: 'Card 4' },
      ])
      // user-3: iHaveTheyWant
      mockWhere.mockResolvedValueOnce([])

      const result = await findMatches('user-1')

      // user-3 が先（スコア2）、user-2 が後（スコア1）
      expect(result.matches[0].user.id).toBe('user-3')
      expect(result.matches[0].matchScore).toBe(2)
      expect(result.matches[1].user.id).toBe('user-2')
      expect(result.matches[1].matchScore).toBe(1)
    })
  })
})
