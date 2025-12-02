import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/db/drizzle'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

/**
 * 管理者権限チェック
 */
async function requireAdmin(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return { error: 'Unauthorized', status: 401 }
  }

  // role フィールドをチェック
  const user = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, session.user.id))
    .limit(1)

  if (!user[0] || user[0].role !== 'admin') {
    return { error: 'Forbidden: Admin access required', status: 403 }
  }

  return { user: user[0], session }
}

/**
 * GET: ホワイトリスト一覧取得
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const allowedUsers = await db.select().from(schema.allowedUser).orderBy(schema.allowedUser.createdAt)

  return NextResponse.json({ allowedUsers })
}

/**
 * POST: ホワイトリストにユーザー追加
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const body = await request.json()
  const { twitterUsername } = body

  if (!twitterUsername || typeof twitterUsername !== 'string') {
    return NextResponse.json({ error: 'twitterUsername is required' }, { status: 400 })
  }

  // @ を除去し、小文字に正規化
  const normalizedUsername = twitterUsername.replace(/^@/, '').toLowerCase().trim()

  if (!normalizedUsername) {
    return NextResponse.json({ error: 'Invalid twitterUsername' }, { status: 400 })
  }

  // 既に存在するかチェック
  const existing = await db
    .select()
    .from(schema.allowedUser)
    .where(eq(schema.allowedUser.twitterUsername, normalizedUsername))
    .limit(1)

  if (existing.length > 0) {
    return NextResponse.json({ error: 'User already in whitelist' }, { status: 409 })
  }

  // 追加
  const newUser = await db
    .insert(schema.allowedUser)
    .values({
      id: nanoid(),
      twitterUsername: normalizedUsername,
      addedBy: authResult.user.id,
    })
    .returning()

  return NextResponse.json({ allowedUser: newUser[0] }, { status: 201 })
}

/**
 * DELETE: ホワイトリストからユーザー削除
 */
export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const deleted = await db.delete(schema.allowedUser).where(eq(schema.allowedUser.id, id)).returning()

  if (deleted.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ deleted: deleted[0] })
}
