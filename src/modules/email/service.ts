import { render } from '@react-email/components';

import { isMailpitEnabled, sendViaMailpit } from './mailpit-client';
import { getFromEmail, getResendClient } from './resend-client';
import { VerificationEmail } from './templates/verification';
import type { SendEmailResult, SendVerificationEmailParams } from './types';

/**
 * 認証メールを送信する
 * MAIL_PROVIDER 環境変数で送信先を切り替え:
 * - mailpit: ローカル開発用 Mailpit (http://localhost:8025 で確認可能)
 * - resend: 本番環境用 Resend
 */
export async function sendVerificationEmail(
  params: SendVerificationEmailParams
): Promise<SendEmailResult> {
  try {
    const fromEmail = getFromEmail();

    // React Email テンプレートを HTML に変換
    const html = await render(
      VerificationEmail({
        verificationUrl: params.verificationUrl,
        userName: params.userName,
      })
    );

    const emailParams = {
      from: `xtrade <${fromEmail}>`,
      to: params.to,
      subject: 'メールアドレスを認証してください - xtrade',
      html,
    };

    // Mailpit が有効な場合はローカル SMTP 経由で送信
    if (isMailpitEnabled()) {
      console.log('[Email] Using Mailpit provider');
      return sendViaMailpit(emailParams);
    }

    // デフォルトは Resend 経由で送信
    console.log('[Email] Using Resend provider');
    const resend = getResendClient();
    const result = await resend.emails.send(emailParams);

    if (result.error) {
      console.error('[Email] Failed to send verification email:', result.error);
      return {
        success: false,
        error: result.error.message,
      };
    }

    console.log('[Email] Verification email sent:', result.data?.id);
    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error('[Email] Error sending verification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
