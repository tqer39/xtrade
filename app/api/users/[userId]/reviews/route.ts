import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserReviews } from '@/modules/reviews';

type Params = Promise<{ userId: string }>;

/**
 * GET: ユーザーが受けたレビュー一覧を取得
 */
export async function GET(request: NextRequest, { params }: { params: Params }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = await params;
  const { searchParams } = request.nextUrl;

  const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);
  const offset = Number(searchParams.get('offset')) || 0;

  // 自分以外のユーザーのレビューは公開のみ表示
  const onlyPublic = session.user.id !== userId;

  const { reviews, total } = await getUserReviews(userId, {
    onlyPublic,
    limit,
    offset,
  });

  return NextResponse.json({
    reviews,
    total,
    limit,
    offset,
  });
}
