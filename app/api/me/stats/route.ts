import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserStats } from '@/modules/stats';

/**
 * GET: 自分のトレード・レビュー統計を取得
 */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stats = await getUserStats(session.user.id);

  return NextResponse.json(stats);
}
