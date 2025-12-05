import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { addItemToSet, isSetOwner, getSetById } from '@/modules/cards/set-service'
import type { AddCardToSetInput } from '@/modules/cards/types'

interface RouteParams {
  params: Promise<{ setId: string }>
}

/**
 * POST: セットにカードを追加
 */
export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { setId } = await params

  // 所有者確認
  const isOwner = await isSetOwner(setId, session.user.id)
  if (!isOwner) {
    return NextResponse.json({ error: 'Set not found' }, { status: 404 })
  }

  const body = (await request.json()) as AddCardToSetInput

  if (!body.cardId) {
    return NextResponse.json({ error: 'cardId is required' }, { status: 400 })
  }

  try {
    await addItemToSet(setId, {
      cardId: body.cardId,
      quantity: body.quantity,
    })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    throw error
  }

  // 更新後のセットを返す
  const set = await getSetById(setId)

  return NextResponse.json({ set }, { status: 201 })
}
