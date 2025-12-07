import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Resend をモック（クラスとしてモック）
class MockResend {
  emails = { send: vi.fn() };
}

vi.mock('resend', () => ({
  Resend: MockResend,
}));

describe('resend-client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getResendClient', () => {
    it('API キーが設定されている場合は Resend クライアントを返す', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';

      const { getResendClient } = await import('../resend-client');
      const client = getResendClient();

      expect(client).toBeDefined();
      expect(client.emails).toBeDefined();
    });

    it('API キーが設定されていない場合はエラーを投げる', async () => {
      delete process.env.RESEND_API_KEY;

      const { getResendClient } = await import('../resend-client');

      expect(() => getResendClient()).toThrow('RESEND_API_KEY is not configured');
    });

    it('シングルトンとして同じインスタンスを返す', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';

      const { getResendClient } = await import('../resend-client');
      const client1 = getResendClient();
      const client2 = getResendClient();

      expect(client1).toBe(client2);
    });
  });

  describe('getFromEmail', () => {
    it('RESEND_FROM_EMAIL が設定されている場合はその値を返す', async () => {
      process.env.RESEND_FROM_EMAIL = 'custom@example.com';

      const { getFromEmail } = await import('../resend-client');

      expect(getFromEmail()).toBe('custom@example.com');
    });

    it('RESEND_FROM_EMAIL が設定されていない場合はデフォルト値を返す', async () => {
      delete process.env.RESEND_FROM_EMAIL;

      const { getFromEmail } = await import('../resend-client');

      expect(getFromEmail()).toBe('no-reply@xtrade.tqer39.dev');
    });
  });
});
