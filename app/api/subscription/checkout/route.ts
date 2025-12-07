import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createCheckoutSession } from '@/modules/subscription';

/**
 * Checkout セッション作成
 * POST /api/subscription/checkout
 *
 * Body: { plan: 'basic' | 'premium' }
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body;

    if (!plan || !['basic', 'premium'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "basic" or "premium"' },
        { status: 400 }
      );
    }

    const url = await createCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email,
      plan,
    });

    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to create checkout session:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
