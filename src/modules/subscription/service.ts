import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { db } from '@/db';
import { stripeCustomer, subscription, user } from '@/db/schema';
import { getPlanByPriceId, getPriceIdByPlan, STRIPE_CONFIG, stripe } from '@/lib/stripe';

import type { CreateCheckoutOptions, CreatePortalOptions, UserSubscription } from './types';

/**
 * Stripe Customer を取得、なければ作成
 */
export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  // 既存の Stripe Customer を検索
  const existing = await db.query.stripeCustomer.findFirst({
    where: eq(stripeCustomer.userId, userId),
  });

  if (existing) {
    return existing.stripeCustomerId;
  }

  // Stripe Customer を作成
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  // DB に保存
  await db.insert(stripeCustomer).values({
    id: nanoid(),
    userId,
    stripeCustomerId: customer.id,
  });

  return customer.id;
}

/**
 * ユーザーのサブスクリプション情報を取得
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!userRecord) {
    return {
      plan: 'free',
      status: 'free',
    };
  }

  // アクティブなサブスクリプションを検索
  const activeSubscription = await db.query.subscription.findFirst({
    where: eq(subscription.userId, userId),
    orderBy: (sub, { desc }) => [desc(sub.createdAt)],
  });

  if (!activeSubscription || activeSubscription.status !== 'active') {
    return {
      plan: 'free',
      status: 'free',
    };
  }

  return {
    plan: (userRecord.subscriptionPlan as UserSubscription['plan']) || 'free',
    status: (userRecord.subscriptionStatus as UserSubscription['status']) || 'free',
    currentPeriodEnd: activeSubscription.currentPeriodEnd,
    cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
    stripeSubscriptionId: activeSubscription.stripeSubscriptionId,
  };
}

/**
 * Checkout Session を作成
 */
export async function createCheckoutSession(options: CreateCheckoutOptions): Promise<string> {
  const { userId, userEmail, plan } = options;

  // Stripe Customer を取得または作成
  const customerId = await getOrCreateStripeCustomer(userId, userEmail);

  // Checkout Session を作成
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: getPriceIdByPlan(plan),
        quantity: 1,
      },
    ],
    success_url: STRIPE_CONFIG.successUrl,
    cancel_url: STRIPE_CONFIG.cancelUrl,
    subscription_data: {
      metadata: {
        userId,
        plan,
      },
    },
    metadata: {
      userId,
      plan,
    },
    locale: 'ja',
    allow_promotion_codes: true,
  });

  if (!session.url) {
    throw new Error('Checkout セッションの URL が取得できませんでした');
  }
  return session.url;
}

/**
 * カスタマーポータルセッションを作成
 */
export async function createPortalSession(options: CreatePortalOptions): Promise<string> {
  const { userId, returnUrl } = options;

  // Stripe Customer を取得
  const customerRecord = await db.query.stripeCustomer.findFirst({
    where: eq(stripeCustomer.userId, userId),
  });

  if (!customerRecord) {
    throw new Error('Stripe customer not found');
  }

  // Portal Session を作成
  const session = await stripe.billingPortal.sessions.create({
    customer: customerRecord.stripeCustomerId,
    return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
  });

  return session.url;
}

/**
 * サブスクリプションをキャンセル（期間終了時）
 */
export async function cancelSubscription(userId: string): Promise<void> {
  const userSubscription = await getUserSubscription(userId);

  if (!userSubscription.stripeSubscriptionId) {
    throw new Error('No active subscription found');
  }

  // Stripe サブスクリプションを期間終了時にキャンセル
  await stripe.subscriptions.update(userSubscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  // DB を更新
  await db
    .update(subscription)
    .set({
      cancelAtPeriodEnd: true,
    })
    .where(eq(subscription.stripeSubscriptionId, userSubscription.stripeSubscriptionId));
}

/**
 * Stripe サブスクリプションから DB を同期
 */
export async function syncSubscriptionFromStripe(stripeSubscription: {
  id: string;
  status: string;
  customer: string | { id: string };
  items: { data: Array<{ price: { id: string } }> };
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  ended_at: number | null;
}): Promise<void> {
  const customerId =
    typeof stripeSubscription.customer === 'string'
      ? stripeSubscription.customer
      : stripeSubscription.customer.id;

  // Stripe Customer から userId を取得
  const customerRecord = await db.query.stripeCustomer.findFirst({
    where: eq(stripeCustomer.stripeCustomerId, customerId),
  });

  if (!customerRecord) {
    console.error('Customer not found for subscription sync:', customerId);
    return;
  }

  const userId = customerRecord.userId;
  const priceId = stripeSubscription.items.data[0]?.price.id;
  const plan = getPlanByPriceId(priceId);

  // サブスクリプションステータスのマッピング
  const statusMap: Record<string, string> = {
    active: 'active',
    canceled: 'canceled',
    past_due: 'past_due',
    paused: 'canceled',
    trialing: 'active',
    incomplete: 'past_due',
    incomplete_expired: 'canceled',
  };
  const subscriptionStatus = statusMap[stripeSubscription.status] || 'free';

  // subscription テーブルを更新または作成
  const existingSubscription = await db.query.subscription.findFirst({
    where: eq(subscription.stripeSubscriptionId, stripeSubscription.id),
  });

  if (existingSubscription) {
    await db
      .update(subscription)
      .set({
        status: stripeSubscription.status,
        stripePriceId: priceId,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        canceledAt: stripeSubscription.canceled_at
          ? new Date(stripeSubscription.canceled_at * 1000)
          : null,
        endedAt: stripeSubscription.ended_at ? new Date(stripeSubscription.ended_at * 1000) : null,
      })
      .where(eq(subscription.stripeSubscriptionId, stripeSubscription.id));
  } else {
    await db.insert(subscription).values({
      id: nanoid(),
      userId,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      status: stripeSubscription.status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      canceledAt: stripeSubscription.canceled_at
        ? new Date(stripeSubscription.canceled_at * 1000)
        : null,
      endedAt: stripeSubscription.ended_at ? new Date(stripeSubscription.ended_at * 1000) : null,
    });
  }

  // user テーブルのサブスクリプション情報を更新
  await db
    .update(user)
    .set({
      subscriptionPlan: plan,
      subscriptionStatus: subscriptionStatus,
    })
    .where(eq(user.id, userId));
}
