import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import { auth } from '@/lib/auth';

type Params = Promise<{ userId: string }>;

/**
 * GET: 他ユーザーの信頼スコアを取得
 */
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = await params;

  // ユーザー情報とスコアを取得
  const users = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      twitterUsername: schema.user.twitterUsername,
      image: schema.user.image,
      trustScore: schema.user.trustScore,
      trustGrade: schema.user.trustGrade,
      xProfileScore: schema.user.xProfileScore,
      behaviorScore: schema.user.behaviorScore,
      reviewScore: schema.user.reviewScore,
      trustScoreUpdatedAt: schema.user.trustScoreUpdatedAt,
    })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  const user = users[0];
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

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

  // 成功率を計算
  const totalTrades = tradeStat
    ? tradeStat.completedCount + tradeStat.canceledCount + tradeStat.disputedCount
    : 0;
  const successRate =
    totalTrades > 0 && tradeStat
      ? Math.round((tradeStat.completedCount / totalTrades) * 100)
      : null;

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      twitterUsername: user.twitterUsername,
      image: user.image,
    },
    trustScore: user.trustScore,
    trustGrade: user.trustGrade,
    breakdown: {
      xProfile: user.xProfileScore ?? 0,
      behavior: user.behaviorScore ?? 0,
      review: user.reviewScore ?? 0,
    },
    stats: {
      completedTrades: tradeStat?.completedCount ?? 0,
      successRate,
      avgRating: reviewStat?.avgRating ? reviewStat.avgRating / 10 : null,
      reviewCount: reviewStat?.reviewCount ?? 0,
    },
    updatedAt: user.trustScoreUpdatedAt?.toISOString() ?? null,
  });
}
