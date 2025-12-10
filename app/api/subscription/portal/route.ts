import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createPortalSession } from '@/modules/subscription';

/**
 * カスタマーポータルセッション作成
 * POST /api/subscription/portal
 */
export async function POST(): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = await createPortalSession({
      userId: session.user.id,
    });

    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to create portal session:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
