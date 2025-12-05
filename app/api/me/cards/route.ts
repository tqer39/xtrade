import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserHaveCards, getUserWantCards } from '@/modules/cards';

/**
 * GET: 自分のカード一覧を取得（持っているカード + 欲しいカード）
 */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [haveCards, wantCards] = await Promise.all([
    getUserHaveCards(session.user.id),
    getUserWantCards(session.user.id),
  ]);

  return NextResponse.json({
    haveCards,
    wantCards,
  });
}
