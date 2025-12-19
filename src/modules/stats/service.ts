import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import { calcRecentTradeScore, calcTotalTradeScore } from '@/modules/trust';
import type { UserStats } from './types';

/**
 * ユーザーのトレード統計を更新
 */
export async function updateUserTradeStats(userId: string): Promise<void> {
  // トレード統計を計算
  const stats = await db
    .select({
      completedCount: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
      canceledCount: sql<number>`sum(case when status = 'canceled' then 1 else 0 end)`,
      disputedCount: sql<number>`sum(case when status = 'disputed' then 1 else 0 end)`,
      firstTradeAt: sql<Date | null>`min(created_at)`,
      lastTradeAt: sql<Date | null>`max(updated_at)`,
    })
    .from(schema.trade)
    .where(
      and(
        or(eq(schema.trade.initiatorUserId, userId), eq(schema.trade.responderUserId, userId)),
        inArray(schema.trade.status, ['completed', 'canceled', 'disputed'])
      )
    );

  const stat = stats[0];
  const completedCount = Number(stat?.completedCount ?? 0);
  const canceledCount = Number(stat?.canceledCount ?? 0);
  const disputedCount = Number(stat?.disputedCount ?? 0);
  const firstTradeAt = stat?.firstTradeAt ?? null;
  const lastTradeAt = stat?.lastTradeAt ?? null;

  // 平均応答時間を計算（proposed → agreed の時間）
  const responseTimes = await db
    .select({
      avgHours: sql<number>`
        avg(
          extract(epoch from (
            select min(h2.created_at)
            from trade_history h2
            where h2.trade_id = trade_history.trade_id and h2.to_status = 'agreed'
          ) - (
            select min(h1.created_at)
            from trade_history h1
            where h1.trade_id = trade_history.trade_id and h1.to_status = 'proposed'
          )) / 3600
        )
      `,
    })
    .from(schema.tradeHistory)
    .innerJoin(schema.trade, eq(schema.tradeHistory.tradeId, schema.trade.id))
    .where(
      and(
        eq(schema.trade.status, 'completed'),
        eq(schema.trade.responderUserId, userId), // 応答者としての応答時間
        eq(schema.tradeHistory.toStatus, 'agreed')
      )
    );

  const avgResponseTimeHours = responseTimes[0]?.avgHours
    ? Math.round(responseTimes[0].avgHours)
    : null;

  // upsert
  await db
    .insert(schema.userTradeStats)
    .values({
      userId,
      completedCount,
      canceledCount,
      disputedCount,
      avgResponseTimeHours,
      firstTradeAt,
      lastTradeAt,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.userTradeStats.userId,
      set: {
        completedCount,
        canceledCount,
        disputedCount,
        avgResponseTimeHours,
        firstTradeAt,
        lastTradeAt,
        updatedAt: new Date(),
      },
    });

  // 信頼スコアの取引関連部分を更新
  await updateUserTrustScoreFromTrades(userId);
}

/**
 * トレード関連の信頼スコアを更新
 */
async function updateUserTrustScoreFromTrades(userId: string): Promise<void> {
  try {
    // トレード統計を取得
    const tradeStats = await db
      .select()
      .from(schema.userTradeStats)
      .where(eq(schema.userTradeStats.userId, userId))
      .limit(1);

    // レビュー統計を取得
    const reviewStats = await db
      .select()
      .from(schema.userReviewStats)
      .where(eq(schema.userReviewStats.userId, userId))
      .limit(1);

    const tradeStat = tradeStats[0];
    const reviewStat = reviewStats[0];

    // トレード統計からスコア計算用の入力を作成
    const totalTrades =
      (tradeStat?.completedCount ?? 0) +
      (tradeStat?.canceledCount ?? 0) +
      (tradeStat?.disputedCount ?? 0);
    const completedTrades = tradeStat?.completedCount ?? 0;
    const troubledTrades = tradeStat?.disputedCount ?? 0;
    const averageRating = reviewStat?.avgRating ? reviewStat.avgRating / 10 : 0;

    // 直近10件のトレード情報を取得
    const recentTrades = await db
      .select({
        id: schema.trade.id,
        status: schema.trade.status,
      })
      .from(schema.trade)
      .where(
        and(
          or(eq(schema.trade.initiatorUserId, userId), eq(schema.trade.responderUserId, userId)),
          inArray(schema.trade.status, ['completed', 'canceled', 'disputed'])
        )
      )
      .orderBy(desc(schema.trade.updatedAt))
      .limit(10);

    // 直近トレードの評価を取得
    const recentTradeIds = recentTrades.map((t) => t.id);
    const recentReviews =
      recentTradeIds.length > 0
        ? await db
            .select({
              tradeId: schema.tradeReview.tradeId,
              rating: schema.tradeReview.rating,
            })
            .from(schema.tradeReview)
            .where(
              and(
                inArray(schema.tradeReview.tradeId, recentTradeIds),
                eq(schema.tradeReview.revieweeUserId, userId)
              )
            )
        : [];

    const reviewMap = new Map(recentReviews.map((r) => [r.tradeId, r.rating]));

    // 直近トレードデータを整形
    const recentTradesInput = recentTrades.map((t) => ({
      completed: t.status === 'completed',
      troubled: t.status === 'disputed',
      rating: reviewMap.get(t.id) ?? 3, // レビューがない場合はデフォルト3
    }));

    // スコア計算
    const totalTradeScoreResult = calcTotalTradeScore({
      totalTrades,
      completedTrades,
      troubledTrades,
      averageRating,
      recentTrades: recentTradesInput,
    });

    const recentTradeScoreResult = calcRecentTradeScore({
      totalTrades,
      completedTrades,
      troubledTrades,
      averageRating,
      recentTrades: recentTradesInput,
    });

    // ユーザーの現在のTwitterスコアを取得
    const users = await db
      .select({
        twitterScore: schema.user.twitterScore,
      })
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);

    const twitterScore = users[0]?.twitterScore ?? 0;

    // 新しい総合スコアを計算
    const newTotalScore = twitterScore + totalTradeScoreResult.score + recentTradeScoreResult.score;
    const newGrade =
      newTotalScore >= 90
        ? 'S'
        : newTotalScore >= 75
          ? 'A'
          : newTotalScore >= 60
            ? 'B'
            : newTotalScore >= 45
              ? 'C'
              : newTotalScore >= 30
                ? 'D'
                : 'E';

    // ユーザーテーブルを更新
    await db
      .update(schema.user)
      .set({
        totalTradeScore: totalTradeScoreResult.score,
        recentTradeScore: recentTradeScoreResult.score,
        trustScore: newTotalScore,
        trustGrade: newGrade,
        trustScoreUpdatedAt: new Date(),
      })
      .where(eq(schema.user.id, userId));
  } catch (error) {
    console.error('Failed to update trust score from trades:', error);
    // エラーは無視して続行（統計更新自体は成功させる）
  }
}

/**
 * ユーザーの統計情報を取得
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  const [tradeStats, reviewStats] = await Promise.all([
    db
      .select()
      .from(schema.userTradeStats)
      .where(eq(schema.userTradeStats.userId, userId))
      .limit(1),
    db
      .select()
      .from(schema.userReviewStats)
      .where(eq(schema.userReviewStats.userId, userId))
      .limit(1),
  ]);

  const tradeStat = tradeStats[0];
  const reviewStat = reviewStats[0];

  return {
    trade: tradeStat
      ? {
          userId: tradeStat.userId,
          completedCount: tradeStat.completedCount,
          canceledCount: tradeStat.canceledCount,
          disputedCount: tradeStat.disputedCount,
          avgResponseTimeHours: tradeStat.avgResponseTimeHours,
          firstTradeAt: tradeStat.firstTradeAt?.toISOString() ?? null,
          lastTradeAt: tradeStat.lastTradeAt?.toISOString() ?? null,
          updatedAt: tradeStat.updatedAt.toISOString(),
        }
      : null,
    review: reviewStat
      ? {
          userId: reviewStat.userId,
          reviewCount: reviewStat.reviewCount,
          avgRating: reviewStat.avgRating ? reviewStat.avgRating / 10 : null, // 10で割って実際の評価に変換
          positiveCount: reviewStat.positiveCount,
          negativeCount: reviewStat.negativeCount,
          updatedAt: reviewStat.updatedAt.toISOString(),
        }
      : null,
  };
}

/**
 * 全ユーザーの統計を再計算
 */
export async function recalculateAllStats(): Promise<{
  tradeStatsUpdated: number;
  reviewStatsUpdated: number;
}> {
  // 全ユーザーIDを取得
  const users = await db.select({ id: schema.user.id }).from(schema.user);

  let tradeStatsUpdated = 0;
  let reviewStatsUpdated = 0;

  for (const user of users) {
    try {
      await updateUserTradeStats(user.id);
      tradeStatsUpdated++;
    } catch {
      // エラーは無視して続行
    }

    try {
      // レビュー統計は reviews モジュールからインポート
      const { updateUserReviewStats } = await import('@/modules/reviews');
      await updateUserReviewStats(user.id);
      reviewStatsUpdated++;
    } catch {
      // エラーは無視して続行
    }
  }

  return { tradeStatsUpdated, reviewStatsUpdated };
}
