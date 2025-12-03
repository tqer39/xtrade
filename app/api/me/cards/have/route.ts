import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { upsertHaveCard } from '@/modules/cards'

/**
 * POST: 持っているカードを追加/更新
 *
 * Body: { cardId: string, quantity: number }
 * quantity が 0 の場合は削除
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { cardId?: string; quantity?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { cardId, quantity } = body

  if (!cardId || typeof cardId !== 'string') {
    return NextResponse.json({ error: 'cardId is required' }, { status: 400 })
  }

  if (typeof quantity !== 'number' || quantity < 0) {
    return NextResponse.json(
      { error: 'quantity must be a non-negative number' },
      { status: 400 }
    )
  }

  try {
    const result = await upsertHaveCard(session.user.id, { cardId, quantity })

    if (result === null) {
      return NextResponse.json({ deleted: true })
    }

    return NextResponse.json({ haveCard: result }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Card not found') {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }
    throw error
  }
}
