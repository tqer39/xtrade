import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import { auth } from '@/lib/auth';

/**
 * GET: 現在の信頼スコアを取得
 */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await db
    .select({
      trustScore: schema.user.trustScore,
      trustGrade: schema.user.trustGrade,
      trustScoreUpdatedAt: schema.user.trustScoreUpdatedAt,
    })
    .from(schema.user)
    .where(eq(schema.user.id, session.user.id))
    .limit(1);

  if (!user[0]) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    trustScore: user[0].trustScore,
    trustGrade: user[0].trustGrade,
    updatedAt: user[0].trustScoreUpdatedAt?.toISOString() ?? null,
  });
}
