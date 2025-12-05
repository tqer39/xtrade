import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { addFavoriteUser, getUserFavoriteUsers, removeFavoriteUser } from '@/modules/favorites';

/**
 * GET: お気に入りユーザー一覧を取得
 */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const favoriteUsers = await getUserFavoriteUsers(session.user.id);

  return NextResponse.json({ favoriteUsers });
}

/**
 * POST: ユーザーをお気に入りに追加
 *
 * Body: { userId: string }
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { userId } = body;

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    const result = await addFavoriteUser(session.user.id, userId);
    return NextResponse.json({ favoriteUser: result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      if (error.message === 'Cannot favorite yourself') {
        return NextResponse.json({ error: 'Cannot favorite yourself' }, { status: 400 });
      }
    }
    throw error;
  }
}

/**
 * DELETE: ユーザーをお気に入りから削除
 *
 * Query: ?userId=xxx
 */
export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  await removeFavoriteUser(session.user.id, userId);

  return NextResponse.json({ deleted: true });
}
