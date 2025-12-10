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

let _stripe: Stripe | null = null;

/**
 * Stripe クライアント (遅延初期化)
 * サーバーサイドでのみ使用
 */
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) {
      _stripe = new Stripe(getEnvVar('STRIPE_SECRET_KEY'), {
        apiVersion: '2025-11-17.clover',
        typescript: true,
      });
    }
    return Reflect.get(_stripe, prop);
  },
});

let _stripeConfig: {
  basicPriceId: string;
  premiumPriceId: string;
  webhookSecret: string;
  successUrl: string;
  cancelUrl: string;
  publishableKey: string;
} | null = null;

function getStripeConfig() {
  if (!_stripeConfig) {
    _stripeConfig = {
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
    };
  }
  return _stripeConfig;
}

/**
 * Stripe 設定 (遅延初期化)
 */
export const STRIPE_CONFIG = new Proxy(
  {} as {
    readonly basicPriceId: string;
    readonly premiumPriceId: string;
    readonly webhookSecret: string;
    readonly successUrl: string;
    readonly cancelUrl: string;
    readonly publishableKey: string;
  },
  {
    get(_target, prop) {
      return Reflect.get(getStripeConfig(), prop);
    },
  }
);

/**
 * プラン名から Price ID を取得
 */
export function getPriceIdByPlan(plan: 'basic' | 'premium'): string {
  const config = getStripeConfig();
  return plan === 'basic' ? config.basicPriceId : config.premiumPriceId;
}

/**
 * Price ID からプラン名を取得
 */
export function getPlanByPriceId(priceId: string): 'basic' | 'premium' | 'free' {
  const config = getStripeConfig();
  if (priceId === config.basicPriceId) return 'basic';
  if (priceId === config.premiumPriceId) return 'premium';
  return 'free';
}
