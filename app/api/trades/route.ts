import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createTrade } from '@/modules/trades';

/**
 * POST: トレードを作成
 *
 * Body: { responderUserId?: string, proposedExpiredAt?: string }
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    responderUserId?: string;
    proposedExpiredAt?: string;
    initialCardId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { responderUserId, proposedExpiredAt, initialCardId } = body;

  // 自分自身を相手に指定できない
  if (responderUserId === session.user.id) {
    return NextResponse.json({ error: 'Cannot trade with yourself' }, { status: 400 });
  }

  const trade = await createTrade(session.user.id, {
    responderUserId,
    proposedExpiredAt: proposedExpiredAt ? new Date(proposedExpiredAt) : undefined,
    initialCardId,
  });

  return NextResponse.json(
    {
      trade: {
        id: trade.id,
        roomSlug: trade.roomSlug,
        status: trade.status,
      },
    },
    { status: 201 }
  );
}
