import { render } from '@react-email/components';

import { getFromEmail, getResendClient } from './resend-client';
import { VerificationEmail } from './templates/verification';
import type { SendEmailResult, SendVerificationEmailParams } from './types';

/**
 * 認証メールを送信する
 */
export async function sendVerificationEmail(
  params: SendVerificationEmailParams
): Promise<SendEmailResult> {
  try {
    const resend = getResendClient();
    const fromEmail = getFromEmail();

    // React Email テンプレートを HTML に変換
    const html = await render(
      VerificationEmail({
        verificationUrl: params.verificationUrl,
        userName: params.userName,
      })
    );

    const result = await resend.emails.send({
      from: `xtrade <${fromEmail}>`,
      to: params.to,
      subject: 'メールアドレスを認証してください - xtrade',
      html,
    });

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
