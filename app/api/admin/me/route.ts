import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/db/drizzle'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * GET: 現在のユーザー情報を取得（role を含む）
 */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      image: schema.user.image,
      twitterUsername: schema.user.twitterUsername,
      role: schema.user.role,
    })
    .from(schema.user)
    .where(eq(schema.user.id, session.user.id))
    .limit(1)

  if (!user[0]) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ user: user[0] })
}
