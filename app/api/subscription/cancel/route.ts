import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { cancelSubscription } from '@/modules/subscription';

/**
 * サブスクリプションキャンセル（期間終了時）
 * POST /api/subscription/cancel
 */
export async function POST(): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await cancelSubscription(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to cancel subscription:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
