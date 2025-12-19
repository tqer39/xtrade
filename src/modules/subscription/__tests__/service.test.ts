import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockDbQuery = {
  stripeCustomer: {
    findFirst: vi.fn(),
  },
  user: {
    findFirst: vi.fn(),
  },
  subscription: {
    findFirst: vi.fn(),
  },
};

const mockDbInsert = vi.fn().mockReturnValue({
  values: vi.fn(),
});

const mockDbUpdate = vi.fn().mockReturnValue({
  set: vi.fn().mockReturnValue({
    where: vi.fn(),
  }),
});

vi.mock('@/db', () => ({
  db: {
    query: mockDbQuery,
    insert: mockDbInsert,
    update: mockDbUpdate,
  },
}));

vi.mock('@/db/schema', () => ({
  stripeCustomer: {},
  subscription: {},
  user: {},
}));

const mockStripe = {
  customers: {
    create: vi.fn(),
  },
  checkout: {
    sessions: {
      create: vi.fn(),
    },
  },
  billingPortal: {
    sessions: {
      create: vi.fn(),
    },
  },
  subscriptions: {
    update: vi.fn(),
  },
};

vi.mock('@/lib/stripe', () => ({
  stripe: mockStripe,
  getPlanByPriceId: vi.fn().mockReturnValue('pro'),
  getPriceIdByPlan: vi.fn().mockReturnValue('price_test_pro'),
  STRIPE_CONFIG: {
    successUrl: 'http://localhost:3000/subscription?success=true',
    cancelUrl: 'http://localhost:3000/subscription?canceled=true',
  },
}));

vi.mock('nanoid', () => ({
  nanoid: () => 'test-nanoid-123',
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn().mockImplementation((a, b) => ({ field: a, value: b })),
}));

describe('subscription/service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrCreateStripeCustomer', () => {
    it('既存の Stripe Customer がある場合、その ID を返す', async () => {
      mockDbQuery.stripeCustomer.findFirst.mockResolvedValue({
        stripeCustomerId: 'cus_existing123',
      });

      const { getOrCreateStripeCustomer } = await import('../service');
      const result = await getOrCreateStripeCustomer('user-1', 'test@example.com');

      expect(result).toBe('cus_existing123');
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });

    it('Stripe Customer がない場合、新規作成して返す', async () => {
      mockDbQuery.stripeCustomer.findFirst.mockResolvedValue(null);
      mockStripe.customers.create.mockResolvedValue({ id: 'cus_new123' });

      const { getOrCreateStripeCustomer } = await import('../service');
      const result = await getOrCreateStripeCustomer('user-1', 'test@example.com');

      expect(result).toBe('cus_new123');
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        metadata: { userId: 'user-1' },
      });
      expect(mockDbInsert).toHaveBeenCalled();
    });
  });

  describe('getUserSubscription', () => {
    it('ユーザーが存在しない場合、free プランを返す', async () => {
      mockDbQuery.user.findFirst.mockResolvedValue(null);

      const { getUserSubscription } = await import('../service');
      const result = await getUserSubscription('user-1');

      expect(result).toEqual({
        plan: 'free',
        status: 'free',
      });
    });

    it('アクティブなサブスクリプションがない場合、free プランを返す', async () => {
      mockDbQuery.user.findFirst.mockResolvedValue({ id: 'user-1' });
      mockDbQuery.subscription.findFirst.mockResolvedValue(null);

      const { getUserSubscription } = await import('../service');
      const result = await getUserSubscription('user-1');

      expect(result).toEqual({
        plan: 'free',
        status: 'free',
      });
    });

    it('アクティブなサブスクリプションがある場合、詳細情報を返す', async () => {
      const mockEndDate = new Date('2024-12-31');
      mockDbQuery.user.findFirst.mockResolvedValue({
        id: 'user-1',
        subscriptionPlan: 'pro',
        subscriptionStatus: 'active',
      });
      mockDbQuery.subscription.findFirst.mockResolvedValue({
        status: 'active',
        currentPeriodEnd: mockEndDate,
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: 'sub_test123',
      });

      const { getUserSubscription } = await import('../service');
      const result = await getUserSubscription('user-1');

      expect(result).toEqual({
        plan: 'pro',
        status: 'active',
        currentPeriodEnd: mockEndDate,
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: 'sub_test123',
      });
    });
  });

  describe('createCheckoutSession', () => {
    it('Checkout Session URL を返す', async () => {
      mockDbQuery.stripeCustomer.findFirst.mockResolvedValue({
        stripeCustomerId: 'cus_existing123',
      });
      mockStripe.checkout.sessions.create.mockResolvedValue({
        url: 'https://checkout.stripe.com/test-session',
      });

      const { createCheckoutSession } = await import('../service');
      const result = await createCheckoutSession({
        userId: 'user-1',
        userEmail: 'test@example.com',
        plan: 'pro',
      });

      expect(result).toBe('https://checkout.stripe.com/test-session');
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalled();
    });

    it('URL が取得できない場合、エラーをスロー', async () => {
      mockDbQuery.stripeCustomer.findFirst.mockResolvedValue({
        stripeCustomerId: 'cus_existing123',
      });
      mockStripe.checkout.sessions.create.mockResolvedValue({
        url: null,
      });

      const { createCheckoutSession } = await import('../service');
      await expect(
        createCheckoutSession({
          userId: 'user-1',
          userEmail: 'test@example.com',
          plan: 'pro',
        })
      ).rejects.toThrow('Checkout セッションの URL が取得できませんでした');
    });
  });

  describe('createPortalSession', () => {
    it('Portal Session URL を返す', async () => {
      mockDbQuery.stripeCustomer.findFirst.mockResolvedValue({
        stripeCustomerId: 'cus_existing123',
      });
      mockStripe.billingPortal.sessions.create.mockResolvedValue({
        url: 'https://billing.stripe.com/test-portal',
      });

      const { createPortalSession } = await import('../service');
      const result = await createPortalSession({
        userId: 'user-1',
      });

      expect(result).toBe('https://billing.stripe.com/test-portal');
    });

    it('Stripe Customer が見つからない場合、エラーをスロー', async () => {
      mockDbQuery.stripeCustomer.findFirst.mockResolvedValue(null);

      const { createPortalSession } = await import('../service');
      await expect(
        createPortalSession({
          userId: 'user-1',
        })
      ).rejects.toThrow('Stripe customer not found');
    });
  });

  describe('cancelSubscription', () => {
    it('サブスクリプションをキャンセル', async () => {
      mockDbQuery.user.findFirst.mockResolvedValue({
        id: 'user-1',
        subscriptionPlan: 'pro',
        subscriptionStatus: 'active',
      });
      mockDbQuery.subscription.findFirst.mockResolvedValue({
        status: 'active',
        stripeSubscriptionId: 'sub_test123',
      });
      mockStripe.subscriptions.update.mockResolvedValue({});

      const { cancelSubscription } = await import('../service');
      await cancelSubscription('user-1');

      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_test123', {
        cancel_at_period_end: true,
      });
      expect(mockDbUpdate).toHaveBeenCalled();
    });

    it('アクティブなサブスクリプションがない場合、エラーをスロー', async () => {
      mockDbQuery.user.findFirst.mockResolvedValue(null);

      const { cancelSubscription } = await import('../service');
      await expect(cancelSubscription('user-1')).rejects.toThrow('No active subscription found');
    });
  });

  describe('syncSubscriptionFromStripe', () => {
    it('新規サブスクリプションを作成', async () => {
      mockDbQuery.stripeCustomer.findFirst.mockResolvedValue({
        userId: 'user-1',
      });
      mockDbQuery.subscription.findFirst.mockResolvedValue(null);

      const { syncSubscriptionFromStripe } = await import('../service');
      await syncSubscriptionFromStripe({
        id: 'sub_new123',
        status: 'active',
        customer: 'cus_test123',
        items: { data: [{ price: { id: 'price_test_pro' } }] },
        current_period_start: 1704067200,
        current_period_end: 1706745600,
        cancel_at_period_end: false,
        canceled_at: null,
        ended_at: null,
      });

      expect(mockDbInsert).toHaveBeenCalled();
      expect(mockDbUpdate).toHaveBeenCalled();
    });

    it('既存サブスクリプションを更新', async () => {
      mockDbQuery.stripeCustomer.findFirst.mockResolvedValue({
        userId: 'user-1',
      });
      mockDbQuery.subscription.findFirst.mockResolvedValue({
        id: 'existing-sub',
        stripeSubscriptionId: 'sub_existing123',
      });

      const { syncSubscriptionFromStripe } = await import('../service');
      await syncSubscriptionFromStripe({
        id: 'sub_existing123',
        status: 'active',
        customer: 'cus_test123',
        items: { data: [{ price: { id: 'price_test_pro' } }] },
        current_period_start: 1704067200,
        current_period_end: 1706745600,
        cancel_at_period_end: false,
        canceled_at: null,
        ended_at: null,
      });

      // 2回呼ばれる: subscription 更新と user 更新
      expect(mockDbUpdate).toHaveBeenCalledTimes(2);
    });

    it('Customer が見つからない場合、早期リターン', async () => {
      mockDbQuery.stripeCustomer.findFirst.mockResolvedValue(null);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { syncSubscriptionFromStripe } = await import('../service');
      await syncSubscriptionFromStripe({
        id: 'sub_test123',
        status: 'active',
        customer: 'cus_unknown',
        items: { data: [{ price: { id: 'price_test_pro' } }] },
        current_period_start: 1704067200,
        current_period_end: 1706745600,
        cancel_at_period_end: false,
        canceled_at: null,
        ended_at: null,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Customer not found for subscription sync:',
        'cus_unknown'
      );
      expect(mockDbInsert).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
