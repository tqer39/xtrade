import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type Stripe from 'stripe';

import { db } from '@/db';
import { paymentEvent, user } from '@/db/schema';

import { syncSubscriptionFromStripe } from './service';
import type { WebhookEventType, WebhookHandler } from './types';

/**
 * イベント処理済みかチェック（冪等性担保）
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  const existing = await db.query.paymentEvent.findFirst({
    where: eq(paymentEvent.stripeEventId, eventId),
  });
  return existing?.processedAt !== null;
}

/**
 * イベント処理を記録
 */
async function recordEvent(
  eventId: string,
  eventType: string,
  userId: string | null,
  subscriptionId: string | null,
  payload: object,
  error?: string
): Promise<void> {
  const existing = await db.query.paymentEvent.findFirst({
    where: eq(paymentEvent.stripeEventId, eventId),
  });

  if (existing) {
    await db
      .update(paymentEvent)
      .set({
        processedAt: error ? null : new Date(),
        error: error || null,
      })
      .where(eq(paymentEvent.stripeEventId, eventId));
  } else {
    await db.insert(paymentEvent).values({
      id: nanoid(),
      stripeEventId: eventId,
      eventType,
      userId,
      subscriptionId,
      payload: JSON.stringify(payload),
      processedAt: error ? null : new Date(),
      error: error || null,
    });
  }
}

/**
 * Checkout Session 完了ハンドラ
 */
async function handleCheckoutCompleted(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;

  if (session.mode !== 'subscription') {
    return;
  }

  const subscriptionId = session.subscription as string;

  // Stripe からサブスクリプション詳細を取得
  const stripe = (await import('@/lib/stripe')).stripe;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // DB を同期
  await syncSubscriptionFromStripe(
    subscription as Parameters<typeof syncSubscriptionFromStripe>[0]
  );
}

/**
 * サブスクリプション作成ハンドラ
 */
async function handleSubscriptionCreated(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  await syncSubscriptionFromStripe(
    subscription as Parameters<typeof syncSubscriptionFromStripe>[0]
  );
}

/**
 * サブスクリプション更新ハンドラ
 */
async function handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  await syncSubscriptionFromStripe(
    subscription as Parameters<typeof syncSubscriptionFromStripe>[0]
  );
}

/**
 * サブスクリプション削除ハンドラ
 */
async function handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;

  // サブスクリプションを同期（status が canceled になる）
  await syncSubscriptionFromStripe(
    subscription as Parameters<typeof syncSubscriptionFromStripe>[0]
  );
}

/**
 * 請求書支払い成功ハンドラ
 */
async function handleInvoicePaid(event: Stripe.Event): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;

  if (!invoice.subscription) {
    return;
  }

  // Stripe からサブスクリプション詳細を取得
  const stripe = (await import('@/lib/stripe')).stripe;
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);

  // DB を同期
  await syncSubscriptionFromStripe(
    subscription as Parameters<typeof syncSubscriptionFromStripe>[0]
  );
}

/**
 * 請求書支払い失敗ハンドラ
 */
async function handleInvoicePaymentFailed(event: Stripe.Event): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;

  if (!invoice.subscription) {
    return;
  }

  // Stripe からサブスクリプション詳細を取得して同期
  const stripe = (await import('@/lib/stripe')).stripe;
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);

  // DB を同期（status が past_due になる可能性）
  await syncSubscriptionFromStripe(
    subscription as Parameters<typeof syncSubscriptionFromStripe>[0]
  );

  // TODO: 支払い失敗通知メールを送信
}

/**
 * Webhook イベントハンドラマッピング
 */
const webhookHandlers: Partial<Record<WebhookEventType, WebhookHandler>> = {
  'checkout.session.completed': handleCheckoutCompleted,
  'customer.subscription.created': handleSubscriptionCreated,
  'customer.subscription.updated': handleSubscriptionUpdated,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'invoice.paid': handleInvoicePaid,
  'invoice.payment_failed': handleInvoicePaymentFailed,
};

/**
 * Webhook イベントを処理
 */
export async function processWebhookEvent(event: Stripe.Event): Promise<void> {
  const eventType = event.type as WebhookEventType;

  // 冪等性チェック
  if (await isEventProcessed(event.id)) {
    console.log(`Event ${event.id} already processed, skipping`);
    return;
  }

  // userId を取得（可能であれば）
  let userId: string | null = null;
  const data = event.data.object as { customer?: string; metadata?: { userId?: string } };
  if (data.metadata?.userId) {
    userId = data.metadata.userId;
  } else if (data.customer) {
    const customerRecord = await db.query.stripeCustomer.findFirst({
      where: eq((await import('@/db/schema')).stripeCustomer.stripeCustomerId, data.customer),
    });
    userId = customerRecord?.userId || null;
  }

  // ハンドラを実行
  const handler = webhookHandlers[eventType];

  try {
    if (handler) {
      await handler(event);
    }

    // 成功を記録
    await recordEvent(event.id, eventType, userId, null, event.data.object as object);
  } catch (error) {
    // エラーを記録
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await recordEvent(event.id, eventType, userId, null, event.data.object as object, errorMessage);
    throw error;
  }
}
