import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { searchPhotocardMaster } from '@/modules/photocard';

/**
 * GET: フォトカードマスターを検索
 *
 * Query:
 * - q: 検索クエリ（カード名・メンバー名・読み）
 * - group: グループ名でフィルタ
 * - member: メンバー名でフィルタ
 * - series: シリーズ名でフィルタ
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
  const groupName = searchParams.get('group') ?? undefined;
  const memberName = searchParams.get('member') ?? undefined;
  const series = searchParams.get('series') ?? undefined;
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);

  const photocards = await searchPhotocardMaster(
    query,
    groupName,
    memberName,
    series,
    Math.min(limit, 100)
  );

  return NextResponse.json({ photocards });
}
