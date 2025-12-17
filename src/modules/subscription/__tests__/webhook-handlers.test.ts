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

vi.mock('../service', () => ({
  syncSubscriptionFromStripe: vi.fn(),
}));

vi.mock('nanoid', () => ({
  nanoid: () => 'test-nanoid-123',
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn().mockImplementation((a, b) => ({ field: a, value: b })),
}));

describe('subscription/webhook-handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbQuery.paymentEvent.findFirst.mockResolvedValue(null);
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
      const { syncSubscriptionFromStripe } = await import('../service');

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

      expect(syncSubscriptionFromStripe).not.toHaveBeenCalled();
    });
  });
});
