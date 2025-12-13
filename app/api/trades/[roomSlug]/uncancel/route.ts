import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTradeByRoomSlug, TradeTransitionError, uncancelTrade } from '@/modules/trades';

type Params = Promise<{ roomSlug: string }>;

/**
 * POST: キャンセルを取り消し、元のステータスに戻す
 */
export async function POST(_request: Request, { params }: { params: Params }) {
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
    const newStatus = await uncancelTrade(trade, session.user.id);
    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    if (error instanceof TradeTransitionError) {
      const statusCode = error.code === 'UNAUTHORIZED' ? 403 : 400;
      return NextResponse.json({ error: error.message }, { status: statusCode });
    }
    throw error;
  }
}
