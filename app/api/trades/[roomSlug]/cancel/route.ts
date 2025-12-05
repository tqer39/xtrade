import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTradeByRoomSlug, TradeTransitionError, transitionTrade } from '@/modules/trades';

type Params = Promise<{ roomSlug: string }>;

/**
 * POST: トレードをキャンセルする
 *
 * Body: { reason?: string }
 */
export async function POST(request: NextRequest, { params }: { params: Params }) {
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

  let body: { reason?: string } = {};
  try {
    const text = await request.text();
    if (text) {
      body = JSON.parse(text);
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    await transitionTrade(trade, 'canceled', session.user.id, {
      reason: body.reason,
    });
    return NextResponse.json({ success: true, status: 'canceled' });
  } catch (error) {
    if (error instanceof TradeTransitionError) {
      const statusCode = error.code === 'UNAUTHORIZED' ? 403 : error.code === 'EXPIRED' ? 410 : 400;
      return NextResponse.json({ error: error.message }, { status: statusCode });
    }
    throw error;
  }
}
