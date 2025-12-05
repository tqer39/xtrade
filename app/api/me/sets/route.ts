import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createSet, getUserSets } from '@/modules/cards/set-service';
import type { CreateCardSetInput } from '@/modules/cards/types';

/**
 * GET: 自分のセット一覧を取得
 */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sets = await getUserSets(session.user.id);

  return NextResponse.json({ sets });
}

/**
 * POST: セットを作成
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as CreateCardSetInput;

  if (!body.name || body.name.trim() === '') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const set = await createSet(session.user.id, {
    name: body.name.trim(),
    description: body.description?.trim(),
    isPublic: body.isPublic,
  });

  return NextResponse.json({ set }, { status: 201 });
}
