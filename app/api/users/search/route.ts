import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { searchUsers } from '@/modules/users';

/**
 * GET: ユーザーを検索
 *
 * Query:
 * - q: 検索クエリ（名前・Twitterユーザー名）
 * - limit: 取得件数（デフォルト 50、最大 100）
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
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);

  const users = await searchUsers(query, Math.min(limit, 100));

  return NextResponse.json({ users });
}
