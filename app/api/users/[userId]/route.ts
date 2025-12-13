import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import { auth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * GET: ユーザーの公開情報を取得
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { userId } = await params;

  const users = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      image: schema.user.image,
      twitterUsername: schema.user.twitterUsername,
      bio: schema.user.bio,
      trustScore: schema.user.trustScore,
      trustGrade: schema.user.trustGrade,
    })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  if (!users[0]) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user: users[0] });
}

/**
 * PATCH: ユーザー情報を更新（自分のみ）
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { userId } = await params;

  // 認証チェック
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 自分のプロフィールのみ編集可能
  if (session.user.id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { bio } = body;

  // bioの更新
  await db
    .update(schema.user)
    .set({
      bio: bio ?? null,
      updatedAt: new Date(),
    })
    .where(eq(schema.user.id, userId));

  return NextResponse.json({ success: true });
}
