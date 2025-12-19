import { type NextRequest, NextResponse } from 'next/server';
import { searchLatestCardsWithCreator } from '@/modules/cards';

/**
 * GET: 最新登録カード一覧を取得（公開API、認証不要）
 *
 * Query:
 * - q: 検索クエリ（カード名）
 * - page: ページ番号（デフォルト 1）
 * - limit: 取得件数（デフォルト 12、最大 100）
 *
 * Response:
 * - cards: カード一覧（作成者情報付き）
 * - total: 総件数
 * - page: 現在のページ
 * - totalPages: 総ページ数
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') ?? undefined;
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '12', 10);

  const result = await searchLatestCardsWithCreator({
    query,
    page: Math.max(1, page),
    limit: Math.min(limit, 100),
  });

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
    },
  });
}
