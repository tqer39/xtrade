import Stripe from 'stripe';

/**
 * 環境変数を安全に取得
 */
function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`環境変数 ${name} が設定されていません`);
  }
  return value;
}

/**
 * Stripe クライアント
 * サーバーサイドでのみ使用
 */
export const stripe = new Stripe(getEnvVar('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

/**
 * Stripe 設定
 */
export const STRIPE_CONFIG = {
  // Price IDs（Terraform で作成された値を環境変数から取得）
  basicPriceId: getEnvVar('STRIPE_BASIC_PRICE_ID'),
  premiumPriceId: getEnvVar('STRIPE_PREMIUM_PRICE_ID'),

  // Webhook
  webhookSecret: getEnvVar('STRIPE_WEBHOOK_SECRET'),

  // URLs
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/pricing`,

  // 公開キー（フロントエンド用）
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
} as const;

/**
 * プラン名から Price ID を取得
 */
export function getPriceIdByPlan(plan: 'basic' | 'premium'): string {
  return plan === 'basic' ? STRIPE_CONFIG.basicPriceId : STRIPE_CONFIG.premiumPriceId;
}

/**
 * Price ID からプラン名を取得
 */
export function getPlanByPriceId(priceId: string): 'basic' | 'premium' | 'free' {
  if (priceId === STRIPE_CONFIG.basicPriceId) return 'basic';
  if (priceId === STRIPE_CONFIG.premiumPriceId) return 'premium';
  return 'free';
}
