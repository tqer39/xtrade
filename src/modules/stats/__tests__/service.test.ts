import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック関数
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockInnerJoin = vi.fn();
const mockValues = vi.fn();
const mockOnConflictDoUpdate = vi.fn();

vi.mock('@/db/drizzle', () => ({
  db: {
    select: () => ({
      from: mockFrom.mockReturnValue({
        where: mockWhere.mockReturnValue({
          limit: mockLimit,
        }),
        innerJoin: mockInnerJoin.mockReturnValue({
          where: mockWhere,
        }),
      }),
    }),
    insert: () => ({
      values: mockValues.mockReturnValue({
        onConflictDoUpdate: mockOnConflictDoUpdate,
      }),
    }),
  },
}));

vi.mock('@/db/schema', () => ({
  user: {
    id: 'user.id',
  },
  trade: {
    id: 'trade.id',
    initiatorUserId: 'trade.initiatorUserId',
    responderUserId: 'trade.responderUserId',
    status: 'trade.status',
    createdAt: 'trade.createdAt',
    updatedAt: 'trade.updatedAt',
  },
  tradeHistory: {
    id: 'tradeHistory.id',
    tradeId: 'tradeHistory.tradeId',
    toStatus: 'tradeHistory.toStatus',
    createdAt: 'tradeHistory.createdAt',
  },
  userTradeStats: {
    userId: 'userTradeStats.userId',
    completedCount: 'userTradeStats.completedCount',
    canceledCount: 'userTradeStats.canceledCount',
    disputedCount: 'userTradeStats.disputedCount',
    avgResponseTimeHours: 'userTradeStats.avgResponseTimeHours',
    firstTradeAt: 'userTradeStats.firstTradeAt',
    lastTradeAt: 'userTradeStats.lastTradeAt',
    updatedAt: 'userTradeStats.updatedAt',
  },
  userReviewStats: {
    userId: 'userReviewStats.userId',
    reviewCount: 'userReviewStats.reviewCount',
    avgRating: 'userReviewStats.avgRating',
    positiveCount: 'userReviewStats.positiveCount',
    negativeCount: 'userReviewStats.negativeCount',
    updatedAt: 'userReviewStats.updatedAt',
  },
}));

import { getUserStats, recalculateAllStats, updateUserTradeStats } from '../service';

describe('stats/service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateUserTradeStats', () => {
    it('トレード統計を計算して upsert する', async () => {
      // トレード統計クエリ
      mockWhere.mockResolvedValueOnce([
        {
          completedCount: 5,
          canceledCount: 1,
          disputedCount: 0,
          firstTradeAt: new Date('2024-01-01'),
          lastTradeAt: new Date('2024-12-01'),
        },
      ]);
      // 平均応答時間クエリ
      mockWhere.mockResolvedValueOnce([{ avgHours: 24.5 }]);

      await updateUserTradeStats('user-1');

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          completedCount: 5,
          canceledCount: 1,
          disputedCount: 0,
          avgResponseTimeHours: 25, // 四捨五入
        })
      );
      expect(mockOnConflictDoUpdate).toHaveBeenCalled();
    });

    it('トレードがない場合は0で初期化する', async () => {
      mockWhere.mockResolvedValueOnce([
        {
          completedCount: null,
          canceledCount: null,
          disputedCount: null,
          firstTradeAt: null,
          lastTradeAt: null,
        },
      ]);
      mockWhere.mockResolvedValueOnce([{ avgHours: null }]);

      await updateUserTradeStats('user-1');

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          completedCount: 0,
          canceledCount: 0,
          disputedCount: 0,
          avgResponseTimeHours: null,
        })
      );
    });
  });

  describe('getUserStats', () => {
    it('トレード統計とレビュー統計を返す', async () => {
      const tradeStat = {
        userId: 'user-1',
        completedCount: 10,
        canceledCount: 2,
        disputedCount: 1,
        avgResponseTimeHours: 12,
        firstTradeAt: new Date('2024-01-01'),
        lastTradeAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-06'),
      };

      const reviewStat = {
        userId: 'user-1',
        reviewCount: 8,
        avgRating: 45, // 4.5 * 10
        positiveCount: 7,
        negativeCount: 0,
        updatedAt: new Date('2024-12-06'),
      };

      mockLimit.mockResolvedValueOnce([tradeStat]).mockResolvedValueOnce([reviewStat]);

      const result = await getUserStats('user-1');

      expect(result.trade).toMatchObject({
        userId: 'user-1',
        completedCount: 10,
        canceledCount: 2,
        disputedCount: 1,
        avgResponseTimeHours: 12,
      });

      expect(result.review).toMatchObject({
        userId: 'user-1',
        reviewCount: 8,
        avgRating: 4.5, // 10で割った値
        positiveCount: 7,
        negativeCount: 0,
      });
    });

    it('統計がない場合は null を返す', async () => {
      mockLimit.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const result = await getUserStats('user-1');

      expect(result.trade).toBeNull();
      expect(result.review).toBeNull();
    });

    it('avgRating が null の場合は null を返す', async () => {
      const reviewStat = {
        userId: 'user-1',
        reviewCount: 0,
        avgRating: null,
        positiveCount: 0,
        negativeCount: 0,
        updatedAt: new Date('2024-12-06'),
      };

      mockLimit.mockResolvedValueOnce([]).mockResolvedValueOnce([reviewStat]);

      const result = await getUserStats('user-1');

      expect(result.review?.avgRating).toBeNull();
    });
  });

  describe('recalculateAllStats', () => {
    it('全ユーザーの統計を再計算する', async () => {
      // ユーザー一覧
      mockFrom.mockResolvedValueOnce([{ id: 'user-1' }, { id: 'user-2' }]);

      // 各ユーザーの updateUserTradeStats 用モック
      mockWhere
        .mockResolvedValueOnce([{ completedCount: 0 }])
        .mockResolvedValueOnce([{ avgHours: null }])
        .mockResolvedValueOnce([{ completedCount: 0 }])
        .mockResolvedValueOnce([{ avgHours: null }]);

      // reviews モジュールのモック
      vi.doMock('@/modules/reviews', () => ({
        updateUserReviewStats: vi.fn().mockResolvedValue(undefined),
      }));

      const result = await recalculateAllStats();

      expect(result.tradeStatsUpdated).toBe(2);
      expect(result.reviewStatsUpdated).toBe(2);
    });
  });
});
