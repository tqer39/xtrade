import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import {
  getTradeByRoomSlug,
  transitionTrade,
  TradeTransitionError,
} from '@/modules/trades'

type Params = Promise<{ roomSlug: string }>

/**
 * POST: トレードを完了する（agreed → completed）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { roomSlug } = await params
  const trade = await getTradeByRoomSlug(roomSlug)

  if (!trade) {
    return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
  }

  try {
    await transitionTrade(trade, 'completed', session.user.id)
    return NextResponse.json({ success: true, status: 'completed' })
  } catch (error) {
    if (error instanceof TradeTransitionError) {
      const statusCode =
        error.code === 'UNAUTHORIZED'
          ? 403
          : error.code === 'EXPIRED'
            ? 410
            : 400
      return NextResponse.json({ error: error.message }, { status: statusCode })
    }
    throw error
  }
}
