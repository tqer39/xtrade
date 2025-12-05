import { randomUUID } from 'node:crypto';
import { and, asc, eq, lt, or, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import { auth } from '@/lib/auth';

/** バックプレッシャー: キューの最大サイズ */
const MAX_QUEUE_SIZE = 1000;

/**
 * GET: 最新の再計算ジョブを取得
 */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 最新のジョブを取得
  const jobs = await db
    .select()
    .from(schema.userTrustJob)
    .where(eq(schema.userTrustJob.userId, session.user.id))
    .orderBy(sql`${schema.userTrustJob.createdAt} DESC`)
    .limit(1);

  if (!jobs[0]) {
    return NextResponse.json({ job: null });
  }

  const job = jobs[0];

  // キュー内の位置を計算（queued の場合のみ）
  let positionInQueue: number | null = null;
  if (job.status === 'queued') {
    const [position] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.userTrustJob)
      .where(
        and(
          eq(schema.userTrustJob.status, 'queued'),
          lt(schema.userTrustJob.createdAt, job.createdAt)
        )
      );
    positionInQueue = position.count + 1;
  }

  return NextResponse.json({
    job: {
      id: job.id,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      startedAt: job.startedAt?.toISOString() ?? null,
      finishedAt: job.finishedAt?.toISOString() ?? null,
      errorMessage: job.errorMessage,
      positionInQueue,
    },
  });
}

/**
 * POST: 信頼スコアの再計算をリクエスト
 */
export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 既存の pending ジョブ（queued または running）があるか確認
  const existingJobs = await db
    .select()
    .from(schema.userTrustJob)
    .where(
      and(
        eq(schema.userTrustJob.userId, session.user.id),
        or(eq(schema.userTrustJob.status, 'queued'), eq(schema.userTrustJob.status, 'running'))
      )
    )
    .orderBy(asc(schema.userTrustJob.createdAt))
    .limit(1);

  // 既存のジョブがあればそれを返す
  if (existingJobs[0]) {
    const job = existingJobs[0];

    // キュー内の位置を計算
    let positionInQueue: number | null = null;
    if (job.status === 'queued') {
      const [position] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.userTrustJob)
        .where(
          and(
            eq(schema.userTrustJob.status, 'queued'),
            lt(schema.userTrustJob.createdAt, job.createdAt)
          )
        );
      positionInQueue = position.count + 1;
    }

    return NextResponse.json({
      job: {
        id: job.id,
        status: job.status,
        createdAt: job.createdAt.toISOString(),
        positionInQueue,
      },
    });
  }

  // バックプレッシャーチェック
  const [queueSize] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.userTrustJob)
    .where(eq(schema.userTrustJob.status, 'queued'));

  if (queueSize.count >= MAX_QUEUE_SIZE) {
    return NextResponse.json(
      {
        error: 'Too many pending jobs',
        message: '現在リクエストが集中しています。しばらくしてからお試しください。',
        queueSize: queueSize.count,
      },
      { status: 503 }
    );
  }

  // 新規ジョブを作成
  const newJob = {
    id: randomUUID(),
    userId: session.user.id,
    status: 'queued' as const,
    createdAt: new Date(),
  };

  await db.insert(schema.userTrustJob).values(newJob);

  // ユーザーの refresh_requested_at を更新
  await db
    .update(schema.user)
    .set({ trustScoreRefreshRequestedAt: new Date() })
    .where(eq(schema.user.id, session.user.id));

  // キュー内の位置を計算
  const [position] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.userTrustJob)
    .where(
      and(
        eq(schema.userTrustJob.status, 'queued'),
        lt(schema.userTrustJob.createdAt, newJob.createdAt)
      )
    );

  return NextResponse.json(
    {
      job: {
        id: newJob.id,
        status: newJob.status,
        createdAt: newJob.createdAt.toISOString(),
        positionInQueue: position.count + 1,
      },
    },
    { status: 201 }
  );
}
