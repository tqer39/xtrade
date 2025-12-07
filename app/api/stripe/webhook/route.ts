import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { STRIPE_CONFIG, stripe } from '@/lib/stripe';
import { processWebhookEvent } from '@/modules/subscription';

/**
 * Stripe Webhook エンドポイント
 * POST /api/stripe/webhook
 *
 * セキュリティ:
 * - Stripe 署名検証を実施
 * - 冪等性を webhook-handlers で担保
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // 署名検証
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_CONFIG.webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    // イベント処理
    await processWebhookEvent(event);

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook processing error:', message);
    // Stripe に再送を促すため 500 を返す
    return NextResponse.json({ error: `Processing Error: ${message}` }, { status: 500 });
  }
}

/**
 * Webhook は認証不要なので他のメソッドは拒否
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
