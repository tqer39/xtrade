import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { searchCardsWithOwners } from '@/modules/cards/service';

/**
 * GET: カードを検索（所有者情報付き）
 *
 * Query:
 * - q: 検索クエリ（カード名）
 * - category: カテゴリでフィルタ
 * - limit: 取得件数（デフォルト 50、最大 100）
 *
 * Response:
 * - cards: カード一覧（topOwner付き、信頼スコア順）
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') ?? undefined;
  const category = searchParams.get('category') ?? undefined;
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);

  const cards = await searchCardsWithOwners(query, category, Math.min(limit, 100));

  return NextResponse.json({ cards });
}
