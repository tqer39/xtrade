import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { removeWantCard, upsertWantCard } from '@/modules/cards';

/**
 * POST: 欲しいカードを追加/更新
 *
 * Body: { cardId: string, priority?: number }
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { cardId?: string; priority?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { cardId, priority } = body;

  if (!cardId || typeof cardId !== 'string') {
    return NextResponse.json({ error: 'cardId is required' }, { status: 400 });
  }

  if (priority !== undefined && typeof priority !== 'number') {
    return NextResponse.json({ error: 'priority must be a number' }, { status: 400 });
  }

  try {
    const result = await upsertWantCard(session.user.id, { cardId, priority });
    return NextResponse.json({ wantCard: result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Card not found') {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }
    throw error;
  }
}

/**
 * DELETE: 欲しいカードを削除
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

  await removeWantCard(session.user.id, cardId);

  return NextResponse.json({ deleted: true });
}
