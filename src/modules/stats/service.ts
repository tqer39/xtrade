import { and, eq, inArray, or, sql } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
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
