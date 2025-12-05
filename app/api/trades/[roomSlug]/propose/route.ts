import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTradeByRoomSlug, TradeTransitionError, transitionTrade } from '@/modules/trades';

type Params = Promise<{ roomSlug: string }>;

/**
 * POST: トレードを提案する（draft → proposed）
 */
export async function POST(_request: NextRequest, { params }: { params: Params }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { roomSlug } = await params;
  const trade = await getTradeByRoomSlug(roomSlug);

  if (!trade) {
    return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
  }

  try {
    await transitionTrade(trade, 'proposed', session.user.id);
    return NextResponse.json({ success: true, status: 'proposed' });
  } catch (error) {
    if (error instanceof TradeTransitionError) {
      const statusCode = error.code === 'UNAUTHORIZED' ? 403 : error.code === 'EXPIRED' ? 410 : 400;
      return NextResponse.json({ error: error.message }, { status: statusCode });
    }
    throw error;
  }
}
