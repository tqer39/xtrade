import { and, eq, gte, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import { auth } from '@/lib/auth';

/**
 * GET: 信頼スコア再計算キューのサマリーを取得（管理者用）
 */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 管理者チェック
  const users = await db
    .select({ role: schema.user.role })
    .from(schema.user)
    .where(eq(schema.user.id, session.user.id))
    .limit(1);

  if (!users[0] || users[0].role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  // 24時間前の日時
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // キューの状態を集計
  const [queued] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.userTrustJob)
    .where(eq(schema.userTrustJob.status, 'queued'));

  const [running] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.userTrustJob)
    .where(eq(schema.userTrustJob.status, 'running'));

  const [recentFailed] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.userTrustJob)
    .where(
      and(
        eq(schema.userTrustJob.status, 'failed'),
        gte(schema.userTrustJob.finishedAt, twentyFourHoursAgo)
      )
    );

  return NextResponse.json({
    queued: queued.count,
    running: running.count,
    recentFailed: recentFailed.count,
  });
}
