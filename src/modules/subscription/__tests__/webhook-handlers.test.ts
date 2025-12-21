import type Stripe from 'stripe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// モック設定
const mockDbQuery = {
  paymentEvent: {
    findFirst: vi.fn(),
  },
  stripeCustomer: {
    findFirst: vi.fn(),
  },
};

const mockDbInsertValues = vi.fn();
const mockDbInsert = vi.fn().mockReturnValue({
  values: mockDbInsertValues,
});

const mockDbUpdateWhere = vi.fn();
const mockDbUpdateSet = vi.fn().mockReturnValue({
  where: mockDbUpdateWhere,
});
const mockDbUpdate = vi.fn().mockReturnValue({
  set: mockDbUpdateSet,
});

vi.mock('@/db', () => ({
  db: {
    query: mockDbQuery,
    insert: mockDbInsert,
    update: mockDbUpdate,
  },
}));

vi.mock('@/db/schema', () => ({
  paymentEvent: {},
  stripeCustomer: { stripeCustomerId: 'stripeCustomerId' },
  user: {},
}));

const mockSyncSubscriptionFromStripe = vi.fn();
vi.mock('../service', () => ({
  syncSubscriptionFromStripe: mockSyncSubscriptionFromStripe,
}));

vi.mock('nanoid', () => ({
  nanoid: () => 'test-nanoid-123',
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn().mockImplementation((a, b) => ({ field: a, value: b })),
}));

const mockStripeSubscriptionsRetrieve = vi.fn();
vi.mock('@/lib/stripe', () => ({
  stripe: {
    subscriptions: {
      retrieve: mockStripeSubscriptionsRetrieve,
    },
  },
}));

describe('subscription/webhook-handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // イベント未処理をモック（processedAt が null = 未処理）
    mockDbQuery.paymentEvent.findFirst.mockResolvedValue({ processedAt: null });
    mockDbQuery.stripeCustomer.findFirst.mockResolvedValue({ userId: 'user-1' });
  });

  describe('processWebhookEvent', () => {
    it('既に処理済みのイベントはスキップ', async () => {
      mockDbQuery.paymentEvent.findFirst.mockResolvedValue({
        processedAt: new Date(),
      });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { processWebhookEvent } = await import('../webhook-handlers');
      await processWebhookEvent({
        id: 'evt_processed123',
        type: 'checkout.session.completed',
        data: { object: {} },
      } as Stripe.Event);

      expect(consoleSpy).toHaveBeenCalledWith('Event evt_processed123 already processed, skipping');
      consoleSpy.mockRestore();
    });

    it('checkout.session.completed で subscription モード以外は無視', async () => {
      const { processWebhookEvent } = await import('../webhook-handlers');
      const { syncSubscriptionFromStripe } = await import('../service');

      await processWebhookEvent({
        id: 'evt_payment123',
        type: 'checkout.session.completed',
        data: {
          object: {
            mode: 'payment',
            metadata: { userId: 'user-1' },
          },
        },
      } as unknown as Stripe.Event);

      expect(syncSubscriptionFromStripe).not.toHaveBeenCalled();
    });

    it('invoice.paid で subscription がない場合は無視', async () => {
      const { processWebhookEvent } = await import('../webhook-handlers');
      const { syncSubscriptionFromStripe } = await import('../service');

      await processWebhookEvent({
        id: 'evt_invoice_no_sub123',
        type: 'invoice.paid',
        data: {
          object: {
            subscription: null,
            customer: 'cus_test123',
          },
        },
      } as unknown as Stripe.Event);

      expect(syncSubscriptionFromStripe).not.toHaveBeenCalled();
    });

    it('invoice.payment_failed で subscription がない場合は無視', async () => {
      const { processWebhookEvent } = await import('../webhook-handlers');

      await processWebhookEvent({
        id: 'evt_invoice_fail_no_sub123',
        type: 'invoice.payment_failed',
        data: {
          object: {
            subscription: null,
            customer: 'cus_test123',
          },
        },
      } as unknown as Stripe.Event);

      expect(mockSyncSubscriptionFromStripe).not.toHaveBeenCalled();
    });

    it('未知のイベントタイプは正常に処理される', async () => {
      const { processWebhookEvent } = await import('../webhook-handlers');

      // 未知のイベントタイプでもエラーにならない
      await expect(
        processWebhookEvent({
          id: 'evt_unknown123',
          type: 'unknown.event.type',
          data: {
            object: {},
          },
        } as unknown as Stripe.Event)
      ).resolves.not.toThrow();
    });

    it('checkout.session.completed で subscription モードは同期される', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        status: 'active',
      };
      mockStripeSubscriptionsRetrieve.mockResolvedValue(mockSubscription);

      const { processWebhookEvent } = await import('../webhook-handlers');

      await processWebhookEvent({
        id: 'evt_checkout123',
        type: 'checkout.session.completed',
        data: {
          object: {
            mode: 'subscription',
            subscription: 'sub_test123',
            metadata: { userId: 'user-1' },
          },
        },
      } as unknown as Stripe.Event);

      expect(mockStripeSubscriptionsRetrieve).toHaveBeenCalledWith('sub_test123');
      expect(mockSyncSubscriptionFromStripe).toHaveBeenCalledWith(mockSubscription);
    });

    it('customer.subscription.created で同期される', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        status: 'active',
        customer: 'cus_test123',
      };

      const { processWebhookEvent } = await import('../webhook-handlers');

      await processWebhookEvent({
        id: 'evt_sub_created123',
        type: 'customer.subscription.created',
        data: {
          object: mockSubscription,
        },
      } as unknown as Stripe.Event);

      expect(mockSyncSubscriptionFromStripe).toHaveBeenCalledWith(mockSubscription);
    });

    it('customer.subscription.updated で同期される', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        status: 'active',
        customer: 'cus_test123',
      };

      const { processWebhookEvent } = await import('../webhook-handlers');

      await processWebhookEvent({
        id: 'evt_sub_updated123',
        type: 'customer.subscription.updated',
        data: {
          object: mockSubscription,
        },
      } as unknown as Stripe.Event);

      expect(mockSyncSubscriptionFromStripe).toHaveBeenCalledWith(mockSubscription);
    });

    it('customer.subscription.deleted で同期される', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        status: 'canceled',
        customer: 'cus_test123',
      };

      const { processWebhookEvent } = await import('../webhook-handlers');

      await processWebhookEvent({
        id: 'evt_sub_deleted123',
        type: 'customer.subscription.deleted',
        data: {
          object: mockSubscription,
        },
      } as unknown as Stripe.Event);

      expect(mockSyncSubscriptionFromStripe).toHaveBeenCalledWith(mockSubscription);
    });

    it('invoice.paid で subscription がある場合は同期される', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        status: 'active',
      };
      mockStripeSubscriptionsRetrieve.mockResolvedValue(mockSubscription);

      const { processWebhookEvent } = await import('../webhook-handlers');

      await processWebhookEvent({
        id: 'evt_invoice_paid123',
        type: 'invoice.paid',
        data: {
          object: {
            subscription: 'sub_test123',
            customer: 'cus_test123',
          },
        },
      } as unknown as Stripe.Event);

      expect(mockStripeSubscriptionsRetrieve).toHaveBeenCalledWith('sub_test123');
      expect(mockSyncSubscriptionFromStripe).toHaveBeenCalledWith(mockSubscription);
    });

    it('invoice.payment_failed で subscription がある場合は同期される', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        status: 'past_due',
      };
      mockStripeSubscriptionsRetrieve.mockResolvedValue(mockSubscription);

      const { processWebhookEvent } = await import('../webhook-handlers');

      await processWebhookEvent({
        id: 'evt_invoice_failed123',
        type: 'invoice.payment_failed',
        data: {
          object: {
            subscription: 'sub_test123',
            customer: 'cus_test123',
          },
        },
      } as unknown as Stripe.Event);

      expect(mockStripeSubscriptionsRetrieve).toHaveBeenCalledWith('sub_test123');
      expect(mockSyncSubscriptionFromStripe).toHaveBeenCalledWith(mockSubscription);
    });

    // 注: recordEvent の詳細テストは複雑なDB呼び出しチェーンのため、統合テストでカバー
  });
});
