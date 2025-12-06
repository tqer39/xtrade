import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  type CreateReviewInput,
  createReview,
  getTradeReviews,
  hasReviewedTrade,
  ReviewError,
} from '@/modules/reviews';
import { getTradeByRoomSlug } from '@/modules/trades';

type Params = Promise<{ roomSlug: string }>;

/**
 * POST: レビューを投稿する
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

  try {
    const body = (await request.json()) as CreateReviewInput;
    const review = await createReview(trade.id, session.user.id, body);
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof ReviewError) {
      const statusCode =
        error.code === 'NOT_PARTICIPANT'
          ? 403
          : error.code === 'TRADE_NOT_FOUND'
            ? 404
            : error.code === 'ALREADY_REVIEWED'
              ? 409
              : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status: statusCode });
    }
    throw error;
  }
}

/**
 * GET: トレードのレビュー一覧を取得
 */
export async function GET(_request: NextRequest, { params }: { params: Params }) {
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

  const reviews = await getTradeReviews(trade.id);
  const hasReviewed = await hasReviewedTrade(trade.id, session.user.id);

  return NextResponse.json({ reviews, hasReviewed });
}
