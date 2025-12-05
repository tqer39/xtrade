import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findMatches } from '@/modules/matches';
import type { TrustGrade } from '@/modules/trust';

const VALID_GRADES = ['S', 'A', 'B', 'C', 'D', 'U'] as const;

/**
 * GET: マッチング候補を取得
 *
 * Query:
 * - minTrustGrade: 最低信頼グレード（S/A/B/C/D）
 * - limit: 取得件数（デフォルト 20）
 * - offset: オフセット
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const minTrustGradeParam = searchParams.get('minTrustGrade');
  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');

  // minTrustGrade のバリデーション
  let minTrustGrade: TrustGrade | undefined;
  if (minTrustGradeParam) {
    if (!VALID_GRADES.includes(minTrustGradeParam as TrustGrade)) {
      return NextResponse.json(
        { error: 'Invalid minTrustGrade. Valid values: S, A, B, C, D, U' },
        { status: 400 }
      );
    }
    minTrustGrade = minTrustGradeParam as TrustGrade;
  }

  const limit = limitParam ? parseInt(limitParam, 10) : 20;
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

  if (Number.isNaN(limit) || limit < 1 || limit > 100) {
    return NextResponse.json({ error: 'limit must be between 1 and 100' }, { status: 400 });
  }

  if (Number.isNaN(offset) || offset < 0) {
    return NextResponse.json({ error: 'offset must be a non-negative number' }, { status: 400 });
  }

  const result = await findMatches(session.user.id, {
    minTrustGrade,
    limit,
    offset,
  });

  return NextResponse.json(result);
}
