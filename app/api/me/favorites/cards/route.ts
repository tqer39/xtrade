import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { addFavoriteCard, getUserFavoriteCards, removeFavoriteCard } from '@/modules/favorites';

/**
 * GET: お気に入りカード一覧を取得
 */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const favoriteCards = await getUserFavoriteCards(session.user.id);

  return NextResponse.json({ favoriteCards });
}

/**
 * POST: カードをお気に入りに追加
 *
 * Body: { cardId: string }
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { cardId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { cardId } = body;

  if (!cardId || typeof cardId !== 'string') {
    return NextResponse.json({ error: 'cardId is required' }, { status: 400 });
  }

  try {
    const result = await addFavoriteCard(session.user.id, cardId);
    return NextResponse.json({ favoriteCard: result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Card not found') {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }
    throw error;
  }
}

/**
 * DELETE: カードをお気に入りから削除
 *
 * Query: ?cardId=xxx
 */
export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cardId = searchParams.get('cardId');

  if (!cardId) {
    return NextResponse.json({ error: 'cardId is required' }, { status: 400 });
  }

  await removeFavoriteCard(session.user.id, cardId);

  return NextResponse.json({ deleted: true });
}
