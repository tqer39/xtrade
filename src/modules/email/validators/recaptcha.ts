/**
 * Google reCAPTCHA v3 検証
 *
 * ボット対策として、メール送信リクエスト時に reCAPTCHA トークンを検証
 */

interface RecaptchaVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * reCAPTCHA v3 トークンを検証
 *
 * @param token - クライアントから送信された reCAPTCHA トークン
 * @param expectedAction - 期待するアクション名（例: 'send_verification_email'）
 * @returns 検証結果
 *
 * @example
 * ```ts
 * const result = await verifyRecaptcha(token, 'send_verification_email');
 * if (!result.success) {
 *   return { error: 'reCAPTCHA verification failed' };
 * }
 * ```
 */
export async function verifyRecaptcha(
  token: string,
  expectedAction: string
): Promise<{ success: boolean; score?: number; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // 開発環境では reCAPTCHA をスキップ可能
  if (!secretKey) {
    console.warn('[reCAPTCHA] Secret key not configured, skipping verification');
    return { success: true };
  }

  if (!token) {
    return {
      success: false,
      error: 'reCAPTCHA token is required',
    };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data: RecaptchaVerifyResponse = await response.json();

    if (!data.success) {
      console.warn('[reCAPTCHA] Verification failed:', data['error-codes']);
      return {
        success: false,
        error: 'reCAPTCHA verification failed',
      };
    }

    // アクション名の検証
    if (data.action && data.action !== expectedAction) {
      console.warn('[reCAPTCHA] Action mismatch:', data.action, '!==', expectedAction);
      return {
        success: false,
        error: 'Invalid reCAPTCHA action',
      };
    }

    // スコアの検証（0.5 以上を要求、v3 のデフォルト推奨値）
    const score = data.score ?? 1;
    if (score < 0.5) {
      console.warn('[reCAPTCHA] Low score:', score);
      return {
        success: false,
        score,
        error: 'reCAPTCHA score too low',
      };
    }

    return {
      success: true,
      score,
    };
  } catch (error) {
    console.error('[reCAPTCHA] Error verifying token:', error);
    return {
      success: false,
      error: 'reCAPTCHA verification error',
    };
  }
}
