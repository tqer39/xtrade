import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { searchCards, createCard } from '@/modules/cards'

/**
 * GET: カードマスターを検索
 *
 * Query:
 * - q: 検索クエリ（カード名）
 * - category: カテゴリでフィルタ
 * - limit: 取得件数（デフォルト 50）
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? undefined
  const category = searchParams.get('category') ?? undefined
  const limit = parseInt(searchParams.get('limit') ?? '50', 10)

  const cards = await searchCards(query, category, Math.min(limit, 100))

  return NextResponse.json({ cards })
}

/**
 * POST: カードを新規登録
 *
 * Body: { name: string, category: string, rarity?: string, imageUrl?: string }
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    name?: string
    category?: string
    rarity?: string
    imageUrl?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, category, rarity, imageUrl } = body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    return NextResponse.json({ error: 'category is required' }, { status: 400 })
  }

  const card = await createCard(
    {
      name: name.trim(),
      category: category.trim(),
      rarity: rarity?.trim(),
      imageUrl: imageUrl?.trim(),
    },
    session.user.id
  )

  return NextResponse.json({ card }, { status: 201 })
}
