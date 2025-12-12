import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserCategories } from '@/modules/cards/service';

/**
 * GET: ユーザーが使用しているカテゴリ一覧を取得
 */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const categories = await getUserCategories(session.user.id);

  return NextResponse.json({ categories });
}
