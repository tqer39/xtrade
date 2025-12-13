import { NextResponse } from 'next/server';
import { getUserListingCards } from '@/modules/cards';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * GET: ユーザーが出品しているカード一覧を取得（公開API、認証不要）
 *
 * Response: { cards: Card[] }
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { userId } = await params;

  const cards = await getUserListingCards(userId);

  return NextResponse.json({ cards });
}
