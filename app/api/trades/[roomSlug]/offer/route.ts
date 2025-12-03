import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import {
  getTradeByRoomSlug,
  updateOffer,
  TradeTransitionError,
} from '@/modules/trades'

type Params = Promise<{ roomSlug: string }>

/**
 * POST: オファー内容を更新
 *
 * Body: { items: Array<{ cardId: string, quantity: number }> }
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

  let body: { items?: Array<{ cardId?: string; quantity?: number }> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { items } = body

  if (!items || !Array.isArray(items)) {
    return NextResponse.json({ error: 'items is required' }, { status: 400 })
  }

  // バリデーション
  for (const item of items) {
    if (!item.cardId || typeof item.cardId !== 'string') {
      return NextResponse.json(
        { error: 'Each item must have a cardId' },
        { status: 400 }
      )
    }
    if (typeof item.quantity !== 'number' || item.quantity < 1) {
      return NextResponse.json(
        { error: 'Each item must have a positive quantity' },
        { status: 400 }
      )
    }
  }

  try {
    await updateOffer(trade, session.user.id, {
      items: items as Array<{ cardId: string; quantity: number }>,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof TradeTransitionError) {
      const statusCode =
        error.code === 'UNAUTHORIZED'
          ? 403
          : error.code === 'INVALID_TRANSITION'
            ? 400
            : 400
      return NextResponse.json({ error: error.message }, { status: statusCode })
    }
    throw error
  }
}
