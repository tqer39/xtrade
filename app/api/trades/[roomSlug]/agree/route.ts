import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import {
  getTradeByRoomSlug,
  transitionTrade,
  setResponder,
  TradeTransitionError,
} from '@/modules/trades'

type Params = Promise<{ roomSlug: string }>

/**
 * POST: トレードに合意する（proposed → agreed）
 *
 * Body: { agreedExpiredAt?: string }
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
  let trade = await getTradeByRoomSlug(roomSlug)

  if (!trade) {
    return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
  }

  let body: { agreedExpiredAt?: string } = {}
  try {
    const text = await request.text()
    if (text) {
      body = JSON.parse(text)
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    // 応答者が設定されていない場合は設定する
    if (!trade.responderUserId) {
      await setResponder(trade, session.user.id)
      // トレード情報を再取得
      trade = (await getTradeByRoomSlug(roomSlug))!
    }

    await transitionTrade(trade, 'agreed', session.user.id, {
      agreedExpiredAt: body.agreedExpiredAt
        ? new Date(body.agreedExpiredAt)
        : undefined,
    })
    return NextResponse.json({ success: true, status: 'agreed' })
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
