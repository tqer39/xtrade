import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTradeDetail } from '@/modules/trades';

type Params = Promise<{ roomSlug: string }>;

/**
 * GET: トレード詳細を取得
 */
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { roomSlug } = await params;
  const tradeDetail = await getTradeDetail(roomSlug);

  if (!tradeDetail) {
    return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
  }

  return NextResponse.json({ trade: tradeDetail });
}
