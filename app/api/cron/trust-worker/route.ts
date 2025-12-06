import { asc, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import {
  type BehaviorScoreInput,
  calcBehaviorScore,
  calcReviewScore,
  calcXProfileScore,
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

      // Xプロフィールスコア計算
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

      // 合計スコア計算
      const totalScore = xProfileScore + behaviorScore + reviewScore;
      const grade =
        totalScore >= 80
          ? 'S'
          : totalScore >= 65
            ? 'A'
            : totalScore >= 50
              ? 'B'
              : totalScore >= 35
                ? 'C'
                : 'D';

      // users テーブル更新
      await db
        .update(schema.user)
        .set({
          trustScore: totalScore,
          trustGrade: grade,
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
