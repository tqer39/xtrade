import { beforeEach, describe, expect, it, vi } from 'vitest';

// DB モック
const _mockSelect = vi.fn();
const _mockInsert = vi.fn();
const _mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
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
  trade: {
    id: 'trade.id',
    roomSlug: 'trade.roomSlug',
    initiatorUserId: 'trade.initiatorUserId',
    responderUserId: 'trade.responderUserId',
    status: 'trade.status',
    proposedExpiredAt: 'trade.proposedExpiredAt',
    agreedExpiredAt: 'trade.agreedExpiredAt',
    createdAt: 'trade.createdAt',
    updatedAt: 'trade.updatedAt',
  },
  tradeItem: {
    id: 'tradeItem.id',
    tradeId: 'tradeItem.tradeId',
    offeredByUserId: 'tradeItem.offeredByUserId',
    cardId: 'tradeItem.cardId',
    quantity: 'tradeItem.quantity',
    createdAt: 'tradeItem.createdAt',
  },
  tradeHistory: {
    id: 'tradeHistory.id',
    tradeId: 'tradeHistory.tradeId',
    fromStatus: 'tradeHistory.fromStatus',
    toStatus: 'tradeHistory.toStatus',
    changedByUserId: 'tradeHistory.changedByUserId',
    reason: 'tradeHistory.reason',
    createdAt: 'tradeHistory.createdAt',
  },
  user: {
    id: 'user.id',
    name: 'user.name',
    twitterUsername: 'user.twitterUsername',
    image: 'user.image',
    trustGrade: 'user.trustGrade',
  },
  card: {
    id: 'card.id',
    name: 'card.name',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
  and: vi.fn((...args) => ({ type: 'and', conditions: args })),
}));

// モック後にインポート
const {
  createTrade,
  getTradeByRoomSlug,
  getTradeDetail,
  updateOffer,
  transitionTrade,
  setResponder,
} = await import('../service');
const { TradeTransitionError } = await import('../types');

describe('trades/service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // デフォルトのチェーンモック設定
    mockFrom.mockReturnValue({
      where: mockWhere,
      innerJoin: mockInnerJoin,
    });
    mockWhere.mockReturnValue({
      limit: mockLimit,
      orderBy: vi.fn().mockReturnValue({
        limit: mockLimit,
      }),
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

  describe('createTrade', () => {
    it('新しいトレードを作成', async () => {
      const result = await createTrade('user-1');

      expect(result.initiatorUserId).toBe('user-1');
      expect(result.status).toBe('draft');
      expect(result.responderUserId).toBeNull();
      expect(result.id).toBeDefined();
      expect(result.roomSlug).toBeDefined();
      expect(mockValues).toHaveBeenCalledTimes(2); // trade + history
    });

    it('応答者を指定して作成', async () => {
      const result = await createTrade('user-1', {
        responderUserId: 'user-2',
      });

      expect(result.responderUserId).toBe('user-2');
    });

    it('期限を指定して作成', async () => {
      const expiredAt = new Date('2099-01-01');
      const result = await createTrade('user-1', {
        proposedExpiredAt: expiredAt,
      });

      expect(result.proposedExpiredAt).toEqual(expiredAt);
    });
  });

  describe('getTradeByRoomSlug', () => {
    it('存在するトレードを取得', async () => {
      const mockTrade = {
        id: 'trade-1',
        roomSlug: 'abc123',
        initiatorUserId: 'user-1',
        responderUserId: 'user-2',
        status: 'draft',
        proposedExpiredAt: null,
        agreedExpiredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockLimit.mockResolvedValue([mockTrade]);

      const result = await getTradeByRoomSlug('abc123');

      expect(result).not.toBeNull();
      expect(result?.roomSlug).toBe('abc123');
      expect(result?.status).toBe('draft');
    });

    it('存在しないトレードは null を返す', async () => {
      mockLimit.mockResolvedValue([]);

      const result = await getTradeByRoomSlug('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getTradeDetail', () => {
    it('存在しないトレードは null を返す', async () => {
      mockLimit.mockResolvedValue([]);

      const result = await getTradeDetail('non-existent');

      expect(result).toBeNull();
    });

    it('開始者情報がない場合は null を返す', async () => {
      // トレードあり
      mockLimit.mockResolvedValueOnce([
        {
          id: 'trade-1',
          roomSlug: 'abc123',
          initiatorUserId: 'user-1',
          responderUserId: null,
          status: 'draft',
          proposedExpiredAt: null,
          agreedExpiredAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      // 開始者なし
      mockLimit.mockResolvedValueOnce([]);

      const result = await getTradeDetail('abc123');

      expect(result).toBeNull();
    });

    // getTradeDetail の詳細テストは複雑なDB結合が必要なため、
    // 統合テストで行う（ここでは基本的なnullチェックのみテスト）
  });

  describe('updateOffer', () => {
    it('参加者以外はエラー', async () => {
      const trade = {
        id: 'trade-1',
        roomSlug: 'abc123',
        initiatorUserId: 'user-1',
        responderUserId: 'user-2',
        status: 'draft' as const,
        statusBeforeCancel: null,
        proposedExpiredAt: null,
        agreedExpiredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(updateOffer(trade, 'user-3', { items: [] })).rejects.toThrow(
        TradeTransitionError
      );
    });

    it('draft 状態でオファー更新可能', async () => {
      const trade = {
        id: 'trade-1',
        roomSlug: 'abc123',
        initiatorUserId: 'user-1',
        responderUserId: 'user-2',
        status: 'draft' as const,
        statusBeforeCancel: null,
        proposedExpiredAt: null,
        agreedExpiredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(updateOffer(trade, 'user-1', { items: [] })).resolves.not.toThrow();

      expect(mockDelete).toHaveBeenCalled();
    });

    it('proposed 状態ではオファー更新不可', async () => {
      const trade = {
        id: 'trade-1',
        roomSlug: 'abc123',
        initiatorUserId: 'user-1',
        responderUserId: 'user-2',
        status: 'proposed' as const,
        statusBeforeCancel: null,
        proposedExpiredAt: null,
        agreedExpiredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(updateOffer(trade, 'user-1', { items: [] })).rejects.toThrow(
        TradeTransitionError
      );
    });

    it('agreed 状態ではオファー更新不可', async () => {
      const trade = {
        id: 'trade-1',
        roomSlug: 'abc123',
        initiatorUserId: 'user-1',
        responderUserId: 'user-2',
        status: 'agreed' as const,
        statusBeforeCancel: null,
        proposedExpiredAt: null,
        agreedExpiredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(updateOffer(trade, 'user-1', { items: [] })).rejects.toThrow(
        TradeTransitionError
      );
    });

    it('アイテムを追加', async () => {
      const trade = {
        id: 'trade-1',
        roomSlug: 'abc123',
        initiatorUserId: 'user-1',
        responderUserId: 'user-2',
        status: 'draft' as const,
        statusBeforeCancel: null,
        proposedExpiredAt: null,
        agreedExpiredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await updateOffer(trade, 'user-1', {
        items: [
          { cardId: 'card-1', quantity: 2 },
          { cardId: 'card-2', quantity: 1 },
        ],
      });

      expect(mockValues).toHaveBeenCalled();
    });
  });

  describe('transitionTrade', () => {
    it('draft から proposed への遷移', async () => {
      const trade = {
        id: 'trade-1',
        roomSlug: 'abc123',
        initiatorUserId: 'user-1',
        responderUserId: 'user-2',
        status: 'draft' as const,
        statusBeforeCancel: null,
        proposedExpiredAt: null,
        agreedExpiredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await transitionTrade(trade, 'proposed', 'user-1');

      expect(mockSet).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled(); // history
    });

    it('agreed への遷移時に期限を設定', async () => {
      const trade = {
        id: 'trade-1',
        roomSlug: 'abc123',
        initiatorUserId: 'user-1',
        responderUserId: 'user-2',
        status: 'proposed' as const,
        statusBeforeCancel: null,
        proposedExpiredAt: null,
        agreedExpiredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const agreedExpiredAt = new Date('2099-01-01');

      await transitionTrade(trade, 'agreed', 'user-2', { agreedExpiredAt });

      expect(mockSet).toHaveBeenCalled();
    });

    it('キャンセル時に理由を記録', async () => {
      const trade = {
        id: 'trade-1',
        roomSlug: 'abc123',
        initiatorUserId: 'user-1',
        responderUserId: 'user-2',
        status: 'proposed' as const,
        statusBeforeCancel: null,
        proposedExpiredAt: null,
        agreedExpiredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await transitionTrade(trade, 'canceled', 'user-1', {
        reason: 'Changed my mind',
      });

      expect(mockValues).toHaveBeenCalled();
    });
  });

  describe('setResponder', () => {
    it('応答者を設定', async () => {
      const trade = {
        id: 'trade-1',
        roomSlug: 'abc123',
        initiatorUserId: 'user-1',
        responderUserId: null,
        status: 'draft' as const,
        statusBeforeCancel: null,
        proposedExpiredAt: null,
        agreedExpiredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setResponder(trade, 'user-2');

      expect(mockSet).toHaveBeenCalled();
    });

    it('既に応答者がいる場合はエラー', async () => {
      const trade = {
        id: 'trade-1',
        roomSlug: 'abc123',
        initiatorUserId: 'user-1',
        responderUserId: 'user-2',
        status: 'draft' as const,
        statusBeforeCancel: null,
        proposedExpiredAt: null,
        agreedExpiredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(setResponder(trade, 'user-3')).rejects.toThrow(TradeTransitionError);
    });

    it('開始者と同じユーザーを応答者にはできない', async () => {
      const trade = {
        id: 'trade-1',
        roomSlug: 'abc123',
        initiatorUserId: 'user-1',
        responderUserId: null,
        status: 'draft' as const,
        statusBeforeCancel: null,
        proposedExpiredAt: null,
        agreedExpiredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(setResponder(trade, 'user-1')).rejects.toThrow(TradeTransitionError);
    });
  });
});
