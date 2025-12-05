import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkFavorites } from '@/modules/favorites';

/**
 * POST: 複数のカード/ユーザーのお気に入り状態を一括確認
 *
 * Body: { cardIds?: string[], userIds?: string[] }
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { cardIds?: string[]; userIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { cardIds = [], userIds = [] } = body;

  if (!Array.isArray(cardIds) || !Array.isArray(userIds)) {
    return NextResponse.json({ error: 'cardIds and userIds must be arrays' }, { status: 400 });
  }

  const result = await checkFavorites(session.user.id, cardIds, userIds);

  return NextResponse.json(result);
}
