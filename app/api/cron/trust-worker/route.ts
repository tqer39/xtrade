import { and, asc, desc, eq, inArray, or } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import {
  type BehaviorScoreInput,
  calcBehaviorScore,
  calcRecentTradeScore,
  calcReviewScore,
  calcTotalTradeScore,
  calcTwitterScore,
  calcXProfileScore,
  type NewTrustScoreInput,
  type ReviewScoreInput,
} from '@/modules/trust';
import {
  fetchXUserProfile,
  isRateLimitError,
  profileToTrustScoreInput,
} from '@/modules/trust/x-api-client';

/** 1回のワーカー実行で処理する最大ジョブ数 */
const MAX_JOBS_PER_RUN = 5;

/**
 * GET: Vercel Cron から呼び出される信頼スコア再計算ワーカー
 *
 * cron: "* /5 * * * *" (5分ごと)
 */
export async function GET(request: NextRequest) {
  // Vercel Cron 認証チェック
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // CRON_SECRET が設定されている場合のみ認証チェック
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // queued ジョブを created_at 順で取得
  const jobs = await db
    .select()
    .from(schema.userTrustJob)
    .where(eq(schema.userTrustJob.status, 'queued'))
    .orderBy(asc(schema.userTrustJob.createdAt))
    .limit(MAX_JOBS_PER_RUN);

  const results: Array<{
    jobId: string;
    userId: string;
    status: 'succeeded' | 'failed' | 'requeued';
    error?: string;
  }> = [];

  for (const job of jobs) {
    try {
      // ステータスを running に更新
      await db
        .update(schema.userTrustJob)
        .set({ status: 'running', startedAt: new Date() })
        .where(eq(schema.userTrustJob.id, job.id));

      // X API を叩いてプロフィール取得
      const profile = await fetchXUserProfile(job.userId);

      // 旧スコア計算（後方互換性のため維持）
      const xProfileInput = profileToTrustScoreInput(profile);
      const xProfileScore = calcXProfileScore(xProfileInput);

      // 行動スコア計算（統計テーブルから取得）
      const tradeStats = await db
        .select()
        .from(schema.userTradeStats)
        .where(eq(schema.userTradeStats.userId, job.userId))
        .limit(1);

      const tradeStat = tradeStats[0];
      const behaviorInput: BehaviorScoreInput = {
        completedTradeCount: tradeStat?.completedCount ?? 0,
        tradeSuccessRate:
          tradeStat &&
          tradeStat.completedCount + tradeStat.canceledCount + tradeStat.disputedCount > 0
            ? (tradeStat.completedCount /
                (tradeStat.completedCount + tradeStat.canceledCount + tradeStat.disputedCount)) *
              100
            : 0,
        avgResponseTimeHours: tradeStat?.avgResponseTimeHours ?? null,
        daysSinceFirstTrade: tradeStat?.firstTradeAt
          ? Math.floor((Date.now() - tradeStat.firstTradeAt.getTime()) / (1000 * 60 * 60 * 24))
          : null,
      };
      const behaviorScore = calcBehaviorScore(behaviorInput);

      // レビュースコア計算（統計テーブルから取得）
      const reviewStats = await db
        .select()
        .from(schema.userReviewStats)
        .where(eq(schema.userReviewStats.userId, job.userId))
        .limit(1);

      const reviewStat = reviewStats[0];
      const reviewInput: ReviewScoreInput = {
        avgRating: reviewStat?.avgRating ? reviewStat.avgRating / 10 : null,
        reviewCount: reviewStat?.reviewCount ?? 0,
        positiveCount: reviewStat?.positiveCount ?? 0,
        negativeCount: reviewStat?.negativeCount ?? 0,
      };
      const reviewScore = calcReviewScore(reviewInput);

      // =====================================
      // 新3軸スコアリングシステム
      // =====================================

      // 直近10件のトレード情報を取得
      const recentTrades = await db
        .select({
          id: schema.trade.id,
          status: schema.trade.status,
        })
        .from(schema.trade)
        .where(
          and(
            or(
              eq(schema.trade.initiatorUserId, job.userId),
              eq(schema.trade.responderUserId, job.userId)
            ),
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
                  eq(schema.tradeReview.revieweeUserId, job.userId)
                )
              )
          : [];

      const reviewMap = new Map(recentReviews.map((r) => [r.tradeId, r.rating]));

      // 新スコア計算用の入力を作成
      const totalTrades =
        (tradeStat?.completedCount ?? 0) +
        (tradeStat?.canceledCount ?? 0) +
        (tradeStat?.disputedCount ?? 0);

      const newScoreInput: NewTrustScoreInput = {
        // Twitter データ
        xAccountCreatedAt: profile.created_at ? new Date(profile.created_at) : undefined,
        xFollowersCount: profile.public_metrics?.followers_count,
        xStatusesCount: profile.public_metrics?.tweet_count,
        xVerified: profile.verified,
        // 取引データ
        totalTrades,
        completedTrades: tradeStat?.completedCount ?? 0,
        troubledTrades: tradeStat?.disputedCount ?? 0,
        averageRating: reviewStat?.avgRating ? reviewStat.avgRating / 10 : 0,
        recentTrades: recentTrades.map((t) => ({
          completed: t.status === 'completed',
          troubled: t.status === 'disputed',
          rating: reviewMap.get(t.id) ?? 3, // レビューがない場合はデフォルト3
        })),
      };

      // 新3軸スコア計算
      const twitterScoreResult = calcTwitterScore(newScoreInput);
      const totalTradeScoreResult = calcTotalTradeScore(newScoreInput);
      const recentTradeScoreResult = calcRecentTradeScore(newScoreInput);

      // 新しい総合スコアとグレード
      const newTotalScore =
        twitterScoreResult.score + totalTradeScoreResult.score + recentTradeScoreResult.score;
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

      // users テーブル更新（旧スコアと新スコアの両方を保存）
      await db
        .update(schema.user)
        .set({
          // 新3軸スコア
          twitterScore: twitterScoreResult.score,
          totalTradeScore: totalTradeScoreResult.score,
          recentTradeScore: recentTradeScoreResult.score,
          trustScore: newTotalScore,
          trustGrade: newGrade,
          // 旧スコア（後方互換性）
          xProfileScore,
          behaviorScore,
          reviewScore,
          trustScoreUpdatedAt: new Date(),
        })
        .where(eq(schema.user.id, job.userId));

      // ジョブを succeeded に
      await db
        .update(schema.userTrustJob)
        .set({ status: 'succeeded', finishedAt: new Date() })
        .where(eq(schema.userTrustJob.id, job.id));

      results.push({
        jobId: job.id,
        userId: job.userId,
        status: 'succeeded',
      });
    } catch (error) {
      // Rate limit (429) の場合は queued に戻す
      if (isRateLimitError(error)) {
        await db
          .update(schema.userTrustJob)
          .set({ status: 'queued', startedAt: null })
          .where(eq(schema.userTrustJob.id, job.id));

        results.push({
          jobId: job.id,
          userId: job.userId,
          status: 'requeued',
          error: 'Rate limit exceeded',
        });

        // 処理を中断
        break;
      }

      // その他のエラーは failed に
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await db
        .update(schema.userTrustJob)
        .set({
          status: 'failed',
          finishedAt: new Date(),
          errorMessage,
        })
        .where(eq(schema.userTrustJob.id, job.id));

      results.push({
        jobId: job.id,
        userId: job.userId,
        status: 'failed',
        error: errorMessage,
      });
    }
  }

  return NextResponse.json({
    processed: results.length,
    results,
  });
}
