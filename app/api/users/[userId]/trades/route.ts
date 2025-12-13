import { NextResponse } from 'next/server';
import { getUserTrades } from '@/modules/trades';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * GET: ユーザーの取引一覧を取得（公開API、認証不要）
 * Query params:
 * - status: 'active' | 'completed' (optional)
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { userId } = await params;
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status') as 'active' | 'completed' | null;

  const trades = await getUserTrades(userId, statusFilter ?? undefined);

  return NextResponse.json({ trades });
}
