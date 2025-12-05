import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deleteSet, getSetById, isSetOwner, updateSet } from '@/modules/cards/set-service';
import type { UpdateCardSetInput } from '@/modules/cards/types';

interface RouteParams {
  params: Promise<{ setId: string }>;
}

/**
 * GET: セット詳細を取得
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { setId } = await params;

  // 所有者確認
  const isOwner = await isSetOwner(setId, session.user.id);
  if (!isOwner) {
    return NextResponse.json({ error: 'Set not found' }, { status: 404 });
  }

  const set = await getSetById(setId);
  if (!set) {
    return NextResponse.json({ error: 'Set not found' }, { status: 404 });
  }

  return NextResponse.json({ set });
}

/**
 * PATCH: セットを更新
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { setId } = await params;

  // 所有者確認
  const isOwner = await isSetOwner(setId, session.user.id);
  if (!isOwner) {
    return NextResponse.json({ error: 'Set not found' }, { status: 404 });
  }

  const body = (await request.json()) as UpdateCardSetInput;

  const updatedSet = await updateSet(setId, {
    name: body.name?.trim(),
    description: body.description?.trim(),
    isPublic: body.isPublic,
  });

  if (!updatedSet) {
    return NextResponse.json({ error: 'Set not found' }, { status: 404 });
  }

  return NextResponse.json({ set: updatedSet });
}

/**
 * DELETE: セットを削除
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { setId } = await params;

  // 所有者確認
  const isOwner = await isSetOwner(setId, session.user.id);
  if (!isOwner) {
    return NextResponse.json({ error: 'Set not found' }, { status: 404 });
  }

  await deleteSet(setId);

  return NextResponse.json({ success: true });
}
