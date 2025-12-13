import { type NextRequest, NextResponse } from 'next/server';
import { getLatestCardsWithCreator } from '@/modules/cards';

/**
 * GET: 最新登録カード一覧を取得（公開API、認証不要）
 *
 * Query:
 * - limit: 取得件数（デフォルト 20、最大 100）
 *
 * Response:
 * - cards: カード一覧（作成者情報付き）
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);

  const cards = await getLatestCardsWithCreator(Math.min(limit, 100));

  return NextResponse.json({ cards });
}
