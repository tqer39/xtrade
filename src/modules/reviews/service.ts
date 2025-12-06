import { randomUUID } from 'node:crypto';
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import type { CreateReviewInput, PendingReviewTrade, Review } from './types';
import { ReviewError } from './types';

/**
 * レビューを作成する
 */
export async function createReview(
  tradeId: string,
  reviewerUserId: string,
  input: CreateReviewInput
): Promise<Review> {
  // バリデーション: 評価は1-5
  if (input.rating < 1 || input.rating > 5) {
    throw new ReviewError('Rating must be between 1 and 5', 'INVALID_RATING');
  }

  // トレードを取得
  const trades = await db.select().from(schema.trade).where(eq(schema.trade.id, tradeId)).limit(1);

  const trade = trades[0];
  if (!trade) {
    throw new ReviewError('Trade not found', 'TRADE_NOT_FOUND');
  }

  // 参加者チェック
  const isInitiator = trade.initiatorUserId === reviewerUserId;
  const isResponder = trade.responderUserId === reviewerUserId;
  if (!isInitiator && !isResponder) {
    throw new ReviewError('You are not a participant in this trade', 'NOT_PARTICIPANT');
  }

  // トレードが completed 状態かチェック
  if (trade.status !== 'completed') {
    throw new ReviewError('Trade is not completed', 'TRADE_NOT_COMPLETED');
  }

  // レビュー対象ユーザーを決定
  const revieweeUserId = isInitiator ? trade.responderUserId : trade.initiatorUserId;
  if (!revieweeUserId) {
    throw new ReviewError('Reviewee not found', 'TRADE_NOT_FOUND');
  }

  // 既にレビュー済みかチェック
  const existingReviews = await db
    .select()
    .from(schema.tradeReview)
    .where(
      and(
        eq(schema.tradeReview.tradeId, tradeId),
        eq(schema.tradeReview.reviewerUserId, reviewerUserId)
      )
    )
    .limit(1);

  if (existingReviews[0]) {
    throw new ReviewError('You have already reviewed this trade', 'ALREADY_REVIEWED');
  }

  // レビューを作成
  const newReview = {
    id: randomUUID(),
    tradeId,
    reviewerUserId,
    revieweeUserId,
    rating: input.rating,
    comment: input.comment ?? null,
    isPublic: input.isPublic ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(schema.tradeReview).values(newReview);

  // レビュー統計を更新
  await updateUserReviewStats(revieweeUserId);

  // ユーザー情報を取得してレスポンスを構築
  const [reviewerUsers, revieweeUsers] = await Promise.all([
    db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        twitterUsername: schema.user.twitterUsername,
        image: schema.user.image,
      })
      .from(schema.user)
      .where(eq(schema.user.id, reviewerUserId))
      .limit(1),
    db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        twitterUsername: schema.user.twitterUsername,
        image: schema.user.image,
      })
      .from(schema.user)
      .where(eq(schema.user.id, revieweeUserId))
      .limit(1),
  ]);

  const reviewer = reviewerUsers[0];
  const reviewee = revieweeUsers[0];

  if (!reviewer || !reviewee) {
    throw new ReviewError('User not found', 'TRADE_NOT_FOUND');
  }

  return {
    id: newReview.id,
    tradeId: newReview.tradeId,
    reviewer,
    reviewee,
    rating: newReview.rating,
    comment: newReview.comment,
    isPublic: newReview.isPublic,
    createdAt: newReview.createdAt.toISOString(),
  };
}

/**
 * トレードのレビュー一覧を取得
 */
export async function getTradeReviews(tradeId: string): Promise<Review[]> {
  const reviews = await db
    .select({
      id: schema.tradeReview.id,
      tradeId: schema.tradeReview.tradeId,
      reviewerUserId: schema.tradeReview.reviewerUserId,
      revieweeUserId: schema.tradeReview.revieweeUserId,
      rating: schema.tradeReview.rating,
      comment: schema.tradeReview.comment,
      isPublic: schema.tradeReview.isPublic,
      createdAt: schema.tradeReview.createdAt,
    })
    .from(schema.tradeReview)
    .where(eq(schema.tradeReview.tradeId, tradeId))
    .orderBy(desc(schema.tradeReview.createdAt));

  if (reviews.length === 0) {
    return [];
  }

  // ユーザー情報を取得
  const userIds = [...new Set(reviews.flatMap((r) => [r.reviewerUserId, r.revieweeUserId]))];
  const users = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      twitterUsername: schema.user.twitterUsername,
      image: schema.user.image,
    })
    .from(schema.user)
    .where(inArray(schema.user.id, userIds));

  const userMap = new Map(users.map((u) => [u.id, u]));

  return reviews.map((review) => {
    const reviewer = userMap.get(review.reviewerUserId);
    const reviewee = userMap.get(review.revieweeUserId);

    return {
      id: review.id,
      tradeId: review.tradeId,
      reviewer: reviewer ?? {
        id: review.reviewerUserId,
        name: 'Unknown',
        twitterUsername: null,
        image: null,
      },
      reviewee: reviewee ?? {
        id: review.revieweeUserId,
        name: 'Unknown',
        twitterUsername: null,
        image: null,
      },
      rating: review.rating,
      comment: review.comment,
      isPublic: review.isPublic,
      createdAt: review.createdAt.toISOString(),
    };
  });
}

/**
 * ユーザーが受けたレビュー一覧を取得
 */
export async function getUserReviews(
  userId: string,
  options: { onlyPublic?: boolean; limit?: number; offset?: number } = {}
): Promise<{ reviews: Review[]; total: number }> {
  const { onlyPublic = true, limit = 20, offset = 0 } = options;

  // 条件を構築
  const conditions = [eq(schema.tradeReview.revieweeUserId, userId)];
  if (onlyPublic) {
    conditions.push(eq(schema.tradeReview.isPublic, true));
  }

  // 件数を取得
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.tradeReview)
    .where(and(...conditions));

  const total = Number(countResult[0]?.count ?? 0);

  // レビューを取得
  const reviews = await db
    .select({
      id: schema.tradeReview.id,
      tradeId: schema.tradeReview.tradeId,
      reviewerUserId: schema.tradeReview.reviewerUserId,
      revieweeUserId: schema.tradeReview.revieweeUserId,
      rating: schema.tradeReview.rating,
      comment: schema.tradeReview.comment,
      isPublic: schema.tradeReview.isPublic,
      createdAt: schema.tradeReview.createdAt,
    })
    .from(schema.tradeReview)
    .where(and(...conditions))
    .orderBy(desc(schema.tradeReview.createdAt))
    .limit(limit)
    .offset(offset);

  if (reviews.length === 0) {
    return { reviews: [], total };
  }

  // ユーザー情報を取得
  const userIds = [...new Set(reviews.flatMap((r) => [r.reviewerUserId, r.revieweeUserId]))];
  const users = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      twitterUsername: schema.user.twitterUsername,
      image: schema.user.image,
    })
    .from(schema.user)
    .where(inArray(schema.user.id, userIds));

  const userMap = new Map(users.map((u) => [u.id, u]));

  const mappedReviews = reviews.map((review) => {
    const reviewer = userMap.get(review.reviewerUserId);
    const reviewee = userMap.get(review.revieweeUserId);

    return {
      id: review.id,
      tradeId: review.tradeId,
      reviewer: reviewer ?? {
        id: review.reviewerUserId,
        name: 'Unknown',
        twitterUsername: null,
        image: null,
      },
      reviewee: reviewee ?? {
        id: review.revieweeUserId,
        name: 'Unknown',
        twitterUsername: null,
        image: null,
      },
      rating: review.rating,
      comment: review.comment,
      isPublic: review.isPublic,
      createdAt: review.createdAt.toISOString(),
    };
  });

  return { reviews: mappedReviews, total };
}

/**
 * レビュー待ちトレード一覧を取得
 */
export async function getPendingReviewTrades(userId: string): Promise<PendingReviewTrade[]> {
  // 完了したトレードで、自分がレビューしていないものを取得
  const completedTrades = await db
    .select({
      id: schema.trade.id,
      roomSlug: schema.trade.roomSlug,
      initiatorUserId: schema.trade.initiatorUserId,
      responderUserId: schema.trade.responderUserId,
      updatedAt: schema.trade.updatedAt,
    })
    .from(schema.trade)
    .where(
      and(
        eq(schema.trade.status, 'completed'),
        or(eq(schema.trade.initiatorUserId, userId), eq(schema.trade.responderUserId, userId))
      )
    )
    .orderBy(desc(schema.trade.updatedAt));

  if (completedTrades.length === 0) {
    return [];
  }

  // 自分が既にレビューしたトレードIDを取得
  const reviewedTradeIds = await db
    .select({ tradeId: schema.tradeReview.tradeId })
    .from(schema.tradeReview)
    .where(eq(schema.tradeReview.reviewerUserId, userId));

  const reviewedSet = new Set(reviewedTradeIds.map((r) => r.tradeId));

  // 未レビューのトレードをフィルタ
  const pendingTrades = completedTrades.filter((t) => !reviewedSet.has(t.id));

  if (pendingTrades.length === 0) {
    return [];
  }

  // 相手ユーザー情報を取得
  const otherUserIds = pendingTrades.map((t) =>
    t.initiatorUserId === userId ? t.responderUserId : t.initiatorUserId
  );
  const validOtherUserIds = otherUserIds.filter((id): id is string => id !== null);

  const otherUsers = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      twitterUsername: schema.user.twitterUsername,
      image: schema.user.image,
    })
    .from(schema.user)
    .where(inArray(schema.user.id, validOtherUserIds));

  const userMap = new Map(otherUsers.map((u) => [u.id, u]));

  return pendingTrades
    .map((trade) => {
      const otherUserId =
        trade.initiatorUserId === userId ? trade.responderUserId : trade.initiatorUserId;
      if (!otherUserId) return null;

      const otherUser = userMap.get(otherUserId);
      if (!otherUser) return null;

      return {
        tradeId: trade.id,
        roomSlug: trade.roomSlug,
        otherUser,
        completedAt: trade.updatedAt.toISOString(),
      };
    })
    .filter((t): t is PendingReviewTrade => t !== null);
}

/**
 * ユーザーのレビュー統計を更新
 */
export async function updateUserReviewStats(userId: string): Promise<void> {
  // レビュー統計を計算
  const stats = await db
    .select({
      count: sql<number>`count(*)`,
      avgRating: sql<number>`avg(rating)`,
      positiveCount: sql<number>`sum(case when rating >= 4 then 1 else 0 end)`,
      negativeCount: sql<number>`sum(case when rating <= 2 then 1 else 0 end)`,
    })
    .from(schema.tradeReview)
    .where(eq(schema.tradeReview.revieweeUserId, userId));

  const stat = stats[0];
  const reviewCount = Number(stat?.count ?? 0);
  const avgRating = stat?.avgRating ? Math.round(stat.avgRating * 10) : null; // 小数点1桁を保持
  const positiveCount = Number(stat?.positiveCount ?? 0);
  const negativeCount = Number(stat?.negativeCount ?? 0);

  // upsert
  await db
    .insert(schema.userReviewStats)
    .values({
      userId,
      reviewCount,
      avgRating,
      positiveCount,
      negativeCount,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.userReviewStats.userId,
      set: {
        reviewCount,
        avgRating,
        positiveCount,
        negativeCount,
        updatedAt: new Date(),
      },
    });
}

/**
 * トレードに対して自分がレビュー済みかチェック
 */
export async function hasReviewedTrade(tradeId: string, userId: string): Promise<boolean> {
  const reviews = await db
    .select({ id: schema.tradeReview.id })
    .from(schema.tradeReview)
    .where(
      and(eq(schema.tradeReview.tradeId, tradeId), eq(schema.tradeReview.reviewerUserId, userId))
    )
    .limit(1);

  return reviews.length > 0;
}
