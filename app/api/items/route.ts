import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createCard, searchCards } from '@/modules/cards';

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
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') ?? undefined;
  const category = searchParams.get('category') ?? undefined;
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);

  const cards = await searchCards(query, category, Math.min(limit, 100));

  return NextResponse.json(
    { cards },
    {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=30',
      },
    }
  );
}

/**
 * POST: アイテムを新規登録
 *
 * Body: { name: string, category?: string, description?: string, imageUrl?: string }
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    name?: string;
    category?: string;
    description?: string;
    imageUrl?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, category, description, imageUrl } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const card = await createCard(
    {
      name: name.trim(),
      category: category?.trim(),
      description: description?.trim(),
      imageUrl: imageUrl?.trim(),
    },
    session.user.id
  );

  return NextResponse.json({ card }, { status: 201 });
}
