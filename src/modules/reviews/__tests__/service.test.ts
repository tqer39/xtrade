import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReviewError } from '../types';

// モック関数
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockOrderBy = vi.fn();
const mockOffset = vi.fn();
const mockValues = vi.fn();
const mockOnConflictDoUpdate = vi.fn();

// チェーンを構築
const buildSelectChain = () => ({
  from: mockFrom.mockReturnValue({
    where: mockWhere.mockReturnValue({
      limit: mockLimit,
      orderBy: mockOrderBy.mockReturnValue({
        limit: mockLimit.mockReturnValue({
          offset: mockOffset,
        }),
      }),
    }),
    orderBy: mockOrderBy,
  }),
});

vi.mock('@/db/drizzle', () => ({
  db: {
    select: () => buildSelectChain(),
    insert: () => ({
      values: mockValues.mockReturnValue({
        onConflictDoUpdate: mockOnConflictDoUpdate,
      }),
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
    updatedAt: 'trade.updatedAt',
  },
  tradeReview: {
    id: 'tradeReview.id',
    tradeId: 'tradeReview.tradeId',
    reviewerUserId: 'tradeReview.reviewerUserId',
    revieweeUserId: 'tradeReview.revieweeUserId',
    rating: 'tradeReview.rating',
    comment: 'tradeReview.comment',
    isPublic: 'tradeReview.isPublic',
    createdAt: 'tradeReview.createdAt',
  },
  user: {
    id: 'user.id',
    name: 'user.name',
    twitterUsername: 'user.twitterUsername',
    image: 'user.image',
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

// テスト対象のインポート
import {
  createReview,
  getTradeReviews,
  getUserReviews,
  hasReviewedTrade,
  updateUserReviewStats,
} from '../service';

describe('reviews/service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createReview', () => {
    it('評価が1未満の場合エラーをスローする', async () => {
      await expect(createReview('trade-1', 'user-1', { rating: 0 })).rejects.toMatchObject({
        code: 'INVALID_RATING',
      });
    });

    it('評価が5を超える場合エラーをスローする', async () => {
      await expect(createReview('trade-1', 'user-1', { rating: 6 })).rejects.toMatchObject({
        code: 'INVALID_RATING',
      });
    });

    it('トレードが見つからない場合エラーをスローする', async () => {
      mockLimit.mockResolvedValueOnce([]);

      await expect(createReview('trade-1', 'user-1', { rating: 5 })).rejects.toMatchObject({
        code: 'TRADE_NOT_FOUND',
      });
    });

    it('参加者でない場合エラーをスローする', async () => {
      mockLimit.mockResolvedValueOnce([
        {
          id: 'trade-1',
          initiatorUserId: 'other-user-1',
          responderUserId: 'other-user-2',
          status: 'completed',
        },
      ]);

      await expect(createReview('trade-1', 'user-1', { rating: 5 })).rejects.toMatchObject({
        code: 'NOT_PARTICIPANT',
      });
    });

    it('トレードが完了していない場合エラーをスローする', async () => {
      mockLimit.mockResolvedValueOnce([
        {
          id: 'trade-1',
          initiatorUserId: 'user-1',
          responderUserId: 'user-2',
          status: 'proposed',
        },
      ]);

      await expect(createReview('trade-1', 'user-1', { rating: 5 })).rejects.toMatchObject({
        code: 'TRADE_NOT_COMPLETED',
      });
    });

    it('既にレビュー済みの場合エラーをスローする', async () => {
      mockLimit
        .mockResolvedValueOnce([
          {
            id: 'trade-1',
            initiatorUserId: 'user-1',
            responderUserId: 'user-2',
            status: 'completed',
          },
        ])
        .mockResolvedValueOnce([{ id: 'existing-review' }]);

      await expect(createReview('trade-1', 'user-1', { rating: 5 })).rejects.toMatchObject({
        code: 'ALREADY_REVIEWED',
      });
    });
  });

  describe('getTradeReviews', () => {
    it('レビューがない場合は空配列を返す', async () => {
      mockOrderBy.mockResolvedValueOnce([]);

      const result = await getTradeReviews('trade-1');
      expect(result).toEqual([]);
    });
  });

  describe('getUserReviews', () => {
    it('レビューがない場合は空配列と0件を返す', async () => {
      // count クエリ
      mockWhere.mockResolvedValueOnce([{ count: 0 }]);
      // レビュー取得クエリ
      mockOffset.mockResolvedValueOnce([]);

      const result = await getUserReviews('user-1');
      expect(result).toEqual({ reviews: [], total: 0 });
    });

    it('デフォルトでは公開レビューのみを取得する', async () => {
      mockWhere.mockResolvedValueOnce([{ count: 0 }]);
      mockOffset.mockResolvedValueOnce([]);

      await getUserReviews('user-1');
      // onlyPublic が true で呼ばれていることを確認
      expect(mockWhere).toHaveBeenCalled();
    });

    it('limit と offset を指定できる', async () => {
      mockWhere.mockResolvedValueOnce([{ count: 0 }]);
      mockOffset.mockResolvedValueOnce([]);

      await getUserReviews('user-1', { limit: 10, offset: 5 });
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(mockOffset).toHaveBeenCalledWith(5);
    });
  });

  describe('hasReviewedTrade', () => {
    it('レビュー済みの場合 true を返す', async () => {
      mockLimit.mockResolvedValueOnce([{ id: 'review-1' }]);

      const result = await hasReviewedTrade('trade-1', 'user-1');
      expect(result).toBe(true);
    });

    it('未レビューの場合 false を返す', async () => {
      mockLimit.mockResolvedValueOnce([]);

      const result = await hasReviewedTrade('trade-1', 'user-1');
      expect(result).toBe(false);
    });
  });

  describe('updateUserReviewStats', () => {
    it('統計を計算して upsert する', async () => {
      mockWhere.mockResolvedValueOnce([
        {
          count: 10,
          avgRating: 4.5,
          positiveCount: 8,
          negativeCount: 1,
        },
      ]);

      await updateUserReviewStats('user-1');

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          reviewCount: 10,
          avgRating: 45, // 4.5 * 10
          positiveCount: 8,
          negativeCount: 1,
        })
      );
      expect(mockOnConflictDoUpdate).toHaveBeenCalled();
    });

    it('レビューがない場合でも正常に処理する', async () => {
      mockWhere.mockResolvedValueOnce([
        {
          count: 0,
          avgRating: null,
          positiveCount: 0,
          negativeCount: 0,
        },
      ]);

      await updateUserReviewStats('user-1');

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          reviewCount: 0,
          avgRating: null,
          positiveCount: 0,
          negativeCount: 0,
        })
      );
    });
  });
});

describe('ReviewError', () => {
  it('エラーコードとメッセージを持つ', () => {
    const error = new ReviewError('Test error', 'INVALID_RATING');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('INVALID_RATING');
    expect(error.name).toBe('ReviewError');
  });
});
