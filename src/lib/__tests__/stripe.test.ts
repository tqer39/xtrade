import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Stripe Module', () => {
  beforeEach(() => {
    vi.resetModules();
    // 必要な環境変数を設定
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_dummy');
    vi.stubEnv('STRIPE_BASIC_PRICE_ID', 'price_basic_123');
    vi.stubEnv('STRIPE_PREMIUM_PRICE_ID', 'price_premium_456');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'webhook_secret_test');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_dummy');
  });

  describe('stripe クライアント', () => {
    it('遅延初期化される', async () => {
      const { stripe } = await import('../stripe');

      // Proxy なので、プロパティにアクセスするまで初期化されない
      expect(stripe).toBeDefined();
    });

    it('環境変数が未設定の場合はエラーをスローする', async () => {
      vi.stubEnv('STRIPE_SECRET_KEY', '');

      const { stripe } = await import('../stripe');

      expect(() => stripe.customers).toThrow('環境変数 STRIPE_SECRET_KEY が設定されていません');
    });
  });

  describe('STRIPE_CONFIG', () => {
    it('遅延初期化される', async () => {
      const { STRIPE_CONFIG } = await import('../stripe');

      expect(STRIPE_CONFIG.basicPriceId).toBe('price_basic_123');
      expect(STRIPE_CONFIG.premiumPriceId).toBe('price_premium_456');
      expect(STRIPE_CONFIG.webhookSecret).toBe('webhook_secret_test');
      expect(STRIPE_CONFIG.successUrl).toBe(
        'http://localhost:3000/subscription/success?session_id={CHECKOUT_SESSION_ID}'
      );
      expect(STRIPE_CONFIG.cancelUrl).toBe('http://localhost:3000/pricing');
      expect(STRIPE_CONFIG.publishableKey).toBe('pk_test_dummy');
    });

    it('環境変数が未設定の場合はエラーをスローする', async () => {
      vi.stubEnv('STRIPE_BASIC_PRICE_ID', '');

      const { STRIPE_CONFIG } = await import('../stripe');

      expect(() => STRIPE_CONFIG.basicPriceId).toThrow(
        '環境変数 STRIPE_BASIC_PRICE_ID が設定されていません'
      );
    });
  });

  describe('getPriceIdByPlan', () => {
    it('basic プランの Price ID を返す', async () => {
      const { getPriceIdByPlan } = await import('../stripe');

      expect(getPriceIdByPlan('basic')).toBe('price_basic_123');
    });

    it('premium プランの Price ID を返す', async () => {
      const { getPriceIdByPlan } = await import('../stripe');

      expect(getPriceIdByPlan('premium')).toBe('price_premium_456');
    });
  });

  describe('getPlanByPriceId', () => {
    it('basic の Price ID から basic を返す', async () => {
      const { getPlanByPriceId } = await import('../stripe');

      expect(getPlanByPriceId('price_basic_123')).toBe('basic');
    });

    it('premium の Price ID から premium を返す', async () => {
      const { getPlanByPriceId } = await import('../stripe');

      expect(getPlanByPriceId('price_premium_456')).toBe('premium');
    });

    it('不明な Price ID から free を返す', async () => {
      const { getPlanByPriceId } = await import('../stripe');

      expect(getPlanByPriceId('unknown_price_id')).toBe('free');
    });
  });
});
