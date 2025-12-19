import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// nodemailer をモック
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn(),
    })),
  },
}));

import nodemailer from 'nodemailer';
import { isMailpitEnabled, sendViaMailpit } from '../mailpit-client';

describe('mailpit-client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // 環境変数をリセット
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('isMailpitEnabled', () => {
    it('MAIL_PROVIDER=mailpit の場合は true を返す', () => {
      process.env.MAIL_PROVIDER = 'mailpit';
      expect(isMailpitEnabled()).toBe(true);
    });

    it('MAIL_PROVIDER=resend の場合は false を返す', () => {
      process.env.MAIL_PROVIDER = 'resend';
      expect(isMailpitEnabled()).toBe(false);
    });

    it('MAIL_PROVIDER が未設定の場合は false を返す', () => {
      delete process.env.MAIL_PROVIDER;
      expect(isMailpitEnabled()).toBe(false);
    });
  });

  describe('sendViaMailpit', () => {
    it('メール送信成功時は success: true と messageId を返す', async () => {
      const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'mailpit-msg-123' });
      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail: mockSendMail,
      } as unknown as ReturnType<typeof nodemailer.createTransport>);

      // モジュールをリセットして新しいトランスポーターを作成させる
      vi.resetModules();
      const { sendViaMailpit: freshSendViaMailpit } = await import('../mailpit-client');

      const result = await freshSendViaMailpit({
        from: 'noreply@test.com',
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('mailpit-msg-123');
    });

    it('送信エラー時は success: false とエラーメッセージを返す', async () => {
      const mockSendMail = vi.fn().mockRejectedValue(new Error('Connection refused'));
      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail: mockSendMail,
      } as unknown as ReturnType<typeof nodemailer.createTransport>);

      vi.resetModules();
      const { sendViaMailpit: freshSendViaMailpit } = await import('../mailpit-client');

      const result = await freshSendViaMailpit({
        from: 'noreply@test.com',
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection refused');
    });

    it('未知のエラー時は Unknown error を返す', async () => {
      const mockSendMail = vi.fn().mockRejectedValue('string error');
      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail: mockSendMail,
      } as unknown as ReturnType<typeof nodemailer.createTransport>);

      vi.resetModules();
      const { sendViaMailpit: freshSendViaMailpit } = await import('../mailpit-client');

      const result = await freshSendViaMailpit({
        from: 'noreply@test.com',
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });
});
