import { desc, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import { auth } from '@/lib/auth';

/**
 * 管理者権限チェック
 */
async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const user = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, session.user.id))
    .limit(1);

  if (!user[0] || user[0].role !== 'admin') {
    return { error: 'Forbidden: Admin access required', status: 403 };
  }

  return { user: user[0], session };
}

/**
 * GET: 登録済みユーザー一覧取得
 */
export async function GET(_request: NextRequest) {
  const authResult = await requireAdmin();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const users = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      image: schema.user.image,
      twitterUsername: schema.user.twitterUsername,
      role: schema.user.role,
      trustScore: schema.user.trustScore,
      trustGrade: schema.user.trustGrade,
      createdAt: schema.user.createdAt,
    })
    .from(schema.user)
    .orderBy(desc(schema.user.createdAt));

  return NextResponse.json({ users });
}
