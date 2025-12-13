import { NextResponse } from 'next/server';
import { getUserWantCards } from '@/modules/cards';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * GET: ユーザーの欲しいカード一覧を取得（公開API、認証不要）
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { userId } = await params;

  const wantCards = await getUserWantCards(userId);

  return NextResponse.json({ wantCards });
}
