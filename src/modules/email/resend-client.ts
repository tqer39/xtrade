import { Resend } from 'resend';

/**
 * Resend クライアントのシングルトンインスタンス
 */
let resendClient: Resend | null = null;

/**
 * Resend クライアントを取得
 * 環境変数 RESEND_API_KEY が必要
 */
export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * 送信元メールアドレスを取得
 */
export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || 'noreply@xtrade.tqer39.dev';
}
