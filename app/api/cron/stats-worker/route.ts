import { type NextRequest, NextResponse } from 'next/server';
import { recalculateAllStats } from '@/modules/stats';

/**
 * GET: Vercel Cron から呼び出される統計再計算ワーカー
 *
 * cron: "0 3 * * *" (毎日午前3時)
 *
 * 通常はトレード完了時にリアルタイム更新されるが、
 * 整合性担保のため定期的に全ユーザーの統計を再計算
 */
export async function GET(request: NextRequest) {
  // Vercel Cron 認証チェック
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // CRON_SECRET が設定されている場合のみ認証チェック
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await recalculateAllStats();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
