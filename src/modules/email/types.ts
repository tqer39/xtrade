/**
 * メール送信に関する型定義
 */

/**
 * 認証メール送信パラメータ
 */
export interface SendVerificationEmailParams {
  /** 送信先メールアドレス */
  to: string;
  /** 認証用 URL */
  verificationUrl: string;
  /** ユーザー名（表示用） */
  userName?: string;
}

/**
 * メール送信結果
 */
export interface SendEmailResult {
  /** 送信成功かどうか */
  success: boolean;
  /** Resend のメッセージ ID */
  messageId?: string;
  /** エラーメッセージ */
  error?: string;
}

/**
 * メールバリデーション結果
 */
export interface EmailValidationResult {
  /** バリデーション成功かどうか */
  valid: boolean;
  /** エラーメッセージ */
  error?: string;
}
