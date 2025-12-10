import type Stripe from 'stripe';

/**
 * サブスクリプションプラン
 */
export type SubscriptionPlan = 'free' | 'basic' | 'premium';

/**
 * サブスクリプションステータス
 */
export type SubscriptionStatus = 'free' | 'active' | 'canceled' | 'past_due';

/**
 * ユーザーのサブスクリプション情報
 */
export interface UserSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  stripeSubscriptionId?: string;
}

/**
 * Checkout セッション作成のオプション
 */
export interface CreateCheckoutOptions {
  userId: string;
  userEmail: string;
  plan: 'basic' | 'premium';
}

/**
 * カスタマーポータルセッション作成のオプション
 */
export interface CreatePortalOptions {
  userId: string;
  returnUrl?: string;
}

/**
 * Webhook イベントハンドラの型
 */
export type WebhookHandler = (event: Stripe.Event) => Promise<void>;

/**
 * Webhook イベントタイプ
 */
export const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'checkout.session.expired',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.payment_action_required',
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number];
