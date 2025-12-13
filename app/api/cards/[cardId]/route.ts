import { NextResponse } from 'next/server';
import { getCardWithCreator } from '@/modules/cards';

interface RouteParams {
  params: Promise<{ cardId: string }>;
}

/**
 * GET: カード詳細を取得（公開API、認証不要）
 *
 * Response: { card: CardWithCreator }
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { cardId } = await params;

  const card = await getCardWithCreator(cardId);
  if (!card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  return NextResponse.json({ card });
}
