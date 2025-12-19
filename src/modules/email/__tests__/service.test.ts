import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Resend クライアントをモック
vi.mock('../resend-client', () => ({
  getResendClient: vi.fn(() => ({
    emails: {
      send: vi.fn(),
    },
  })),
  getFromEmail: vi.fn(() => 'noreply@test.com'),
}));

// Mailpit クライアントをモック
vi.mock('../mailpit-client', () => ({
  isMailpitEnabled: vi.fn(() => false),
  sendViaMailpit: vi.fn(),
}));

// テンプレートをモック
vi.mock('../templates/verification', () => ({
  VerificationEmail: vi.fn(() => '<div>Mock Email</div>'),
}));

// React Email の render をモック
vi.mock('@react-email/components', () => ({
  render: vi.fn(() => Promise.resolve('<html>Test Email</html>')),
}));

import { isMailpitEnabled, sendViaMailpit } from '../mailpit-client';
import { getResendClient } from '../resend-client';
import { sendVerificationEmail } from '../service';

describe('sendVerificationEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('メール送信成功時は success: true と messageId を返す', async () => {
    const mockSend = vi.fn().mockResolvedValue({
      data: { id: 'msg-123' },
      error: null,
    });

    vi.mocked(getResendClient).mockReturnValue({
      emails: { send: mockSend },
    } as unknown as ReturnType<typeof getResendClient>);

    const result = await sendVerificationEmail({
      to: 'user@example.com',
      verificationUrl: 'https://example.com/verify?token=abc',
      userName: 'Test User',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg-123');
    expect(mockSend).toHaveBeenCalledWith({
      from: 'xtrade <noreply@test.com>',
      to: 'user@example.com',
      subject: 'メールアドレスを認証してください - xtrade',
      html: '<html>Test Email</html>',
    });
  });

  it('Resend API がエラーを返した場合は success: false を返す', async () => {
    const mockSend = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Invalid API key' },
    });

    vi.mocked(getResendClient).mockReturnValue({
      emails: { send: mockSend },
    } as unknown as ReturnType<typeof getResendClient>);

    const result = await sendVerificationEmail({
      to: 'user@example.com',
      verificationUrl: 'https://example.com/verify?token=abc',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid API key');
  });

  it('例外発生時は success: false とエラーメッセージを返す', async () => {
    const mockSend = vi.fn().mockRejectedValue(new Error('Network error'));

    vi.mocked(getResendClient).mockReturnValue({
      emails: { send: mockSend },
    } as unknown as ReturnType<typeof getResendClient>);

    const result = await sendVerificationEmail({
      to: 'user@example.com',
      verificationUrl: 'https://example.com/verify?token=abc',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('未知のエラー時は Unknown error を返す', async () => {
    const mockSend = vi.fn().mockRejectedValue('string error');

    vi.mocked(getResendClient).mockReturnValue({
      emails: { send: mockSend },
    } as unknown as ReturnType<typeof getResendClient>);

    const result = await sendVerificationEmail({
      to: 'user@example.com',
      verificationUrl: 'https://example.com/verify?token=abc',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unknown error');
  });

  describe('Mailpit 切り替え', () => {
    it('MAIL_PROVIDER=mailpit の場合は Mailpit 経由で送信する', async () => {
      vi.mocked(isMailpitEnabled).mockReturnValue(true);
      vi.mocked(sendViaMailpit).mockResolvedValue({
        success: true,
        messageId: 'mailpit-msg-456',
      });

      const result = await sendVerificationEmail({
        to: 'user@example.com',
        verificationUrl: 'https://example.com/verify?token=abc',
        userName: 'Test User',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('mailpit-msg-456');
      expect(sendViaMailpit).toHaveBeenCalledWith({
        from: 'xtrade <noreply@test.com>',
        to: 'user@example.com',
        subject: 'メールアドレスを認証してください - xtrade',
        html: '<html>Test Email</html>',
      });
      expect(getResendClient).not.toHaveBeenCalled();
    });

    it('MAIL_PROVIDER=resend の場合は Resend 経由で送信する', async () => {
      vi.mocked(isMailpitEnabled).mockReturnValue(false);
      const mockSend = vi.fn().mockResolvedValue({
        data: { id: 'resend-msg-789' },
        error: null,
      });

      vi.mocked(getResendClient).mockReturnValue({
        emails: { send: mockSend },
      } as unknown as ReturnType<typeof getResendClient>);

      const result = await sendVerificationEmail({
        to: 'user@example.com',
        verificationUrl: 'https://example.com/verify?token=abc',
        userName: 'Test User',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('resend-msg-789');
      expect(sendViaMailpit).not.toHaveBeenCalled();
      expect(mockSend).toHaveBeenCalled();
    });
  });
});
