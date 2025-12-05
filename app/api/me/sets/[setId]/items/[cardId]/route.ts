import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { removeItemFromSet, isSetOwner, getSetById } from '@/modules/cards/set-service'

interface RouteParams {
  params: Promise<{ setId: string; cardId: string }>
}

/**
 * DELETE: セットからカードを削除
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { setId, cardId } = await params

  // 所有者確認
  const isOwner = await isSetOwner(setId, session.user.id)
  if (!isOwner) {
    return NextResponse.json({ error: 'Set not found' }, { status: 404 })
  }

  await removeItemFromSet(setId, cardId)

  // 更新後のセットを返す
  const set = await getSetById(setId)

  return NextResponse.json({ set })
}
