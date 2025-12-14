import { NextResponse } from 'next/server';
import { getCardById, getCardOwnersWithWantCards } from '@/modules/cards';

interface RouteParams {
  params: Promise<{ itemId: string }>;
}

/**
 * GET: アイテムを持っているユーザー一覧を取得（公開API、認証不要）
 *
 * Response: { card: Card, owners: CardOwner[] }
 * 各所有者には欲しいカード情報（wantCards）も含まれる
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { itemId } = await params;
  const cardId = itemId; // 内部的にはcardIdとして扱う

  // カードの存在確認
  const card = await getCardById(cardId);
  if (!card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  const owners = await getCardOwnersWithWantCards(cardId);

  return NextResponse.json({ card, owners });
}
