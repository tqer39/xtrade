import { asc, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import { calcTrustScore } from '@/modules/trust';
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

      // スコア計算
      const input = profileToTrustScoreInput(profile);
      const result = calcTrustScore(input);

      // users テーブル更新
      await db
        .update(schema.user)
        .set({
          trustScore: result.score,
          trustGrade: result.grade,
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
