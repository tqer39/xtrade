import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPendingReviewTrades } from '@/modules/reviews';

/**
 * GET: レビュー待ちトレード一覧を取得
 */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pendingTrades = await getPendingReviewTrades(session.user.id);

  return NextResponse.json({ pendingTrades });
}
